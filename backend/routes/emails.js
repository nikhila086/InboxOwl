const express = require('express');
const router = express.Router();

// Email analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { emailId, subject, content } = req.body;

    // Simple spam analysis implementation
    const spamKeywords = ['casino', 'win', 'lottery', 'prize', 'viagra', 'discount', 'free', 'offer'];
    const reasons = [];
    let spamScore = 0;

    // Check subject
    if (subject) {
      const subjectLower = subject.toLowerCase();
      spamKeywords.forEach(keyword => {
        if (subjectLower.includes(keyword)) {
          reasons.push(`Subject contains suspicious word: "${keyword}"`);
          spamScore += 0.2;
        }
      });
    }

    // Check content
    if (content) {
      const contentLower = content.toLowerCase();
      spamKeywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          reasons.push(`Content contains suspicious word: "${keyword}"`);
          spamScore += 0.1;
        }
      });

      // Check for excessive capitalization
      const capitalRatio = (content.match(/[A-Z]/g) || []).length / content.length;
      if (capitalRatio > 0.3) {
        reasons.push('Excessive use of capital letters');
        spamScore += 0.2;
      }

      // Check for multiple exclamation marks
      if (content.match(/!{2,}/)) {
        reasons.push('Multiple exclamation marks detected');
        spamScore += 0.1;
      }
    }

    // Generate summary
    const summary = content 
      ? `Email contains ${content.split(' ').length} words. ${
          reasons.length ? 'Some suspicious patterns were detected.' : 'No immediate suspicious patterns found.'
        }`
      : 'No content available for analysis';

    // Cap the spam score at 1
    spamScore = Math.min(spamScore, 1);

    res.json({
      emailId,
      isSpam: spamScore > 0.5,
      spamScore,
      reasons,
      summary
    });
  } catch (error) {
    console.error('Email analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze email' });
  }
});

module.exports = router;
