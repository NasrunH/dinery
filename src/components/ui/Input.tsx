import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, icon, className = "", ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-gray-50 border border-gray-100 text-gray-800 rounded-2xl py-3.5 ${icon ? "pl-11" : "px-4"} pr-4 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 focus:bg-white transition-all placeholder:text-gray-400 ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};