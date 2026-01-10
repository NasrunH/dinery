import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = "primary", 
  isLoading, 
  className = "", 
  ...props 
}: ButtonProps) => {
  const baseStyles = "w-full py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200 active:scale-95 flex justify-center items-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-200 hover:shadow-primary-300",
    secondary: "bg-peach-light text-primary-700 hover:bg-peach",
    outline: "border-2 border-primary-200 text-primary-600 hover:bg-primary-50",
    ghost: "bg-transparent text-gray-500 hover:text-primary-500 hover:bg-primary-50",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};