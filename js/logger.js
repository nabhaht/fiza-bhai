/**
 * Logger utility for consistent logging
 */
class Logger {
  static debug(message) {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
  }
  static info(message) {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`);
  }
  static warn(message) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }
  static error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
}