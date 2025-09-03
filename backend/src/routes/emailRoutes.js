const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.get('/gmail', emailController.getEmails);

module.exports = router;
