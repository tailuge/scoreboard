export interface ErrorContext {
  /** Operation name for identifying the failure source, e.g. "fetchLeaderboard" */
  operation?: string
  /** Source file/component, e.g. "src/components/hooks/useLeaderboard.ts" */
  file?: string
  /** Target URL of the operation */
  url?: string
  /** HTTP method */
  method?: string
  /** HTTP status code if available */
  status?: number | null
  /** Additional key-value context */
  details?: Record<string, unknown>
}

function buildErrorMessage(error: Error, ctx: ErrorContext): string {
  const lines = [error.message, `  Error: ${error.name}: ${error.message}`]
  if (ctx.operation) lines.push(`  Operation: ${ctx.operation}`)
  if (ctx.file) lines.push(`  File: ${ctx.file}`)
  if (ctx.url) lines.push(`  URL: ${ctx.url}`)
  if (ctx.method) lines.push(`  Method: ${ctx.method}`)
  if (ctx.status != null) lines.push(`  Status: ${ctx.status}`)
  if (error.stack) {
    lines.push(`  Stack: ${error.stack.split("\n").slice(1).join(" | ")}`)
  }
  if (ctx.details) {
    for (const [k, v] of Object.entries(ctx.details)) {
      const value =
        typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)
      lines.push(`  ${k}: ${value}`)
    }
  }
  return lines.join("\n")
}

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
  error: (message: string, error?: unknown, ctx?: ErrorContext) => {
    if (error instanceof Error && ctx) {
      console.error(message + "\n" + buildErrorMessage(error, ctx))
    } else if (error == null) {
      console.error(message)
    } else {
      console.error(message, error)
    }
  },
}
