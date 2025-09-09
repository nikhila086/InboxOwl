import React, { useState, useEffect } from 'react';
import { FiSettings, FiTrash2, FiCheck, FiTag, FiShield, FiEdit2, FiPlus, FiX, FiLoader, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { clearEmailCache } from '../utils/emailCache';
import { motion } from 'framer-motion';
import axios from 'axios';
import CategoryRulesTab from './CategoryRulesTab';

const SettingsPanel = ({ onClose }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('cache');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#4f46e5' });
  const [spamRules, setSpamRules] = useState([]);
  const [newRule, setNewRule] = useState({ pattern: '', score: 0.3, enabled: true });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });
  
  // Fetch categories and rules from backend on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch categories
        const categoriesRes = await axios.get('http://localhost:3000/api/categories');
        if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        } else {
          // Fallback to default categories
          setCategories([
            { id: 1, name: 'Work', color: '#4f46e5' },
            { id: 2, name: 'Finance', color: '#16a34a' },
            { id: 3, name: 'Social', color: '#f59e0b' },
            { id: 4, name: 'Promotions', color: '#8b5cf6' },
            { id: 5, name: 'Other', color: '#6b7280' }
          ]);
        }
        
        // Fetch spam rules
        const rulesRes = await axios.get('http://localhost:3000/api/spam-rules');
        if (rulesRes.data && Array.isArray(rulesRes.data)) {
          setSpamRules(rulesRes.data);
        } else {
          // Fallback to default rules
          setSpamRules([
            { id: 1, pattern: 'urgent', score: 0.3, enabled: true },
            { id: 2, pattern: 'limited time', score: 0.2, enabled: true },
            { id: 3, pattern: 'account suspended', score: 0.4, enabled: true },
            { id: 4, pattern: 'verify your account', score: 0.5, enabled: true },
            { id: 5, pattern: 'free money', score: 0.7, enabled: true }
          ]);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Using default values.');
        // Set default values
        setCategories([
          { id: 1, name: 'Work', color: '#4f46e5' },
          { id: 2, name: 'Finance', color: '#16a34a' },
          { id: 3, name: 'Social', color: '#f59e0b' },
          { id: 4, name: 'Promotions', color: '#8b5cf6' },
          { id: 5, name: 'Other', color: '#6b7280' }
        ]);
        setSpamRules([
          { id: 1, pattern: 'urgent', score: 0.3, enabled: true },
          { id: 2, pattern: 'limited time', score: 0.2, enabled: true },
          { id: 3, pattern: 'account suspended', score: 0.4, enabled: true },
          { id: 4, pattern: 'verify your account', score: 0.5, enabled: true },
          { id: 5, pattern: 'free money', score: 0.7, enabled: true }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleClearCache = () => {
    clearEmailCache();
    setClearSuccess(true);
    setShowConfirm(false);
    setTimeout(() => setClearSuccess(false), 3000);
  };
  
  // Show save status notification and auto-hide it after delay
  const showSaveStatus = (success, message) => {
    setSaveStatus({ success, message });
    setTimeout(() => setSaveStatus({ success: false, message: '' }), 3000);
  };
  
  // Add a new category
  const addCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    try {
      setLoading(true);
      const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
      const categoryWithId = { ...newCategory, id: newId };
      
      // Save to backend
      await axios.post('http://localhost:3000/api/categories', categoryWithId);
      
      // Update state
      setCategories([...categories, categoryWithId]);
      setNewCategory({ name: '', color: '#4f46e5' });
      showSaveStatus(true, 'Category added successfully');
    } catch (err) {
      console.error('Error adding category:', err);
      showSaveStatus(false, 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new spam rule
  const addRule = async () => {
    if (!newRule.pattern.trim()) return;
    
    try {
      setLoading(true);
      const newId = spamRules.length > 0 ? Math.max(...spamRules.map(r => r.id)) + 1 : 1;
      const ruleWithId = { ...newRule, id: newId };
      
      // Save to backend
      await axios.post('http://localhost:3000/api/spam-rules', ruleWithId);
      
      // Update state
      setSpamRules([...spamRules, ruleWithId]);
      setNewRule({ pattern: '', score: 0.3, enabled: true });
      showSaveStatus(true, 'Rule added successfully');
    } catch (err) {
      console.error('Error adding rule:', err);
      showSaveStatus(false, 'Failed to add rule');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a category
  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      
      // Delete from backend
      await axios.delete(`http://localhost:3000/api/categories/${id}`);
      
      // Update state
      setCategories(categories.filter(cat => cat.id !== id));
      showSaveStatus(true, 'Category deleted successfully');
    } catch (err) {
      console.error('Error deleting category:', err);
      showSaveStatus(false, 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a spam rule
  const deleteRule = async (id) => {
    try {
      setLoading(true);
      
      // Delete from backend
      await axios.delete(`http://localhost:3000/api/spam-rules/${id}`);
      
      // Update state
      setSpamRules(spamRules.filter(rule => rule.id !== id));
      showSaveStatus(true, 'Rule deleted successfully');
    } catch (err) {
      console.error('Error deleting rule:', err);
      showSaveStatus(false, 'Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle a spam rule's enabled status
  const toggleRule = async (id) => {
    try {
      setLoading(true);
      
      // Find the rule and toggle its status
      const rule = spamRules.find(r => r.id === id);
      if (!rule) return;
      
      const updatedRule = { ...rule, enabled: !rule.enabled };
      
      // Update in backend
      await axios.put(`http://localhost:3000/api/spam-rules/${id}`, updatedRule);
      
      // Update state
      setSpamRules(spamRules.map(r => r.id === id ? updatedRule : r));
      showSaveStatus(true, `Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Error updating rule:', err);
      showSaveStatus(false, 'Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FiSettings className="mr-2" /> Settings
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setActiveTab('cache')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cache' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cache Management
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('categoryRules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categoryRules' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center">
              <FiFilter className="mr-1" />
              Category Rules
            </span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Spam Rules
          </button>
        </nav>
      </div>

      {/* Cache Management */}
      {activeTab === 'cache' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 mb-3">Cache Management</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Email content is cached locally to improve performance.
              You can clear this cache if you're experiencing any issues.
            </p>
            
            {!showConfirm && !clearSuccess && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm"
              >
                <FiTrash2 className="mr-2" /> Clear Email Cache
              </button>
            )}
            
            {showConfirm && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                <p className="text-sm text-red-700 mb-2">Are you sure? This will clear all cached email content.</p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearCache}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Yes, Clear Cache
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {clearSuccess && (
              <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center text-green-700">
                <FiCheck className="mr-2" /> Cache cleared successfully!
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Category Rules Tab */}
      {activeTab === 'categoryRules' && <CategoryRulesTab />}

      {/* Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 flex items-center">
            <FiTag className="mr-2" /> Email Categories
          </h3>
          
          <p className="text-sm text-gray-600">
            Manage email categories to organize your inbox. Categories help classify emails automatically.
          </p>
          
          <div className="space-y-2 mt-3">
            {categories.map(category => (
              <div 
                key={category.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex items-center">
                  <span 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <span>{category.name}</span>
                </div>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Add new category */}
          <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Category</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Category name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                className="w-12 h-9 p-0 border border-gray-300 rounded-md shadow-sm cursor-pointer"
              />
              <button
                onClick={addCategory}
                disabled={!newCategory.name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FiPlus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spam Rules Management */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 flex items-center">
            <FiShield className="mr-2" /> Spam Detection Rules
          </h3>
          
          <p className="text-sm text-gray-600">
            Manage spam detection rules. Rules are patterns that will increase an email's spam score when matched.
          </p>
          
          <div className="space-y-2 mt-3">
            {spamRules.map(rule => (
              <div 
                key={rule.id}
                className={`flex justify-between items-center p-3 rounded-md border ${
                  rule.enabled ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">
                    {rule.pattern}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Score: +{rule.score.toFixed(1)}
                  </span>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add new rule */}
          <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Rule</h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newRule.pattern}
                onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                placeholder="Pattern to match"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <input
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={newRule.score}
                onChange={(e) => setNewRule({...newRule, score: parseFloat(e.target.value)})}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <button
                onClick={addRule}
                disabled={!newRule.pattern.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FiPlus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-indigo-600">
            <FiLoader className="animate-spin h-5 w-5" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <FiX />
          </button>
        </div>
      )}

      {/* Save status notification */}
      {saveStatus.message && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg flex items-center space-x-2 ${
          saveStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveStatus.success ? <FiCheck /> : <FiX />}
          <span>{saveStatus.message}</span>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        InboxOwl &copy; {new Date().getFullYear()}
      </div>
    </motion.div>
  );
};

export default SettingsPanel;
