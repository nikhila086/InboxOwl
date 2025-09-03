const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getRules = async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { userId: req.user.id },
      include: { category: true }
    });
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
};

exports.createRule = async (req, res) => {
  try {
    const { name, conditions, categoryId, isActive } = req.body;

    // Validate required fields
    if (!name || !conditions || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate conditions format
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({ error: 'Invalid conditions format' });
    }

    for (const condition of conditions) {
      if (!condition.type || !condition.value) {
        return res.status(400).json({ error: 'Invalid condition format' });
      }
    }

    const rule = await prisma.rule.create({
      data: {
        name,
        conditions,
        categoryId,
        isActive: isActive ?? true,
        userId: req.user.id
      },
      include: { category: true }
    });

    res.json(rule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, conditions, categoryId, isActive } = req.body;

    // Validate required fields
    if (!name || !conditions || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate conditions format
    if (!Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({ error: 'Invalid conditions format' });
    }

    for (const condition of conditions) {
      if (!condition.type || !condition.value) {
        return res.status(400).json({ error: 'Invalid condition format' });
      }
    }

    const rule = await prisma.rule.update({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      data: {
        name,
        conditions,
        categoryId,
        isActive
      },
      include: { category: true }
    });

    res.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.rule.delete({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
};
