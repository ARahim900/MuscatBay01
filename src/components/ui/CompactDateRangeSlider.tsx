import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactDateRangeSliderProps {
  startDate?: string;
  endDate?: string;
  onDateChange?: (start: string, end: string) => void;
  className?: string;
}

export const CompactDateRangeSlider: React.FC<CompactDateRangeSliderProps> = ({
  startDate = 'Jan-25',
  endDate = 'Jul-25',
  onDateChange,
  className = ''
}) => {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = ['24', '25', '26'];
  
  const getMonthIndex = (monthYear: string) => {
    const [month] = monthYear.split('-');
    return months.indexOf(month);
  };
  
  const navigateMonth = (current: string, direction: 'prev' | 'next') => {
    const [month, year] = current.split('-');
    const monthIndex = months.indexOf(month);
    const yearIndex = years.indexOf(year);
    
    if (direction === 'next') {
      if (monthIndex === 11) {
        if (yearIndex < years.length - 1) {
          return `${months[0]}-${years[yearIndex + 1]}`;
        }
      } else {
        return `${months[monthIndex + 1]}-${year}`;
      }
    } else {
      if (monthIndex === 0) {
        if (yearIndex > 0) {
          return `${months[11]}-${years[yearIndex - 1]}`;
        }
      } else {
        return `${months[monthIndex - 1]}-${year}`;
      }
    }
    return current;
  };

  return (
    <div className={`inline-flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <Calendar className="w-4 h-4 text-gray-500" />
      
      {/* Start Date */}
      <div className="flex items-center gap-1">
        <button 
          onClick={() => {
            const newStart = navigateMonth(start, 'prev');
            if (newStart) {
              setStart(newStart);
              onDateChange?.(newStart, end);
            }
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-sm font-medium min-w-[60px] text-center">
          {start}
        </span>
        <button 
          onClick={() => {
            const newStart = navigateMonth(start, 'next');
            if (newStart) {
              setStart(newStart);
              onDateChange?.(newStart, end);
            }
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <span className="text-gray-400 text-sm">to</span>
      
      {/* End Date */}
      <div className="flex items-center gap-1">
        <button 
          onClick={() => {
            const newEnd = navigateMonth(end, 'prev');
            if (newEnd) {
              setEnd(newEnd);
              onDateChange?.(start, newEnd);
            }
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-sm font-medium min-w-[60px] text-center">
          {end}
        </span>
        <button 
          onClick={() => {
            const newEnd = navigateMonth(end, 'next');
            if (newEnd) {
              setEnd(newEnd);
              onDateChange?.(start, newEnd);
            }
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};