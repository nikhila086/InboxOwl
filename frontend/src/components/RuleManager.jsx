import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRules, createRule, updateRule, deleteRule, getCategories } from '../utils/api';

const CONDITIONS = [
  { id: 'from', label: 'From Email' },
  { id: 'subject', label: 'Subject Contains' },
  { id: 'body', label: 'Body Contains' },
  { id: 'hasAttachment', label: 'Has Attachment' },
];

function RuleManager() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    conditions: [{ type: 'from', value: '' }],
    categoryId: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, categoriesData] = await Promise.all([
        getRules(),
        getCategories()
      ]);
      setRules(rulesData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await updateRule(editingRule.id, formData);
      } else {
        await createRule(formData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingRule(null);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (rule) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(rule.id);
        await loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { type: 'from', value: '' }]
    });
  };

  const removeCondition = (index) => {
    const newConditions = formData.conditions.filter((_, i) => i !== index);
    setFormData({ ...formData, conditions: newConditions });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      conditions: [{ type: 'from', value: '' }],
      categoryId: '',
      isActive: true
    });
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      conditions: rule.conditions,
      categoryId: rule.categoryId,
      isActive: rule.isActive
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Email Rules</h2>
        <button
          onClick={() => {
            setEditingRule(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Rule
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-900">{rule.name}</h3>
                  <div className="text-sm text-gray-500">
                    {rule.conditions.map((condition, index) => (
                      <div key={index}>
                        {CONDITIONS.find(c => c.id === condition.type)?.label}: {condition.value}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    Category: {categories.find(c => c.id === rule.categoryId)?.name}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></span>
                    <span className="text-sm text-gray-600">{rule.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(rule)}
                      className="text-gray-600 hover:text-indigo-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
          >
            <h3 className="text-lg font-medium mb-4">
              {editingRule ? 'Edit Rule' : 'New Rule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Conditions
                  </label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Condition
                  </button>
                </div>
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex space-x-2">
                    <select
                      value={condition.type}
                      onChange={(e) => updateCondition(index, 'type', e.target.value)}
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
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter value"
                      required
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Rule is active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default RuleManager;
