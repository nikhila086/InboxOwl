import React from 'react';
import { motion } from 'framer-motion';

function Loader({ size = 'medium', className = '' }) {
  const sizes = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex justify-center items-center ${className}`}
    >
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${sizes[size]}`}></div>
    </motion.div>
  );
}

export default Loader;
