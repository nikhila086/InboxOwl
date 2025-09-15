const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const getGmailClient = require('../utils/gmailClient');
const EmailAnalysisService = require('../services/emailAnalysisService');
const SyncCache = require('../services/syncCacheService');

// Get unique senders for autocomplete
exports.getUniqueSenders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const senders = await prisma.email.findMany({
      where: { userId: req.user.id },
      select: { sender: true, senderEmail: true },
    });
    // Deduplicate by senderEmail
    const unique = {};
    for (const s of senders) {
      if (s.senderEmail) unique[s.senderEmail] = s.sender;
    }
    const result = Object.entries(unique).map(([email, name]) => ({ name, email }));
    res.json(result);
  } catch (error) {
    console.error('Get unique senders error:', error);
    res.status(500).json({ error: error.message });
  }
};


// Helper function to fetch and process emails with throttling and optimization
async function fetchAndProcessEmails(gmail, userId, maxResults = 20) {
  console.log(`Fetching up to ${maxResults} messages from Gmail`);
  
  // Use a history ID if available to only get new messages
  let historyId = null;
  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    
    if (userSettings?.lastHistoryId) {
      historyId = userSettings.lastHistoryId;
    }
  } catch (error) {
    console.warn('Could not get history ID:', error);
  }
  
  // Construct the Gmail API request
  const listParams = {
    userId: 'me',
    maxResults: maxResults,
    labelIds: ['INBOX'],
    orderBy: 'internalDate'
  };
  
  const response = await gmail.users.messages.list(listParams);
  
  // Store the new history ID if available
  if (response.data.historyId) {
    try {
      await prisma.userSettings.upsert({
        where: { userId },
        update: { lastHistoryId: response.data.historyId },
        create: { userId, lastHistoryId: response.data.historyId }
      });
    } catch (error) {
      console.warn('Could not update history ID:', error);
    }
  }

  const gmailMessages = response.data.messages || [];
  console.log(`Found ${gmailMessages.length} messages to process`);
  
  // Check which messages we already have in the database to avoid re-processing
  const existingEmailIds = await prisma.email.findMany({
    where: {
      userId,
      externalId: {
        in: gmailMessages.map(msg => msg.id)
      }
    },
    select: {
      id: true,
      externalId: true,
      content: true  // Check if we already have content
    }
  });
  
  const existingIdsMap = existingEmailIds.reduce((acc, email) => {
    acc[email.externalId] = email.content?.length > 20; // true if we have substantial content
    return acc;
  }, {});
  
  // Only process messages we don't have or don't have content for
  const messagesToProcess = gmailMessages.filter(msg => !existingIdsMap[msg.id]);
  console.log(`Processing ${messagesToProcess.length} new messages (skipping ${gmailMessages.length - messagesToProcess.length} existing ones)`);
  
  // Process in batches to avoid overloading
  const batchSize = 3;
  const processedEmails = [];
  
  for (let i = 0; i < messagesToProcess.length; i += batchSize) {
    const batch = messagesToProcess.slice(i, i + batchSize);
    
    // Process this batch
    const batchResults = await Promise.all(
      batch.map(async (message) => {
        try {
          const emailDetails = await getEmailDetails(gmail, message.id);
          const savedEmail = await saveEmailToDb(emailDetails, userId);

          // Evaluate rules and assign categories
          await evaluateRulesAndAssignCategories(savedEmail, userId);

          return savedEmail;
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          return null;
        }
      })
    );
    
    processedEmails.push(...batchResults.filter(Boolean));
    
    // Small delay between batches to avoid API rate limits
    if (i + batchSize < messagesToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return processedEmails;
}

async function getEmailDetails(gmail, messageId) {
  const msgRes = await gmail.users.messages.get({ 
    userId: 'me', 
    id: messageId, 
    format: 'full' 
  });
  
  const payload = msgRes.data.payload;
  const headers = payload.headers || [];
  
  // Extract sender email and name from the From header
  const fromHeader = headers.find(h => h.name === 'From')?.value || '';
  let sender = fromHeader;
  let senderEmail = '';
  
  // Try to parse out the name and email if it's in the format "Name <email@example.com>"
  const match = fromHeader.match(/^([^<]*?)\s*<([^>]+)>$/);
  if (match) {
    sender = match[1].trim() || match[2]; // Use name if available, otherwise use email
    senderEmail = match[2]; // Extract the email address
  } else {
    // If no name is provided, just use the email
    senderEmail = fromHeader;
    sender = fromHeader;
  }

  // Extract email content from the message payload
  let content = '';
  
  function getContent(part) {
    if (part.mimeType === 'text/plain' && part.body.data) {
      return Buffer.from(part.body.data, 'base64').toString();
    }
    if (part.parts) {
      return part.parts.map(getContent).join('\n');
    }
    return '';
  }

  // Get content from either the body directly or from parts
  if (payload.body?.data) {
    content = Buffer.from(payload.body.data, 'base64').toString();
  } else if (payload.parts) {
    content = getContent(payload);
  }

  const dateHeader = headers.find(h => h.name === 'Date')?.value;
  const date = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
  
  return {
    id: messageId,
    subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
    sender: sender || 'Unknown Sender',
    senderEmail: senderEmail || '',
    to: headers.find(h => h.name === 'To')?.value || null,
    date: date,
    snippet: msgRes.data.snippet || '',
    content: content || '',
    labels: msgRes.data.labelIds || [],
    threadId: msgRes.data.threadId || null
  };
}

async function saveEmailToDb(email, userId) {
  return prisma.email.upsert({
    where: { id: email.id },
    update: {
      content: email.content,
      date: new Date(email.date),
      labels: email.labels || [],
      externalId: email.id,
      senderEmail: email.senderEmail || null
    },
    create: {
      id: email.id,
      externalId: email.id,
      subject: email.subject || '',
      sender: email.sender || '',
      senderEmail: email.senderEmail || null,
      to: email.to || null,
      snippet: email.snippet || '',
      content: email.content || null,
      labels: email.labels || [],
      date: new Date(email.date),
      threadId: email.threadId || null,
      userId,
    },
  });
}

// Function to evaluate rules and assign categories to emails
async function evaluateRulesAndAssignCategories(email, userId) {
  const rules = await prisma.rule.findMany({
    where: {
      userId,
      isActive: true
    },
  });

  for (const rule of rules) {
    const { field, conditionType, value } = rule;
    let emailFieldValue = email[field];

    if (!emailFieldValue) continue;

    // Check condition based on conditionType
    let isMatch = false;
    switch (conditionType) {
      case 'contains':
        isMatch = emailFieldValue.includes(value);
        break;
      case 'regex':
        isMatch = new RegExp(value).test(emailFieldValue);
        break;
      default:
        console.warn(`Unknown condition type: ${conditionType}`);
    }

    if (isMatch) {
      // Assign category to the email
      await prisma.email.update({
        where: { id: email.id },
        data: {
          categories: {
            connect: { id: rule.categoryId }
          }
        }
      });
      console.log(`Email ${email.id} categorized under ${rule.categoryId} based on rule ${rule.id}`);
      break; // Stop after the first matching rule
    }
  }
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

    try {
      // Fetch and process new emails
      await fetchAndProcessEmails(gmail, req.user.id, maxResults);
    } catch (error) {
      console.error('Error fetching new messages:', error);
      // Continue even if Gmail fetch fails - we'll return cached emails
    }

    // Get emails from database with proper ordering and filtering
    let query = {
      where: { userId: req.user.id },
      include: {
        categories: true,
        analysis: true
      },
      orderBy: { date: 'desc' },
      take: maxResults
    };

    if (categoryId) {
      query.where.categories = {
        some: { id: parseInt(categoryId) }
      };
    }

    const emails = await prisma.email.findMany(query);
    res.json(emails);

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

exports.syncEmails = async (req, res) => {
  try {
    if (!req.user?.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if a sync was recently performed using our server-side cache
    if (SyncCache.wasRecentlySynced(req.user.id)) {
      console.log(`Skipping sync for ${req.user.email} - too soon since last sync`);
      
      // Instead of returning an empty response, return the most recent emails
      const recentEmails = await prisma.email.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
        take: 20,
        include: {
          categories: true,
          analysis: true
        }
      });
      
      // Set cache headers
      const lastSyncTime = SyncCache.getLastSyncTime(req.user.id);
      if (lastSyncTime) {
        res.set('Last-Modified', new Date(lastSyncTime).toUTCString());
      }
      
      return res.json(recentEmails);
    }
    
    // Also check client-side cache via If-Modified-Since header
    const lastSyncHeader = req.headers['if-modified-since'];
    if (lastSyncHeader) {
      const lastSyncTime = new Date(lastSyncHeader).getTime();
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTime;
      
      // If less than 30 seconds since last sync, return 304 Not Modified
      if (timeSinceLastSync < 30000) {
        console.log(`Skipping sync via If-Modified-Since - ${Math.round(timeSinceLastSync/1000)}s since last sync`);
        return res.status(304).json({ message: 'Not modified' });
      }
    }
    
    // Record this sync operation in our cache
    SyncCache.recordSync(req.user.id);
    
    console.log(`Starting email sync for user: ${req.user.email}`);
    const syncStartTime = Date.now();
    
    const gmail = getGmailClient(req.user.accessToken);
    
    // Also update the database record of last sync time
    try {
      await prisma.userSettings.upsert({
        where: { userId: req.user.id },
        update: { lastSyncTime: new Date() },
        create: { userId: req.user.id, lastSyncTime: new Date() }
      });
    } catch (settingsError) {
      console.warn('Failed to update user sync settings:', settingsError);
      // Continue with sync anyway
    }
    
    // Fetch and process new emails - limit to 10 for faster sync
    const processedEmails = await fetchAndProcessEmails(gmail, req.user.id, 10);
    
    // Get all emails including the new ones
    const emails = await prisma.email.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        categories: true,
        analysis: true
      }
    });
    
    const syncDuration = Date.now() - syncStartTime;
    console.log(`Sync completed in ${syncDuration}ms, found ${processedEmails.length} new emails`);
    
    // Set last-modified header for client-side caching
    res.set('Last-Modified', new Date().toUTCString());
    // Set cache control headers
    res.set('Cache-Control', 'private, max-age=30');
    
    return res.json(emails);

  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

exports.getEmailById = async (req, res) => {
  try {
    if (!req.user?.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    
    // If middleware found this email in cache, it would have already responded
    // So we know we need to fetch it from Gmail or database
    
    const gmail = getGmailClient(req.user.accessToken);
    
    try {
      // Try to get from database first (faster than Gmail API)
      const dbEmail = await prisma.email.findUnique({
        where: { id },
        include: { analysis: true }
      });
      
      // If we have this email with content in DB, use it
      if (dbEmail && dbEmail.content && dbEmail.content.length > 20) {
        console.log(`Using database copy for email ${id}`);
        // Cache the result for future requests
        if (res.cacheEmail) {
          res.cacheEmail(dbEmail);
        }
        return res.json(dbEmail);
      }
      
      // Otherwise fetch fresh content from Gmail
      console.log(`Fetching email ${id} from Gmail API`);
      const details = await getEmailDetails(gmail, id);
      const email = await saveEmailToDb(details, req.user.id);
      
      // Include the analysis if it exists
      const emailWithAnalysis = await prisma.email.findUnique({
        where: { id },
        include: { analysis: true }
      });

      // Cache the result for future requests
      if (res.cacheEmail) {
        res.cacheEmail(emailWithAnalysis);
      }
      
      return res.json(emailWithAnalysis);
    } catch (error) {
      // If Gmail fetch fails, try to return cached version from DB
      const cachedEmail = await prisma.email.findUnique({
        where: { id },
        include: { analysis: true }
      });

      if (cachedEmail) {
        if (res.cacheEmail) {
          res.cacheEmail(cachedEmail);
        }
        return res.json(cachedEmail);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
};

// Create a new rule
async function createRule(req, res) {
  const { name, description, field, conditionType, value, categoryId, userId } = req.body;

  try {
    const newRule = await prisma.rule.create({
      data: {
        name,
        description,
        field,
        conditionType,
        value,
        categoryId,
        userId,
      },
    });
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
}

// Fetch all rules for a user
async function getRules(req, res) {
  const { userId } = req.params;

  try {
    const rules = await prisma.rule.findMany({
      where: { userId },
    });
    res.status(200).json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
}

// Update an existing rule
async function updateRule(req, res) {
  const { id } = req.params;
  const { name, description, field, conditionType, value, categoryId, isActive } = req.body;

  try {
    const updatedRule = await prisma.rule.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        description,
        field,
        conditionType,
        value,
        categoryId,
        isActive,
      },
    });
    res.status(200).json(updatedRule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
}

// Delete a rule
async function deleteRule(req, res) {
  const { id } = req.params;

  try {
    await prisma.rule.delete({
      where: { id: parseInt(id, 10) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
}

module.exports = {
  getEmails: exports.getEmails,
  syncEmails: exports.syncEmails,
  getEmailById: exports.getEmailById,
  createRule: exports.createRule,
  getRules: exports.getRules,
  updateRule: exports.updateRule,
  deleteRule: exports.deleteRule,
  getUniqueSenders: exports.getUniqueSenders,
};

console.log('Exported functions:', Object.keys(module.exports));
