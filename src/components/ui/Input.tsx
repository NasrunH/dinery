import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
}

export const Input = ({ label, icon, rightElement, error, className = "", ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1 transition-colors">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-gray-50 dark:bg-gray-800 border ${
            error 
              ? "border-rose-400 dark:border-rose-600 focus:ring-rose-100 dark:focus:ring-rose-950" 
              : "border-gray-100 dark:border-gray-700 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-950"
          } text-gray-800 dark:text-gray-100 rounded-2xl py-3.5 ${
            icon ? "pl-11" : "px-4"
          } ${
            rightElement ? "pr-12" : "pr-4"
          } focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-800/90 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed dark:disabled:bg-gray-900 ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 ml-1 font-medium">{error}</p>
      )}
    </div>
  );
};
