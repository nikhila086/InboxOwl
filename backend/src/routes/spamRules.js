const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all spam rules
 */
router.get('/', async (req, res) => {
  try {
    const rules = await prisma.spamRule.findMany({
      orderBy: { pattern: 'asc' },
    });
    
    res.json(rules);
  } catch (error) {
    console.error('Error fetching spam rules:', error);
    res.status(500).json({ error: 'Failed to fetch spam rules' });
  }
});

/**
 * Create a new spam rule
 */
router.post('/', async (req, res) => {
  try {
    const { pattern, score, enabled } = req.body;
    
    if (!pattern || typeof score !== 'number') {
      return res.status(400).json({ error: 'Pattern and score are required' });
    }
    
    const rule = await prisma.spamRule.create({
      data: {
        pattern,
        score,
        enabled: enabled ?? true,
      },
    });
    
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating spam rule:', error);
    res.status(500).json({ error: 'Failed to create spam rule' });
  }
});

/**
 * Update a spam rule
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pattern, score, enabled } = req.body;
    
    if (!pattern || typeof score !== 'number') {
      return res.status(400).json({ error: 'Pattern and score are required' });
    }
    
    const rule = await prisma.spamRule.update({
      where: { id: Number(id) },
      data: { pattern, score, enabled },
    });
    
    res.json(rule);
  } catch (error) {
    console.error('Error updating spam rule:', error);
    res.status(500).json({ error: 'Failed to update spam rule' });
  }
});

/**
 * Delete a spam rule
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.spamRule.delete({
      where: { id: Number(id) },
    });
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting spam rule:', error);
    res.status(500).json({ error: 'Failed to delete spam rule' });
  }
});

module.exports = router;
