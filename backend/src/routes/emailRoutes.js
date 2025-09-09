const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const EmailAnalysisService = require('../services/emailAnalysisService');
const { emailCacheMiddleware } = require('../services/emailCacheService');

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

module.exports = router;
