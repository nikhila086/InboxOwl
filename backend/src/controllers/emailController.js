const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const getGmailClient = require('../utils/gmailClient');

async function getEmailDetails(gmail, messageId) {
  const msgRes = await gmail.users.messages.get({ userId: 'me', id: messageId });
  const payload = msgRes.data.payload;
  const headers = payload.headers || [];
  
  // Extract sender email and name from the From header
  const fromHeader = headers.find(h => h.name === 'From')?.value || '';
  let sender = fromHeader;
  
  // Try to parse out the name if it's in the format "Name <email@example.com>"
  const match = fromHeader.match(/^([^<]*?)\s*<([^>]+)>$/);
  if (match) {
    sender = match[1].trim() || match[2]; // Use name if available, otherwise use email
  }
  
  return {
    id: messageId,
    subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
    sender: sender || 'Unknown Sender',
    date: headers.find(h => h.name === 'Date')?.value || new Date().toISOString(),
    snippet: msgRes.data.snippet || '',
    labels: (msgRes.data.labelIds || []).join(',')
  };
}

async function saveEmailToDb(email, userId) {
  return prisma.email.upsert({
    where: { id: email.id },
    update: {},
    create: {
      id: email.id,
      subject: email.subject,
      sender: email.from,
      snippet: email.snippet,
      labels: email.labels,
      date: email.date,
      userId,
    },
  });
}

exports.getEmails = async (req, res) => {
  try {
    if (!req.user?.accessToken) {
      console.log('User not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const gmail = getGmailClient(req.user.accessToken);
    const maxResults = parseInt(req.query.maxResults, 10) || 20;
    const categoryId = req.query.categoryId;
    
    console.log('Fetching emails for user:', req.user.email);

    let query = {
      where: { userId: req.user.id },
      include: {
        categories: true
      },
      orderBy: { date: 'desc' }
    };

    if (categoryId) {
      query.where.categories = {
        some: { id: parseInt(categoryId) }
      };
    }

    // First check if we need to fetch new emails
    const existingEmails = await prisma.email.findMany(query);
    
    if (existingEmails.length < maxResults) {
      const messagesRes = await gmail.users.messages.list({ 
        userId: 'me', 
        maxResults: maxResults * 2, // Fetch extra to account for potential duplicates
        labelIds: ['INBOX'],
      });
      
      const messages = messagesRes.data.messages || [];
      console.log(`Found ${messages.length} messages`);
      
      const { applyRulesToEmail } = require('./ruleController');
      
      for (const msg of messages) {
        try {
          const emailDetails = await getEmailDetails(gmail, msg.id);
          const savedEmail = await saveEmailToDb(emailDetails, req.user.id);
          // Apply rules to the new email
          await applyRulesToEmail(savedEmail, req.user.id);
        } catch (error) {
          console.error(`Error processing email ${msg.id}:`, error);
        }
      }
      
      // Fetch again after processing new emails
      existingEmails = await prisma.email.findMany(query);
    }

    const emails = existingEmails.slice(0, maxResults);
    console.log(`Returning ${emails.length} emails`);
    res.json(emails);
  } catch (error) {
    console.error('Email fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
  }
};
