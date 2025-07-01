import { useState, useEffect, useRef } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#6B7280', // Gray
];

export default function ColorPicker({ value, onChange, label, className = '' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {label && (
        <label className="block text-gray-300 mb-1">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg border-2 border-gray-600 flex items-center justify-center hover:border-gray-500 transition-colors"
          style={{ backgroundColor: value }}
        >
          <div className="w-6 h-6 rounded border border-white/20" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="#3B82F6"
        />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="text-xs text-gray-400 text-center">
            Click a color or enter a hex value
          </div>
        </div>
      )}
    </div>
  );
} 