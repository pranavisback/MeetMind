import React from 'react';

/**
 * Individual Toast Component
 * @param {Object} toast - Toast object with id, message, type, and duration
 * @param {Function} onRemove - Function to remove toast from context
 */
const Toast = ({ toast, onRemove }) => {
  const { id, message, type, duration = 3000 } = toast;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white shadow-green-200';
      case 'error':
        return 'bg-red-500 border-red-600 text-white shadow-red-200';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-white shadow-yellow-200';
      case 'info':
        return 'bg-blue-500 border-blue-600 text-white shadow-blue-200';
      default:
        return 'bg-gray-700 border-gray-600 text-white shadow-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div
      className={`
        relative flex items-center gap-3 px-4 py-3 mb-3 rounded-lg border-l-4 
        shadow-lg transform transition-all duration-300 ease-in-out
        animate-slide-in hover:scale-105 backdrop-blur-sm
        ${getTypeStyles()}
      `}
    >
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
        <span className="text-sm font-bold">{getIcon()}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed break-words">
          {message}
        </p>
      </div>
      
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors duration-200"
        aria-label="Close notification"
      >
        <span className="text-sm font-bold">×</span>
      </button>
    </div>
  );
};

export default Toast;
