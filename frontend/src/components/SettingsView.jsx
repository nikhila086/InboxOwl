import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  fetchEmails 
} from '../utils/api';

const CONDITIONS = [
  { id: 'from', label: 'From Email' },
  { id: 'subject', label: 'Subject Contains' },
  { id: 'body', label: 'Body Contains' },
  { id: 'hasAttachment', label: 'Has Attachment' }
];

function SettingsView() {
  // States for data
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [emails, setEmails] = useState([]);
  const [suggestions, setSuggestions] = useState({ visible: false, items: [], index: -1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for modals
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, editing: null });
  const [ruleModal, setRuleModal] = useState({ isOpen: false, editing: null });

  // Form data states
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#6366F1' });
  const initialRuleForm = {
    name: '',
    conditions: [
      {
        type: 'from',
        value: '',
        operator: 'contains'
      }
    ],
    categoryId: '',
    isActive: true
  };

  const [ruleForm, setRuleForm] = useState(initialRuleForm);

  const [loadingStates, setLoadingStates] = useState({
    categories: true,
    rules: true,
    emails: true
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError(null); // Clear any previous errors
    setLoadingStates({ categories: true, rules: true, emails: true });
    
    try {
      // Load categories
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoadingStates(prev => ({ ...prev, categories: false }));
      }

      // Load rules
      try {
        const rulesData = await getRules();
        setRules(rulesData || []);
      } catch (err) {
        console.error('Failed to load rules:', err);
        setError('Failed to load rules. Please try again.');
      } finally {
        setLoadingStates(prev => ({ ...prev, rules: false }));
      }

      // Load emails for suggestions
      try {
        const emailsData = await fetchEmails(10); // Reduced number for better performance
        setEmails(emailsData || []);
      } catch (err) {
        console.error('Failed to load emails:', err);
        // Don't show error for emails as they're optional
      } finally {
        setLoadingStates(prev => ({ ...prev, emails: false }));
      }

    } catch (err) {
      console.error('Error in loadData:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoryModal.editing) {
        await updateCategory(categoryModal.editing.id, categoryForm);
      } else {
        await createCategory(categoryForm);
      }
      await loadData();
      setCategoryModal({ isOpen: false, editing: null });
      setCategoryForm({ name: '', color: '#6366F1' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm('Are you sure? This will also delete associated rules.')) {
      try {
        await deleteCategory(category.id);
        await loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Email suggestions
  const getSuggestions = (type, value) => {
    if (!value.trim()) {
      setSuggestions({ visible: false, items: [], index: -1 });
      return;
    }

    let items = [];
    const searchTerm = value.toLowerCase();

    switch (type) {
      case 'from':
        items = [...new Set(emails.map(email => email.sender))]
          .filter(sender => sender.toLowerCase().includes(searchTerm))
          .slice(0, 5);
        break;
      case 'subject':
      case 'body':
        const words = emails
          .map(email => type === 'subject' ? email.subject : email.body)
          .join(' ')
          .split(/\s+/)
          .filter(word => word.length > 3);
        items = [...new Set(words)]
          .filter(word => word.toLowerCase().includes(searchTerm))
          .slice(0, 5);
        break;
      default:
        items = [];
    }

    setSuggestions({
      visible: true,
      items,
      index: -1
    });
  };

  // Rule handlers
  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    try {
      setError(null);
      
      if (!ruleForm.name.trim()) {
        throw new Error('Rule name is required');
      }
      
      if (!ruleForm.categoryId) {
        throw new Error('Please select a category');
      }
      
      if (!ruleForm.conditions.length) {
        throw new Error('At least one condition is required');
      }
      
      const invalidConditions = ruleForm.conditions.filter(c => {
        if (c.type === 'hasAttachment') {
          return false; // hasAttachment doesn't need a value
        }
        return !c.value || !c.value.trim();
      });

      if (invalidConditions.length > 0) {
        throw new Error('Please fill in all condition values');
      }

      // Prepare the rule data
      const preparedRule = {
        name: ruleForm.name.trim(),
        categoryId: ruleForm.categoryId,
        isActive: true,
        conditions: ruleForm.conditions.map(c => {
          // Special handling for hasAttachment
          if (c.type === 'hasAttachment') {
            return {
              type: 'hasAttachment',
              value: 'true',
              operator: 'equals'
            };
          }
          // For all other condition types
          return {
            type: c.type,
            value: c.value.trim(),
            operator: 'contains'
          };
        }).filter(c => c.value) // Remove any empty conditions
      };

      console.log('Submitting rule data:', JSON.stringify(preparedRule, null, 2));

      if (ruleModal.editing) {
        await updateRule(ruleModal.editing.id, preparedRule);
      } else {
        const result = await createRule(preparedRule);
        if (!result) {
          throw new Error('Failed to create rule. Please try again.');
        }
      }
      await loadData();
      setRuleModal({ isOpen: false, editing: null });
      setRuleForm({
        name: '',
        conditions: [{ type: 'from', value: '' }],
        categoryId: '',
        isActive: true
      });
    } catch (err) {
      console.error('Rule creation error:', err);
      setError(err.message || 'Failed to save rule. Please check your inputs and try again.');
    }
  };

  const handleDeleteRule = async (rule) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(rule.id);
        await loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Quick add rule for a category
  const handleQuickAddRule = (categoryId) => {
    setRuleForm(prev => ({ ...prev, categoryId }));
    setRuleModal({ isOpen: true, editing: null });
  };

  const isLoading = Object.values(loadingStates).some(state => state);
  const showEmptyState = !isLoading && categories.length === 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
        <div className="text-center text-gray-500">
          {loadingStates.categories ? 'Loading categories...' : 
           loadingStates.rules ? 'Loading rules...' : 
           'Loading email data...'}
        </div>
      </div>
    );
  }

  if (showEmptyState) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No categories found</div>
        <button
          onClick={() => setCategoryModal({ isOpen: true, editing: null })}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create your first category
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-800"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Categories Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Email Categories</h2>
          <button
            onClick={() => setCategoryModal({ isOpen: true, editing: null })}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-medium">{category.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCategoryForm({ name: category.name, color: category.color });
                      setCategoryModal({ isOpen: true, editing: category });
                    }}
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {rules.filter(r => r.categoryId === category.id).length} rules
                </span>
                <button
                  onClick={() => handleQuickAddRule(category.id)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Add Rule
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Email Rules</h2>
          <button
            onClick={() => setRuleModal({ isOpen: true, editing: null })}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Rule
          </button>
        </div>

        <div className="space-y-4">
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium">{rule.name}</h3>
                  {rule.isActive ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setRuleForm({
                        name: rule.name,
                        conditions: rule.conditions,
                        categoryId: rule.categoryId,
                        isActive: rule.isActive
                      });
                      setRuleModal({ isOpen: true, editing: rule });
                    }}
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Category: {categories.find(c => c.id === rule.categoryId)?.name}
              </div>
              <div className="text-sm text-gray-600">
                {rule.conditions.map((condition, index) => (
                  <div key={index}>
                    {CONDITIONS.find(c => c.id === condition.type)?.label}: {condition.value}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-medium mb-4">
              {categoryModal.editing ? 'Edit Category' : 'New Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full h-10"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryModal({ isOpen: false, editing: null });
                    setCategoryForm({ name: '', color: '#6366F1' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {categoryModal.editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Rule Modal */}
      {ruleModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
          >
            <h3 className="text-lg font-medium mb-4">
              {ruleModal.editing ? 'Edit Rule' : 'New Rule'}
            </h3>
            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Work Emails"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={ruleForm.categoryId}
                  onChange={(e) => setRuleForm({ ...ruleForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Conditions
                  </label>
                  <button
                    type="button"
                    onClick={() => setRuleForm({
                      ...ruleForm,
                      conditions: [...ruleForm.conditions, { type: 'from', value: '' }]
                    })}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Condition
                  </button>
                </div>
                <div className="space-y-3">
                  {ruleForm.conditions.map((condition, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={condition.type}
                        onChange={(e) => {
                          const newConditions = [...ruleForm.conditions];
                          newConditions[index] = { ...condition, type: e.target.value };
                          setRuleForm({ ...ruleForm, conditions: newConditions });
                        }}
                        className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...ruleForm.conditions];
                          newConditions[index] = { ...condition, value: e.target.value };
                          setRuleForm({ ...ruleForm, conditions: newConditions });
                          getSuggestions(condition.type, e.target.value);
                        }}
                        onFocus={() => getSuggestions(condition.type, condition.value)}
                        onBlur={() => {
                          // Delay hiding suggestions to allow for click
                          setTimeout(() => {
                            setSuggestions({ visible: false, items: [], index: -1 });
                          }, 200);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={condition.type === 'from' ? 'e.g., @company.com' : 'e.g., urgent, meeting'}
                        required
                      />
                      {suggestions.visible && suggestions.items.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
                          style={{ top: '100%', minWidth: '100%', maxHeight: '200px', overflowY: 'auto' }}
                        >
                          <ul className="py-1">
                            {suggestions.items.map((item, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${
                                  suggestions.index === idx ? 'bg-indigo-50' : ''
                                }`}
                                onClick={() => {
                                  const newConditions = [...ruleForm.conditions];
                                  newConditions[index] = { ...condition, value: item };
                                  setRuleForm({ ...ruleForm, conditions: newConditions });
                                  setSuggestions({ visible: false, items: [], index: -1 });
                                }}
                              >
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newConditions = ruleForm.conditions.filter((_, i) => i !== index);
                            setRuleForm({ ...ruleForm, conditions: newConditions });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Rule is active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setRuleModal({ isOpen: false, editing: null });
                    setRuleForm({
                      name: '',
                      conditions: [{ type: 'from', value: '' }],
                      categoryId: '',
                      isActive: true
                    });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {ruleModal.editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
