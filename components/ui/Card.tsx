import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 
        overflow-hidden transition-transform duration-300 hover:shadow-[6px_6px_15px_rgba(62,199,255,0.1)]
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${noPadding ? '' : 'p-6'} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};