/**
 * Console Utility for Development
 * Handles deprecation warnings and provides clean logging
 */

class ConsoleManager {
  constructor() {
    this.originalWarn = console.warn;
    this.originalError = console.error;
    this.suppressedWarnings = new Set();
    this.init();
  }

  init() {
    // Override console.warn to filter deprecated warnings
    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Filter out known deprecation warnings that we can't control
      const deprecatedPatterns = [
        /DOMSubtreeModified.*mutation event/i,
        /enable_copy\.js/i,
        /Listener added for a.*mutation event/i,
        /Support for this event type has been removed/i,
        /chromestatus\.com\/feature/i
      ];

      const isDeprecationWarning = deprecatedPatterns.some(pattern => 
        pattern.test(message)
      );

      if (isDeprecationWarning) {
        // Log to our suppressed warnings for debugging
        this.suppressedWarnings.add(message);
        
        // Only show in development if explicitly requested
        if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('showDeprecated')) {
          this.originalWarn('🔕 [SUPPRESSED]', ...args);
        }
        return;
      }

      // Show other warnings normally
      this.originalWarn(...args);
    };
  }

  /**
   * Show suppressed warnings (for debugging)
   */
  showSuppressedWarnings() {
    if (this.suppressedWarnings.size > 0) {
      console.group('🔕 Suppressed Deprecation Warnings');
      this.suppressedWarnings.forEach(warning => {
        console.log('⚠️', warning);
      });
      console.groupEnd();
    } else {
      console.log('✅ No deprecation warnings suppressed');
    }
  }

  /**
   * Clear suppressed warnings
   */
  clearSuppressed() {
    this.suppressedWarnings.clear();
  }

  /**
   * Restore original console methods
   */
  restore() {
    console.warn = this.originalWarn;
    console.error = this.originalError;
  }

  /**
   * Enhanced logging for development
   */
  devLog(message, data = null, type = 'info') {
    if (!import.meta.env.DEV) return;

    const styles = {
      info: 'color: #3b82f6; font-weight: bold',
      success: 'color: #10b981; font-weight: bold',
      warning: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
      ai: 'color: #8b5cf6; font-weight: bold'
    };

    console.log(`%c🧠 MeetMind [${type.toUpperCase()}]`, styles[type] || styles.info, message);
    
    if (data) {
      console.log(data);
    }
  }
}

// Create singleton instance
const consoleManager = new ConsoleManager();

// Development utilities
export const devLog = {
  info: (message, data) => consoleManager.devLog(message, data, 'info'),
  success: (message, data) => consoleManager.devLog(message, data, 'success'),
  warning: (message, data) => consoleManager.devLog(message, data, 'warning'),
  error: (message, data) => consoleManager.devLog(message, data, 'error'),
  ai: (message, data) => consoleManager.devLog(message, data, 'ai')
};

// Global debugging utilities
if (typeof window !== 'undefined') {
  window.MeetMindDebug = {
    showSuppressedWarnings: () => consoleManager.showSuppressedWarnings(),
    clearSuppressed: () => consoleManager.clearSuppressed(),
    restore: () => consoleManager.restore()
  };
}

export default consoleManager;
