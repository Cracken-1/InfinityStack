type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry = this.formatMessage(level, message, context)
    
    if (this.isDevelopment) {
      const color = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m'
      }[level]
      
      console.log(`${color}[${entry.timestamp}] ${level.toUpperCase()}: ${message}\x1b[0m`)
      if (context) console.log(context)
    } else {
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const context = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : error
    this.log('error', message, context)
  }
}

export const logger = new Logger()