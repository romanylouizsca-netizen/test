import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XIcon } from './Icons.tsx';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-green-800/90',
      border: 'border-green-600',
      icon: <CheckCircleIcon className="w-6 h-6 text-green-300 ml-3" />,
      text: 'text-green-200'
    },
    error: {
      bg: 'bg-red-800/90',
      border: 'border-red-600',
      icon: <XCircleIcon className="w-6 h-6 text-red-300 ml-3" />,
      text: 'text-red-200'
    },
  };

  const styles = typeStyles[type];

  return (
    <div 
      className={`fixed top-5 left-1/2 -translate-x-1/2 min-w-[300px] max-w-md p-4 rounded-lg shadow-2xl flex items-center z-50 border backdrop-blur-sm ${styles.bg} ${styles.border}`}
      role="alert"
    >
      {styles.icon}
      <p className={`flex-grow font-semibold ${styles.text}`}>{message}</p>
      <button 
        onClick={onClose} 
        className="text-gray-400 hover:text-white transition-colors duration-200 p-1 -mr-2"
        aria-label="إغلاق"
      >
        <XIcon className="w-5 h-5"/>
      </button>
    </div>
  );
};

export default Toast;
