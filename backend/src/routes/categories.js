const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * Create a new category
 */
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        color,
      },
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * Update a category
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }
    
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name, color },
    });
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * Delete a category
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.category.delete({
      where: { id: Number(id) },
    });
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
