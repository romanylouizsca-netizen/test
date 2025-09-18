
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, className, ...props }) => {
  const selectId = id || label;
  return (
    <div>
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <select
        id={selectId}
        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${className || ''}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
