import React from 'react';
import { InformationCircleIcon } from './Icons.tsx';

interface AlertProps {
  message: string;
  type?: 'error' | 'info';
}

const Alert: React.FC<AlertProps> = ({ message, type = 'error' }) => {
  if (!message) return null;

  const typeClasses = {
    error: 'bg-red-900/50 text-red-300 border-red-500/50',
    info: 'bg-sky-900/50 text-sky-300 border-sky-500/50',
  };

  return (
    <div className={`p-3 rounded-md flex items-center border ${typeClasses[type]}`} role="alert">
      <InformationCircleIcon className="w-5 h-5 ml-2 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Alert;
