/**
 * Modern DOM Observer Utility
 * Replaces deprecated DOMSubtreeModified with MutationObserver
 */

import { useState, useEffect } from 'react';

class ModernDOMObserver {
  constructor() {
    this.observers = new Map();
  }

  /**
   * Observe DOM changes using modern MutationObserver
   * @param {Element} target - Element to observe
   * @param {Function} callback - Callback function for changes
   * @param {Object} options - Observer options
   */
  observe(target, callback, options = {}) {
    const defaultOptions = {
      childList: true,
      subtree: true,
      attributes: false,
      attributeOldValue: false,
      characterData: false,
      characterDataOldValue: false
    };

    const observerOptions = { ...defaultOptions, ...options };

    // Create MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        callback({
          type: mutation.type,
          target: mutation.target,
          addedNodes: Array.from(mutation.addedNodes),
          removedNodes: Array.from(mutation.removedNodes),
          attributeName: mutation.attributeName,
          oldValue: mutation.oldValue
        });
      });
    });

    // Start observing
    observer.observe(target, observerOptions);

    // Store observer for cleanup
    const observerId = this.generateId();
    this.observers.set(observerId, observer);

    return observerId;
  }

  /**
   * Stop observing a specific target
   * @param {string} observerId - ID returned from observe()
   */
  disconnect(observerId) {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(observerId);
    }
  }

  /**
   * Stop all observers
   */
  disconnectAll() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  /**
   * Generate unique ID for observers
   */
  generateId() {
    return `observer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const domObserver = new ModernDOMObserver();

// React Hook for DOM observation
export const useDOMObserver = (callback, options = {}) => {
  const [observerId, setObserverId] = useState(null);

  useEffect(() => {
    return () => {
      if (observerId) {
        domObserver.disconnect(observerId);
      }
    };
  }, [observerId]);

  const startObserving = (target) => {
    if (observerId) {
      domObserver.disconnect(observerId);
    }
    
    const newObserverId = domObserver.observe(target, callback, options);
    setObserverId(newObserverId);
    return newObserverId;
  };

  const stopObserving = () => {
    if (observerId) {
      domObserver.disconnect(observerId);
      setObserverId(null);
    }
  };

  return { startObserving, stopObserving };
};

// Utility functions for common use cases
export const observeElementChanges = (element, callback) => {
  return domObserver.observe(element, callback, {
    childList: true,
    subtree: true,
    attributes: true
  });
};

export const observeContentChanges = (element, callback) => {
  return domObserver.observe(element, callback, {
    childList: true,
    subtree: true,
    characterData: true
  });
};

export const observeAttributeChanges = (element, callback, attributeFilter = null) => {
  return domObserver.observe(element, callback, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter
  });
};

// Cleanup function
export const cleanupDOMObservers = () => {
  domObserver.disconnectAll();
};

export default domObserver;
