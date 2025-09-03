const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        userId: req.user.id
      }
    });

    res.json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all categories for the current user
exports.getCategories = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { emails: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const category = await prisma.category.updateMany({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      data: { name, color }
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await prisma.category.deleteMany({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add emails to category
exports.addEmailsToCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { emailIds } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // First verify the category belongs to the user
    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(categoryId),
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Add emails to category
    await prisma.category.update({
      where: { id: parseInt(categoryId) },
      data: {
        emails: {
          connect: emailIds.map(id => ({ id }))
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Add emails to category error:', error);
    res.status(500).json({ error: error.message });
  }
};
