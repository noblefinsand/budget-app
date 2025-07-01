import { useState, useEffect, useRef } from 'react';
import type { ExpenseCategory } from '../types/expense';
import { CATEGORY_COLORS } from '../types/expense';

interface CategorySelectProps {
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
  label?: string;
  className?: string;
}

const CATEGORIES: ExpenseCategory[] = [
  'housing', 'utilities', 'transportation', 'food', 'entertainment', 'healthcare', 'insurance', 'debt', 'savings', 'other'
];

export default function CategorySelect({ value, onChange, label, className = '' }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCategory = CATEGORIES.find(cat => cat === value) || 'other';

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-gray-300 mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border border-gray-600"
            style={{ backgroundColor: CATEGORY_COLORS[selectedCategory] }}
          />
          <span>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                onChange(category);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 ${
                category === value ? 'bg-gray-700' : ''
              }`}
            >
              <div 
                className="w-4 h-4 rounded-full border border-gray-600"
                style={{ backgroundColor: CATEGORY_COLORS[category] }}
              />
              <span className="text-white">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 