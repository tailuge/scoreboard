export const logger = {
  // Defaults to false in test environment, true otherwise
  enabled: typeof process !== "undefined" && process.env.NODE_ENV !== "test",

  log: (...args: any[]) => {
    if (logger.enabled) {
      console.log(...args)
    }
  },
  info: (...args: any[]) => {
    if (logger.enabled) {
      console.info(...args)
    }
  },
  warn: (...args: any[]) => {
    if (logger.enabled) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    // Errors are usually kept visible even in tests
    console.error(...args)
  },
}
