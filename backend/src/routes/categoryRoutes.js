const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const ensureAuth = require('../middleware/ensureAuth');

router.use(ensureAuth);

router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.post('/categories/:categoryId/emails', categoryController.addEmailsToCategory);

module.exports = router;
