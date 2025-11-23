import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  
  const variants = {
    primary: "bg-[#3EC7FF] text-[#0D2137] hover:bg-[#2aaee0] hover:shadow-md border border-transparent",
    secondary: "bg-white text-[#0D2137] border border-gray-200 hover:bg-gray-50 hover:border-[#3EC7FF]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
    ghost: "bg-transparent text-[#0D2137] hover:bg-[#3EC7FF]/10 shadow-none"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};