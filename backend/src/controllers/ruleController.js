const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to apply rule to an email
function emailMatchesRule(email, ruleCondition) {
  try {
    const conditions = JSON.parse(ruleCondition);
    
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      
      let fieldValue = '';
      switch (field) {
        case 'sender':
          fieldValue = email.sender;
          break;
        case 'subject':
          fieldValue = email.subject;
          break;
        case 'snippet':
          fieldValue = email.snippet;
          break;
        default:
          continue;
      }

      switch (operator) {
        case 'contains':
          if (!fieldValue.toLowerCase().includes(value.toLowerCase())) return false;
          break;
        case 'equals':
          if (fieldValue.toLowerCase() !== value.toLowerCase()) return false;
          break;
        case 'startsWith':
          if (!fieldValue.toLowerCase().startsWith(value.toLowerCase())) return false;
          break;
        case 'endsWith':
          if (!fieldValue.toLowerCase().endsWith(value.toLowerCase())) return false;
          break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Rule evaluation error:', error);
    return false;
  }
}

// Create a new rule
exports.createRule = async (req, res) => {
  try {
    console.log('Authenticated user:', req.user); // Debug log
    console.log('Request body:', req.body); // Debug log
    const { name, condition, conditions, categoryId, isActive } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Handle both condition formats for backward compatibility
    let ruleConditions = [];
    if (conditions && Array.isArray(conditions)) {
      ruleConditions = conditions;
    } else if (condition) {
      try {
        ruleConditions = JSON.parse(condition);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid condition format' });
      }
    }

    if (!Array.isArray(ruleConditions) || ruleConditions.length === 0) {
      return res.status(400).json({ error: 'Conditions must be a non-empty array' });
    }

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(categoryId),
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create rule for the first condition
    const firstCondition = ruleConditions[0];
    const fieldMapping = {
      'sender': 'sender',
      'from': 'sender',
      'subject': 'subject',
      'body': 'content'
    };
    
    const rule = await prisma.rule.create({
      data: {
        name,
        description: `Rule for ${name}`,
        field: fieldMapping[firstCondition.field] || firstCondition.field,
        conditionType: firstCondition.operator || 'contains',
        value: firstCondition.value || '',
        isActive: isActive !== false,
        categoryId: parseInt(categoryId),
        userId: req.user.id
      }
    });

    // After creating the rule, re-apply all rules to all emails for this user
    const emails = await prisma.email.findMany({ where: { userId: req.user.id } });
    const rules = await prisma.rule.findMany({ where: { userId: req.user.id } });
    for (const email of emails) {
      // Remove all categories from email first
      await prisma.email.update({
        where: { id: email.id },
        data: { categories: { set: [] } }
      });
      // Apply all rules with all condition types
      for (const rule of rules) {
        if (!email[rule.field] || !rule.value) continue;
        let isMatch = false;
        const fieldValue = email[rule.field];
        switch (rule.conditionType) {
          case 'contains':
            isMatch = fieldValue.includes(rule.value);
            break;
          case 'equals':
            isMatch = fieldValue === rule.value;
            break;
          case 'startsWith':
            isMatch = fieldValue.startsWith(rule.value);
            break;
          case 'endsWith':
            isMatch = fieldValue.endsWith(rule.value);
            break;
          case 'regex':
            try { isMatch = new RegExp(rule.value).test(fieldValue); } catch { isMatch = false; }
            break;
          default:
            isMatch = false;
        }
        if (isMatch) {
          await prisma.email.update({
            where: { id: email.id },
            data: { categories: { connect: { id: rule.categoryId } } }
          });
        }
      }
    }

    console.log('Rule created successfully and categories re-applied:', rule);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
};

// Get all rules for the current user
exports.getRules = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const rules = await prisma.rule.findMany({
      where: { userId: req.user.id },
      include: {
        category: true
      }
    });

    res.json(rules);
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a rule
exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, condition, categoryId } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate rule condition format
    try {
      const conditions = JSON.parse(condition);
      if (!Array.isArray(conditions)) {
        throw new Error('Conditions must be an array');
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid rule condition format' });
    }

    const rule = await prisma.rule.updateMany({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      data: {
        name,
        condition,
        categoryId: parseInt(categoryId)
      }
    });

    // Re-apply updated rule
    const emails = await prisma.email.findMany({
      where: { userId: req.user.id }
    });

    const matchingEmails = emails.filter(email => emailMatchesRule(email, condition));
    
    if (matchingEmails.length > 0) {
      await prisma.category.update({
        where: { id: parseInt(categoryId) },
        data: {
          emails: {
            set: matchingEmails.map(email => ({ id: email.id }))
          }
        }
      });
    }

    res.json(rule);
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a rule
exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await prisma.rule.deleteMany({
      where: {
        id: parseInt(id),
        userId: req.user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Apply rules to an email
exports.applyRulesToEmail = async (email, userId) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { userId },
      include: { category: true }
    });

    for (const rule of rules) {
      if (emailMatchesRule(email, rule.condition)) {
        await prisma.category.update({
          where: { id: rule.categoryId },
          data: {
            emails: {
              connect: { id: email.id }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Apply rules error:', error);
  }
};
