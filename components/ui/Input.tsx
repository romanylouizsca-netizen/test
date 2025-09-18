
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  const inputId = id || label;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        id={inputId}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        {...props}
      />
    </div>
  );
};

export default Input;
