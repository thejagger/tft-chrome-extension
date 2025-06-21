/**
 * Centralized logging utility for TFT Chrome Extension
 * Provides consistent logging with context and error handling
 */

/**
 * Logger class for consistent logging across extension
 */
class Logger {
  constructor() {
    this.enabled = CONFIG.LOGGING.ENABLED;
    this.level = CONFIG.LOGGING.LEVEL;
    this.prefix = CONFIG.LOGGING.PREFIX;
    
    // Log level hierarchy
    this.levels = {
      debug: 0,
      info: 1, 
      warn: 2,
      error: 3
    };
  }

  /**
   * Check if log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to log
   */
  shouldLog(level) {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.level];
  }

  /**
   * Format log message with timestamp and context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   * @returns {string} Formatted message
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 
      ? JSON.stringify(context) 
      : '';
    
    return `${this.prefix} [${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  /**
   * Debug level logging
   * @param {string} message - Debug message
   * @param {object} context - Additional context
   */
  debug(message, context = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Info level logging
   * @param {string} message - Info message  
   * @param {object} context - Additional context
   */
  info(message, context = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Warning level logging
   * @param {string} message - Warning message
   * @param {object} context - Additional context
   */
  warn(message, context = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Error level logging with stack trace
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or context
   */
  error(message, error = {}) {
    if (this.shouldLog('error')) {
      const context = error instanceof Error 
        ? { 
            message: error.message, 
            stack: error.stack,
            name: error.name 
          }
        : error;
      
      console.error(this.formatMessage('error', message, context));
    }
  }
}

// Create singleton instance
const logger = new Logger(); 