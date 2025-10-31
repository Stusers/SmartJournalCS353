/**
 * Simple structured logger utility
 * Replaces console.log with proper logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message?: string;
  data?: any;
}

class Logger {
  private formatLog(level: LogLevel, data: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
    };

    if (typeof data === 'string') {
      entry.message = data;
    } else if (data instanceof Error) {
      entry.message = data.message;
      entry.data = {
        errorName: data.name,
        stack: data.stack,
      };
    } else {
      entry.data = data;
    }

    return entry;
  }

  private output(level: LogLevel, data: any) {
    const log = this.formatLog(level, data);
    const output = JSON.stringify(log);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'info':
      case 'debug':
      default:
        console.log(output);
        break;
    }
  }

  info(data: any) {
    this.output('info', data);
  }

  warn(data: any) {
    this.output('warn', data);
  }

  error(data: any) {
    this.output('error', data);
  }

  debug(data: any) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.output('debug', data);
    }
  }

  // For database query logging
  query(text: string, duration: number, rowCount?: number) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.debug({
        type: 'database_query',
        query: text.substring(0, 100), // Truncate long queries
        duration: `${duration}ms`,
        rows: rowCount,
      });
    }
  }

  // Helper for HTTP requests
  http(method: string, path: string, statusCode: number, duration?: number) {
    this.info({
      type: 'http_request',
      method,
      path,
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    });
  }
}

export const logger = new Logger();
