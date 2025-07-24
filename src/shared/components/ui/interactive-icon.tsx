import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@shared/lib/cn';

interface InteractiveIconProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  fieldName?: string;
  onSuggestionSelect?: (suggestion: string) => void;
}

export const InteractiveIcon: React.FC<InteractiveIconProps> = ({
  icon,
  onClick,
  className,
  fieldName}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) {
        onClick();
      }
    }
  };

  return (
    <div
      className={cn(
        "cursor-pointer transition-all duration-200",
        isHovered ? "text-primary scale-110" : "",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Show suggestions for ${fieldName || 'field'}`}
    >
      {icon}
    </div>
  );
};

interface SuggestionMenuProps {
  isOpen: boolean;
  suggestions: Array<{ value: string; count: number }>;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  fieldName?: string;
}

export const SuggestionMenu: React.FC<SuggestionMenuProps> = ({
  isOpen,
  suggestions,
  onSelect,
  onClose,
  fieldName
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-[9999] w-full mt-1 bg-white dark:bg-background border border-gray-200 dark:border-gray-700 rounded-md shadow-xl max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
    >
      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''} para {fieldName || 'este campo'}
      </div>
      
      {suggestions.length > 0 ? (
        suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.value}-${index}`}
            className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center transition-colors"
            onClick={() => onSelect(suggestion.value)}
          >
            <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">
              {suggestion.value}
            </span>
            <span className="text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700">
              {suggestion.count}
            </span>
          </div>
        ))
      ) : (
        <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
          No hay sugerencias disponibles
        </div>
      )}
      
      <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        Haz clic en una sugerencia para seleccionarla
      </div>
    </div>
  );
};