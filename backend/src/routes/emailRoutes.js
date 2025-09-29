const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
console.log('DEBUG emailController exports:', Object.keys(emailController));
const EmailAnalysisService = require('../services/emailAnalysisService');
const { emailCacheMiddleware } = require('../services/emailCacheService');
const ruleController = require('../controllers/ruleController');
const passport = require('passport'); // Import passport for authentication

// Sender autocomplete endpoint (must come after router is defined)
router.get('/senders/autocomplete', passport.authenticate('session'), emailController.getUniqueSenders);

router.get('/messages', emailController.getEmails);
router.get('/messages/sync', emailController.syncEmails);
router.get('/messages/:id', emailCacheMiddleware, emailController.getEmailById);

router.post('/analyze', async (req, res) => {
    try {
        const { subject, body, content, emailId } = req.body;
        if (!subject && !body && !content) {
            return res.status(400).json({ error: 'Email content or subject is required' });
        }

        console.log('Analyzing email:', { emailId, subject });
        
        const analysis = await EmailAnalysisService.analyzeEmail({ 
            subject, 
            body: body || content,
            emailId
        });
        
        console.log('Analysis result:', analysis);
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing email:', error);
        res.status(500).json({ 
            error: 'Failed to analyze email',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Re-categorize all emails for the authenticated user
router.post('/recategorize', passport.authenticate('session'), emailController.recategorizeAllEmails);

// Re-analyze all emails for spam detection (useful after spam rule changes)
router.post('/reanalyze', passport.authenticate('session'), emailController.reanalyzeAllEmails);

// Clear all spam analysis and force refresh
router.post('/clear-spam-analysis', passport.authenticate('session'), emailController.clearSpamAnalysis);

// Cleanup database - remove orphaned data
router.post('/cleanup', passport.authenticate('session'), emailController.cleanupDatabase);

// Send email
router.post('/send', passport.authenticate('session'), emailController.sendEmail);

// Draft management
router.post('/drafts', passport.authenticate('session'), emailController.saveDraft);
router.get('/drafts', passport.authenticate('session'), emailController.getDrafts);
router.post('/drafts/send', passport.authenticate('session'), emailController.sendFromDraft);
router.delete('/drafts/:draftId', passport.authenticate('session'), emailController.deleteDraft);

// Get emails by folder (inbox, sent, drafts, spam, trash)
router.get('/folder/:folder', passport.authenticate('session'), emailController.getEmailsByFolder);

// Toggle important status
router.put('/important/:emailId', passport.authenticate('session'), emailController.toggleImportant);

// Toggle starred status
router.put('/starred/:emailId', passport.authenticate('session'), emailController.toggleStarred);

// Rule management routes (moved to ruleRoutes.js)
// These should be handled by /api/rules routes

module.exports = router;
