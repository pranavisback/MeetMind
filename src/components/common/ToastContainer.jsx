import React from 'react';
import Toast from './Toast';

/**
 * Toast Container Component - Renders all toasts in a fixed position
 * @param {Array} toasts - Array of toast objects
 * @param {Function} removeToast - Function to remove a toast
 */
const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
