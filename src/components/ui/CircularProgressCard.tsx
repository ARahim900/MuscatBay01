import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressCardProps {
  title: string;
  value: string | number;
  percentage: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  subtitle?: string;
  unit?: string;
  className?: string;
  showAnimation?: boolean;
}

export const CircularProgressCard: React.FC<CircularProgressCardProps> = ({
  title,
  value,
  percentage,
  color = 'blue',
  subtitle,
  unit = 'm³',
  className = '',
  showAnimation = true
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-100 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      stroke: '#3B82F6',
      fill: 'rgba(59, 130, 246, 0.1)'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-100 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400',
      stroke: '#10B981',
      fill: 'rgba(16, 185, 129, 0.1)'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-100 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
      stroke: '#EF4444',
      fill: 'rgba(239, 68, 68, 0.1)'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/10',
      border: 'border-yellow-100 dark:border-yellow-800',
      text: 'text-yellow-600 dark:text-yellow-400',
      stroke: '#F59E0B',
      fill: 'rgba(245, 158, 11, 0.1)'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      border: 'border-purple-100 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      stroke: '#8B5CF6',
      fill: 'rgba(139, 92, 246, 0.1)'
    }
  };

  const colors = colorMap[color];
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <svg width="160" height="160" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: showAnimation ? strokeDashoffset : circumference }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${colors.stroke}40)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div 
            className={`text-3xl font-bold ${colors.text}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            {percentage}%
          </motion.div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <motion.p 
          className={`text-2xl font-bold mt-2 ${colors.text}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {value} <span className="text-sm font-normal">{unit}</span>
        </motion.p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};