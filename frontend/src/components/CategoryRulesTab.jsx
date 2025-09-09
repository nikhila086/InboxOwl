import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import axios from 'axios';

const CategoryRulesTab = () => {
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    conditions: [{ field: 'subject', operator: 'contains', value: '' }],
    categoryId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories
      const categoriesRes = await axios.get('http://localhost:3000/api/categories');
      if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
        setCategories(categoriesRes.data);
        
        // Set default category if available
        if (categoriesRes.data.length > 0 && !newRule.categoryId) {
          setNewRule(prev => ({ ...prev, categoryId: categoriesRes.data[0].id.toString() }));
        }
      }
      
      // Fetch rules
      const rulesRes = await axios.get('http://localhost:3000/api/rules');
      if (rulesRes.data && Array.isArray(rulesRes.data)) {
        setRules(rulesRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: 'subject', operator: 'contains', value: '' }
      ]
    }));
  };

  const removeCondition = (index) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index, field, value) => {
    setNewRule(prev => {
      const updatedConditions = [...prev.conditions];
      updatedConditions[index] = {
        ...updatedConditions[index],
        [field]: value
      };
      return { ...prev, conditions: updatedConditions };
    });
  };

  const saveRule = async () => {
    try {
      if (!newRule.name || !newRule.categoryId) {
        setError('Please provide a rule name and select a category');
        return;
      }

      // Validate all conditions have values
      const hasEmptyCondition = newRule.conditions.some(c => !c.value.trim());
      if (hasEmptyCondition) {
        setError('All conditions must have values');
        return;
      }

      setLoading(true);
      setError(null);

      const ruleData = {
        name: newRule.name,
        condition: JSON.stringify(newRule.conditions),
        categoryId: parseInt(newRule.categoryId)
      };

      const response = await axios.post('http://localhost:3000/api/rules', ruleData);
      
      // Reset form and refresh data
      setNewRule({
        name: '',
        conditions: [{ field: 'subject', operator: 'contains', value: '' }],
        categoryId: newRule.categoryId // Keep the selected category
      });
      
      fetchData(); // Refresh rules list
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:3000/api/rules/${id}`);
      setRules(rules.filter(rule => rule.id !== id));
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Category Rules</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create rules to automatically assign emails to categories based on their content.
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Existing Rules */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-2">Current Rules</h4>
          {rules.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No rules defined yet</p>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => {
                const category = categories.find(c => c.id === rule.categoryId);
                const conditions = JSON.parse(rule.condition);
                
                return (
                  <div key={rule.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-800">{rule.name}</h5>
                        <div className="flex items-center mt-1">
                          <span className="text-sm mr-2">Assigns to:</span>
                          {category && (
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${category.color}20`, 
                                color: category.color 
                              }}
                            >
                              {category.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Conditions:</p>
                      <ul className="pl-2">
                        {conditions.map((condition, i) => (
                          <li key={i} className="text-sm text-gray-600">
                            <code>{condition.field}</code> {condition.operator} "<code>{condition.value}</code>"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Rule */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-700 mb-3">Add New Rule</h4>
          
          <div className="space-y-4">
            {/* Rule Name */}
            <div>
              <label htmlFor="ruleName" className="block text-sm font-medium text-gray-700">
                Rule Name
              </label>
              <input
                id="ruleName"
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Work Emails"
              />
            </div>
            
            {/* Target Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Assign to Category
              </label>
              <select
                id="category"
                value={newRule.categoryId}
                onChange={(e) => setNewRule(prev => ({ ...prev, categoryId: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions
              </label>
              
              {newRule.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="sender">From</option>
                    <option value="subject">Subject</option>
                    <option value="snippet">Content</option>
                  </select>
                  
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="startsWith">starts with</option>
                    <option value="endsWith">ends with</option>
                  </select>
                  
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Value to match"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="p-1 rounded-full text-red-400 hover:bg-red-100"
                    disabled={newRule.conditions.length === 1}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCondition}
                className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <FiPlus className="mr-1" size={16} />
                Add condition
              </button>
            </div>
            
            {/* Save Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={saveRule}
                disabled={loading || !newRule.name || !newRule.categoryId}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FiSave className="mr-2 -ml-1" size={16} />
                Save Rule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryRulesTab;
