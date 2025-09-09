const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const ensureAuth = require('../middleware/ensureAuth');

router.use(ensureAuth);

router.post('/', ruleController.createRule);
router.get('/', ruleController.getRules);
router.put('/:id', ruleController.updateRule);
router.delete('/:id', ruleController.deleteRule);

module.exports = router;
