const format = (level: string, ...args: unknown[]) => {
  const ts = new Date().toISOString()
  return [`[${ts}] [${level}]`, ...args]
}

export const logger = {
  // Defaults to false in test environment, true otherwise
  enabled: typeof process !== "undefined" && process.env.NODE_ENV !== "test",

  log: (...args: unknown[]) => {
    if (logger.enabled) {
      console.log(...format("LOG", ...args))
    }
  },
  info: (...args: unknown[]) => {
    if (logger.enabled) {
      console.info(...format("INFO", ...args))
    }
  },
  warn: (...args: unknown[]) => {
    if (logger.enabled) {
      console.warn(...format("WARN", ...args))
    }
  },
  error: (...args: unknown[]) => {
    // Errors are usually kept visible even in tests
    console.error(...format("ERROR", ...args))
  },
}
