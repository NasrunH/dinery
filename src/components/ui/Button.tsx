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
  const baseStyles = "w-full py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200 active:scale-95 flex justify-center items-center gap-2 select-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-200/50 dark:shadow-none hover:shadow-primary-300 dark:hover:brightness-110",
    secondary: "bg-peach-light dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-peach dark:hover:bg-primary-950/60 border border-transparent dark:border-primary-900/40",
    outline: "border-2 border-primary-200 dark:border-primary-800/80 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30",
    ghost: "bg-transparent text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
