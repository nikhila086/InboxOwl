const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SPAM_RULES = [
  // Urgency and action-related
  { pattern: 'urgent', score: 0.4, enabled: true },
  { pattern: 'action required', score: 0.5, enabled: true },
  { pattern: 'immediate action', score: 0.6, enabled: true },
  { pattern: 'expires today', score: 0.5, enabled: true },
  { pattern: 'limited time', score: 0.4, enabled: true },
  { pattern: 'act now', score: 0.5, enabled: true },
  
  // Account security threats
  { pattern: 'account suspended', score: 0.7, enabled: true },
  { pattern: 'verify your account', score: 0.6, enabled: true },
  { pattern: 'unusual activity', score: 0.6, enabled: true },
  { pattern: 'suspicious activity', score: 0.6, enabled: true },
  { pattern: 'security alert', score: 0.6, enabled: true },
  { pattern: 'password expired', score: 0.5, enabled: true },
  { pattern: 'login verification', score: 0.5, enabled: true },
  
  // Generic scam patterns
  { pattern: 'click here', score: 0.4, enabled: true },
  { pattern: 'click now', score: 0.5, enabled: true },
  { pattern: 'download now', score: 0.4, enabled: true },
  { pattern: 'install now', score: 0.4, enabled: true },
  
  // Prize and money offers
  { pattern: 'congratulations', score: 0.4, enabled: true },
  { pattern: 'you have won', score: 0.7, enabled: true },
  { pattern: 'claim your prize', score: 0.7, enabled: true },
  { pattern: 'free money', score: 0.8, enabled: true },
  { pattern: 'cash prize', score: 0.6, enabled: true },
  { pattern: 'lottery winner', score: 0.8, enabled: true },
  { pattern: 'million dollars', score: 0.7, enabled: true },
  
  // Financial scams
  { pattern: 'wire transfer', score: 0.6, enabled: true },
  { pattern: 'bank transfer', score: 0.5, enabled: true },
  { pattern: 'bitcoin', score: 0.4, enabled: true },
  { pattern: 'cryptocurrency', score: 0.4, enabled: true },
  { pattern: 'investment opportunity', score: 0.5, enabled: true },
  { pattern: 'guaranteed return', score: 0.7, enabled: true },
  
  // Marketing spam
  { pattern: 'exclusive offer', score: 0.4, enabled: true },
  { pattern: 'special deal', score: 0.3, enabled: true },
  { pattern: 'discount', score: 0.2, enabled: true },
  { pattern: '% off', score: 0.3, enabled: true },
  { pattern: 'free trial', score: 0.3, enabled: true },
  { pattern: 'no obligation', score: 0.4, enabled: true },
  
  // Phishing indicators
  { pattern: 'update payment', score: 0.6, enabled: true },
  { pattern: 'confirm identity', score: 0.6, enabled: true },
  { pattern: 'verify identity', score: 0.6, enabled: true },
  { pattern: 'billing information', score: 0.4, enabled: true },
  { pattern: 'credit card', score: 0.4, enabled: true },
  
  // Generic suspicious words
  { pattern: 'risk-free', score: 0.4, enabled: true },
  { pattern: 'guarantee', score: 0.3, enabled: true },
  { pattern: 'no risk', score: 0.4, enabled: true },
  { pattern: 'easy money', score: 0.6, enabled: true },
  { pattern: 'work from home', score: 0.3, enabled: true },
];

async function seedSpamRules() {
  try {
    console.log('Starting to seed spam rules...');
    
    // Check if rules already exist
    const existingRules = await prisma.spamRule.findMany();
    if (existingRules.length > 0) {
      console.log(`Found ${existingRules.length} existing spam rules. Skipping seed.`);
      return;
    }
    
    // Insert default spam rules
    for (const rule of DEFAULT_SPAM_RULES) {
      try {
        await prisma.spamRule.create({
          data: rule
        });
        console.log(`Added spam rule: "${rule.pattern}" (score: ${rule.score})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Rule "${rule.pattern}" already exists, skipping...`);
        } else {
          console.error(`Error adding rule "${rule.pattern}":`, error.message);
        }
      }
    }
    
    console.log('Spam rules seeding completed!');
  } catch (error) {
    console.error('Error seeding spam rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedSpamRules();
}

module.exports = { seedSpamRules, DEFAULT_SPAM_RULES };