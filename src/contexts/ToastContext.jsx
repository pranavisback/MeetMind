import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Toast Context for managing global toast notifications
 */
const ToastContext = createContext();

/**
 * Custom hook to use Toast context
 * @returns {Object} - showToast function and toasts array
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Toast Provider Component
 * @param {Object} children - React children components
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - How long to show toast (ms)
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random(); // Generate unique ID
    const newToast = {
      id,
      message,
      type,
      duration,
      timestamp: new Date().toISOString()
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  /**
   * Remove a toast by ID
   * @param {string|number} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Convenience methods for different toast types
   */
  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const value = {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;
