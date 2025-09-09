const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const ensureAuth = require('../middleware/ensureAuth');

router.use(ensureAuth);

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.post('/:categoryId/emails', categoryController.addEmailsToCategory);

module.exports = router;
