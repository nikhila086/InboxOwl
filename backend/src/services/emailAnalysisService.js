const natural = require('natural');
const { PrismaClient } = require('@prisma/client');
const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize tokenizer and other NLP tools
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();
const sentenceTokenizer = new natural.SentenceTokenizer();

// Initialize HuggingFace client
const hf = process.env.HUGGINGFACE_API_KEY ? 
  new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? 
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Common phishing keywords and patterns
const PHISHING_KEYWORDS = [
  'urgent', 'action required', 'account suspended', 'verify your account',
  'click here', 'login to verify', 'unusual activity', 'suspicious activity',
  'password expired', 'win', 'winner', 'congratulations', 'claim your prize'
];

const SUSPICIOUS_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co'
];

class EmailAnalysisService {
  /**
   * Analyze an email for spam, categorization and generate summary
   * 
   * @param {Object} emailData - Email data to analyze
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body content
   * @param {string} emailData.emailId - Email ID for persistence
   * @returns {Object} Analysis results
   */
  static async analyzeEmail({ subject, body, emailId }) {
    try {
      const combinedContent = `${subject || ''} ${body || ''}`.toLowerCase();
      
      // Check if analysis already exists and it's not a forced refresh
      if (emailId) {
        const existingAnalysis = await prisma.emailAnalysis.findUnique({
          where: { emailId },
        });
        
        if (existingAnalysis) {
          console.log('Using cached analysis for email:', emailId);
          return existingAnalysis;
        }
      }
      
      // Try using Google Gemini for complete analysis
      let result = null;
      if (process.env.GEMINI_API_KEY) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
          const prompt = `
          Analyze this email for spam and security concerns:
          Subject: ${subject || '(No subject)'}
          Body: ${body || '(No content)'}

          Please provide:
          1. A spam score between 0 and 1 (where 1 is definitely spam)
          2. Whether it's spam (true if score > 0.6, otherwise false)
          3. A list of specific reasons for the classification (mention specific suspicious elements)
          4. A brief, informative summary of the email content focused on key points and any action items

          Format the response as JSON with these keys:
          {
            "spamScore": number,
            "isSpam": boolean,
            "reasons": string[],
            "summary": string
          }
          `;

          const geminiResponse = await model.generateContent(prompt);
          const responseText = geminiResponse.response.text();
          
          try {
            result = JSON.parse(responseText);
            // Add category info
            const categorization = await this.categorizeEmail(subject, body, emailId);
            result = { ...result, ...categorization };
          } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            result = null;
          }
        } catch (aiError) {
          console.error('Gemini analysis failed:', aiError);
        }
      }
      
      // Fall back to component analysis if AI analysis failed
      if (!result) {
        console.log('Using component-based analysis');
        const spamAnalysis = this.detectSpam(combinedContent);
        const categorization = await this.categorizeEmail(subject, body, emailId);
        const summary = await this.generateSummary(subject, body);
        
        result = {
          ...spamAnalysis,
          ...categorization,
          summary,
        };
      }
      
      // Store the analysis if we have an emailId
      if (emailId) {
        await prisma.emailAnalysis.upsert({
          where: { emailId },
          update: result,
          create: {
            emailId,
            ...result,
          },
        });
      }
      
      return result;
    } catch (error) {
      console.error('Email analysis error:', error);
      throw new Error('Failed to analyze email: ' + error.message);
    }
  }

  /**
   * Simple spam detection based on keywords
   */
  static detectSpam(content) {
    if (!content) return { isSpam: false, spamScore: 0, reasons: [] };
    
    const contentLower = content.toLowerCase();
    let spamScore = 0;
    const reasons = [];
    
    // Check for suspicious keywords
    const SPAM_KEYWORDS = [
      'urgent', 'action required', 'account suspended', 'verify your account',
      'click here', 'login to verify', 'unusual activity', 'suspicious activity',
      'password expired', 'win', 'winner', 'congratulations', 'claim your prize',
      'limited time', 'free money', 'exclusive offer', 'guaranteed'
    ];
    
    SPAM_KEYWORDS.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        spamScore += 1;
        reasons.push(`Contains suspicious keyword: "${keyword}"`);
      }
    });
    
    // Normalize the score to 0-1 range
    spamScore = Math.min(spamScore / 10, 1);
    
    return {
      isSpam: spamScore > 0.6,
      spamScore,
      reasons
    };
  }

  /**
   * Categorize email content
   */
  static async categorizeEmail(subject, body, emailId) {
    try {
      // If we have an emailId, try to apply category rules
      if (emailId) {
        // Find the user for this email
        const email = await prisma.email.findUnique({
          where: { id: emailId },
          select: { userId: true }
        });
        
        if (email?.userId) {
          // Get all rules for this user
          const rules = await prisma.rule.findMany({
            where: { userId: email.userId },
            include: { category: true }
          });
          
          // Create an email-like object for rule matching
          const emailObj = {
            subject: subject || '',
            snippet: body || '',
            sender: '' // This would ideally come from the actual email object
          };
          
          // Check each rule
          for (const rule of rules) {
            try {
              const conditions = JSON.parse(rule.condition);
              let allConditionsMet = true;
              
              for (const condition of conditions) {
                const { field, operator, value } = condition;
                
                let fieldValue = '';
                switch (field) {
                  case 'sender':
                    fieldValue = emailObj.sender;
                    break;
                  case 'subject':
                    fieldValue = emailObj.subject;
                    break;
                  case 'snippet':
                    fieldValue = emailObj.snippet;
                    break;
                  default:
                    continue;
                }
                
                let conditionMet = false;
                switch (operator) {
                  case 'contains':
                    conditionMet = fieldValue.toLowerCase().includes(value.toLowerCase());
                    break;
                  case 'equals':
                    conditionMet = fieldValue.toLowerCase() === value.toLowerCase();
                    break;
                  case 'startsWith':
                    conditionMet = fieldValue.toLowerCase().startsWith(value.toLowerCase());
                    break;
                  case 'endsWith':
                    conditionMet = fieldValue.toLowerCase().endsWith(value.toLowerCase());
                    break;
                }
                
                if (!conditionMet) {
                  allConditionsMet = false;
                  break;
                }
              }
              
              // If all conditions are met, return this category
              if (allConditionsMet && rule.category) {
                console.log(`Rule match: Email ${emailId} matches rule ${rule.id} for category ${rule.category.name}`);
                return { 
                  category: rule.category.name,
                  categoryId: rule.categoryId,
                  matchedRule: rule.name
                };
              }
            } catch (ruleError) {
              console.error(`Error processing rule ${rule.id}:`, ruleError);
              // Continue to next rule
            }
          }
        }
      }
      
      // Fallback to keyword-based categorization
      const combinedText = `${subject || ''} ${body || ''}`.toLowerCase();
      
      // Check for keywords associated with different categories
      if (combinedText.match(/invoice|payment|receipt|order|purchase|transaction|credit|debit/i)) {
        return { category: 'Finance' };
      } else if (combinedText.match(/meeting|call|agenda|discuss|presentation|team|project/i)) {
        return { category: 'Work' };
      } else if (combinedText.match(/newsletter|subscribe|unsubscribe|discount|offer|sale|promotion|deal/i)) {
        return { category: 'Promotions' };
      } else if (combinedText.match(/social|friend|family|birthday|invitation|event|party/i)) {
        return { category: 'Social' };
      }
      
      return { category: 'Other' };
    } catch (error) {
      console.error('Error in category matching:', error);
      return { category: 'Other' };
    }
  }
  
  /**
   * Analyze text for suspicious patterns and keywords
   */
  static analyzeText(text) {
    if (!text) return 0;
    
    let score = 0;
    const textLower = text.toLowerCase();
    
    // Check for urgent language
    if (textLower.match(/urgent|immediate|now|asap/i)) {
      score += 0.3;
    }
    
    // Check for excessive punctuation
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  static analyzeSuspiciousLinks(text) {
    if (!text) return 0;

    // Extract URLs from text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    if (urls.length === 0) return 0;

    let suspiciousCount = 0;
    for (const url of urls) {
      // Check for suspicious URL patterns
      if (SUSPICIOUS_DOMAINS.some(domain => url.includes(domain))) {
        suspiciousCount++;
      }
      // Check for IP addresses instead of domains
      if (url.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
        suspiciousCount++;
      }
      // Check for suspicious URL patterns
      if (url.includes('@') || url.includes('login') || url.includes('verify')) {
        suspiciousCount++;
      }
    }

    return Math.min(suspiciousCount / urls.length, 1);
  }

  static async generateSummary(subject, body) {
    try {
      if (!body || body.trim().length === 0) {
        return "No email content to summarize.";
      }

      const text = body || '';
      let summaryResult = null;
      
      // Try using Google Gemini if available
      if (process.env.GEMINI_API_KEY && genAI) {
        try {
          console.log('Attempting to summarize with Gemini...');
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.0-pro",
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 250,
              topP: 0.8, // Added for more reliable output
              topK: 40,  // Added for more reliable output
            }
          });
          
          const prompt = `Analyze and summarize the following email in 2-3 lines. 
          
          Guidelines:
          1. Extract the main topic, key points, and any action items
          2. Identify any deadlines or important dates
          3. Note any requests being made or decisions needed
          4. Format your response as 2-3 concise sentences (not JSON)
          5. Keep your response under 100 words
          6. Be factual and objective
          7. Do not introduce information not found in the email
          8. Return ONLY the summary text with no formatting or prefixes
          9. If there's very little text to summarize, simply state that
          
          Subject: ${subject || '(No subject)'}
          
          ${text.slice(0, 5000)}`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          summaryResult = response.text();
          
          // Clean up the summary text to remove any JSON or markdown formatting
          if (summaryResult && summaryResult.trim().length > 0) {
            // Remove any JSON formatting if present
            try {
              const parsedJson = JSON.parse(summaryResult);
              if (parsedJson && parsedJson.summary) {
                summaryResult = parsedJson.summary;
              }
            } catch (e) {
              // Not JSON, continue with the text as is
            }
            
            console.log('Successfully generated summary with Gemini');
            return summaryResult;
          }
        } catch (error) {
          console.error('Google Gemini summarization failed:', error);
          // Fall back to other methods
        }
      }
      
      // Try using HuggingFace
      if (!summaryResult && process.env.HUGGINGFACE_API_KEY && hf) {
        try {
          console.log('Attempting to summarize with HuggingFace...');
          const result = await hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: text.slice(0, 1000), // Most free models have input limits
            parameters: {
              max_length: 150,
              min_length: 40,
              do_sample: false // Make output more deterministic
            },
          });
          
          if (result && result.summary_text) {
            summaryResult = result.summary_text;
            console.log('Successfully generated summary with HuggingFace');
            return summaryResult;
          }
        } catch (hfError) {
          console.error('HuggingFace summarization failed:', hfError);
        }
      }
      
      // If we still don't have a summary, try basic summarization
      if (!summaryResult) {
        console.log('Using basic summarization as fallback...');
        summaryResult = this.basicSummarization(text);
      }
      
      return summaryResult || "Unable to generate summary for this email.";
    } catch (error) {
      console.error('Summary generation failed:', error);
      return "An error occurred while generating the email summary. Please try again later.";
    }
  }

  static basicSummarization(text) {
    // Simple extractive summarization using TF-IDF
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length <= 3) return text;

    sentences.forEach(sentence => tfidf.addDocument(sentence));
    
    const sentenceScores = sentences.map((sentence, idx) => {
      const terms = tokenizer.tokenize(sentence);
      const score = terms.reduce((sum, term) => {
        return sum + tfidf.tfidf(term, idx);
      }, 0);
      return { sentence, score };
    });

    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
      .map(item => item.sentence);

    return topSentences.join(' ');
  }

  static async analyzeWithGemini(email) {
    try {
      const prompt = `
      Analyze this email for spam and security concerns:
      Subject: ${email.subject}
      Body: ${email.body}

      Please provide:
      1. A spam score between 0 and 1
      2. Whether it's spam (true/false)
      3. A list of reasons for the classification
      4. A brief summary of the email content

      Format the response as JSON with these keys:
      {
        "spamScore": number,
        "isSpam": boolean,
        "reasons": string[],
        "summary": string
      }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      return null;
    }
  }
}

module.exports = EmailAnalysisService;
