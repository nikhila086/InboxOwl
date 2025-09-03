const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const ensureAuth = require('../middleware/ensureAuth');

router.use(ensureAuth);

router.post('/rules', ruleController.createRule);
router.get('/rules', ruleController.getRules);
router.put('/rules/:id', ruleController.updateRule);
router.delete('/rules/:id', ruleController.deleteRule);

module.exports = router;
