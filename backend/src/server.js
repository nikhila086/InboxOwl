require('dotenv').config();
const app = require('./app');
const { seedSpamRules } = require('./seeds/spamRulesSeed');

const PORT = process.env.PORT || 3000;

// Initialize default spam rules on startup
async function initializeApp() {
  try {
    console.log('Initializing application...');
    await seedSpamRules();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Application fully initialized with default spam rules!');
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

initializeApp();
