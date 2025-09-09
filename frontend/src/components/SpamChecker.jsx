import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// TypeScript type definitions
const initialAdvancedOptions = {
    checkLinks: true,
    checkAttachments: true,
    checkSenderReputation: true,
    sensitivityLevel: 'medium'
};

const SpamChecker = () => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [advancedOptions, setAdvancedOptions] = useState({
        checkLinks: true,
        checkAttachments: true,
        checkSenderReputation: true,
        sensitivityLevel: 'medium'
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('spamCheckHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const saveToHistory = (result) => {
        const newHistory = [
            { 
                date: new Date().toISOString(),
                subject,
                content: content.substring(0, 100) + '...',
                score: result.spamScore,
                id: Date.now()
            },
            ...history
        ].slice(0, 10);
        
        setHistory(newHistory);
        localStorage.setItem('spamCheckHistory', JSON.stringify(newHistory));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                setContent(text);
            } catch (error) {
                setError('Error reading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    const exportAnalysis = () => {
        if (!analysis) return;

        const exportData = {
            date: new Date().toISOString(),
            subject,
            content,
            analysis,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spam-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const checkSpam = async () => {
        if (!content.trim()) {
            setError('Please enter some content to analyze');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/emails/analyze', { 
                subject,
                body: content,
                options: advancedOptions
            });
            setAnalysis(response.data);
            saveToHistory(response.data);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to analyze content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold flex items-center text-gray-900">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
                    </svg>
                    Email Content Analyzer
                </h2>
            </div>
            
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        placeholder="Email subject..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                </div>

                <div className="relative">
                    <textarea
                        placeholder="Paste email content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows={6}
                    />
                    <div className="absolute bottom-2 right-2 flex space-x-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            title="Upload file"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                            </svg>
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".txt,.eml,.html"
                    />
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Advanced Options</h3>
                        <button
                            onClick={() => setAdvancedOptions({
                                checkLinks: true,
                                checkAttachments: true,
                                checkSenderReputation: true,
                                sensitivityLevel: 'medium'
                            })}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                            Reset to Default
                        </button>
                    </div>
                    <div className="space-y-2">
                        {Object.entries({
                            checkLinks: 'Check for suspicious links',
                            checkAttachments: 'Analyze attachment types',
                            checkSenderReputation: 'Check sender reputation'
                        }).map(([key, label]) => (
                            <label key={key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={advancedOptions[key]}
                                    onChange={(e) => setAdvancedOptions(prev => ({
                                        ...prev,
                                        [key]: e.target.checked
                                    }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">{label}</span>
                            </label>
                        ))}
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Sensitivity:</span>
                            <select
                                value={advancedOptions.sensitivityLevel}
                                onChange={(e) => setAdvancedOptions(prev => ({
                                    ...prev,
                                    sensitivityLevel: e.target.value
                                }))}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={checkSpam}
                    disabled={loading || !content.trim()}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        loading || !content.trim()
                            ? 'bg-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        'Analyze Content'
                    )}
                </button>
            </div>

            {analysis && (
                <div className="mt-6 space-y-4">
                    <div className="relative pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">Spam Score</span>
                            <span className={`text-sm font-medium ${
                                analysis.spamScore > 0.6 ? 'text-red-600' : 
                                analysis.spamScore > 0.3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                                {Math.round(analysis.spamScore * 100)}%
                            </span>
                        </div>
                        <div className="overflow-hidden h-2 mt-2 text-xs flex rounded bg-gray-200">
                            <div 
                                style={{ width: `${analysis.spamScore * 100}%` }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                    analysis.spamScore > 0.6 ? 'bg-red-500' : 
                                    analysis.spamScore > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                            ></div>
                        </div>
                    </div>

                    {analysis.reasons.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-900">Detected Issues:</h3>
                            <ul className="mt-2 space-y-1">
                                {analysis.reasons.map((reason, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-500">
                                        <svg className="h-4 w-4 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.summary && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-900">AI-Generated Summary:</h3>
                            <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-md p-4">
                                {analysis.summary}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={exportAnalysis}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Analysis
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 bg-gray-50 rounded-lg p-4"
                    >
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis History</h3>
                        {history.length === 0 ? (
                            <p className="text-gray-500 text-sm">No previous analyses</p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white p-4 rounded-md shadow-sm"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{item.subject || 'No subject'}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{item.content}</p>
                                            </div>
                                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                                item.score > 0.6 ? 'bg-red-100 text-red-800' : 
                                                item.score > 0.3 ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {Math.round(item.score * 100)}% Spam
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400">
                                            {new Date(item.date).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpamChecker;
