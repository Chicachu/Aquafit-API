import fs, { WriteStream } from 'fs'
import path from 'path'
import { LogLevel } from '../types/enums/LogLevel'
import { LogStatus } from '../types/enums/LogStatus'
import { objectAsString } from './util'

class Logger {
  private readonly _LOG_RETENTION_DAYS: Record<LogLevel, number> = {
    debug: 7,
    info: 14,
    warn: 14,
    error: 30,
    access: 90,
  }

  private logStreams: Partial<Record<LogLevel, WriteStream>> = {}
  private currentDate: string | null = null
  private readonly logDir: string

  constructor() {
    // Logs folder at project root
    this.logDir = path.resolve(process.cwd(), 'logs')
    this._ensureLogDirectoryExists()
    this._openLogStreams()
    this._cleanOldLogs()

    // Clean old logs once per day
    setInterval(() => this._cleanOldLogs(), 24 * 60 * 60 * 1000)

    process.on('SIGINT', () => this._shutdown('SIGINT'))
    process.on('SIGTERM', () => this._shutdown('SIGTERM'))
  }

  public debugInside(fileName: string, methodName: string, details = {}): void {
    let formedMessage = `${LogStatus.INSIDE} [${fileName}:${methodName}]`
    formedMessage += details ? ` ${objectAsString(details)}` : ''
    this._debug(formedMessage)
  }

  public debugComplete(fileName: string, methodName: string, details = {}): void {
    let formedMessage = `${LogStatus.COMPLETE} [${fileName}:${methodName}]`
    formedMessage += details ? ` ${objectAsString(details)}` : ''
    this._debug(formedMessage)
  }

  public info(fileName: string, methodName: string, message: string, details = {}): void {
    let formedMessage = `[${fileName}:${methodName}] - ${message}`
    formedMessage += details ? ` ${objectAsString(details)}` : ''
    this._writeLog(LogLevel.INFO, formedMessage)
  }

  public warn(message: string): void {
    this._writeLog(LogLevel.WARN, message)
  }

  public error(message: string): void {
    this._writeLog(LogLevel.ERROR, message)
  }

  public access(message: string): void {
    this._writeLog(LogLevel.ACCESS, message)
  }

  private _debug(message: string): void {
    this._writeLog(LogLevel.DEBUG, message)
  }

  private _writeLog(logLevel: LogLevel, message: string): void {
    const now = new Date()
    const dateStr = this._getTodaysDate(now)

    if (dateStr !== this.currentDate) {
      this._rotateLogStreams(dateStr)
    }

    const timestamp = now.toISOString()
    const logEntry = `[${timestamp}] [${logLevel.toUpperCase()}]: ${message}\n`

    const stream = this.logStreams[logLevel]
    if (stream) {
      stream.write(logEntry)
    }

    console.log(logEntry.trim())
  }

  private _openLogStreams(): void {
    const dateStr = this._getTodaysDate()

    for (const level of Object.values(LogLevel)) {
      const filePath = this._getLogFilePath(dateStr, level)
      this.logStreams[level] = fs.createWriteStream(filePath, { flags: 'a' })

      this.logStreams[level]!.on('error', (err) => {
        console.error(`Error writing to ${level} log:`, err)
      })
    }
    this.currentDate = dateStr
  }

  private _rotateLogStreams(dateStr: string): void {
    for (const level in this.logStreams) {
      this.logStreams[level as LogLevel]?.end()
    }
    this.logStreams = {}
    this.currentDate = dateStr
    this._openLogStreams()
  }

  private _getLogFilePath(dateStr: string, logLevel: LogLevel): string {
    // Logs stored in /logs/YYYY-MM-DD-LEVEL.log
    return path.join(this.logDir, `${dateStr}-${logLevel}.log`)
  }

  private _getTodaysDate(date = new Date()): string {
    return date.toISOString().split('T')[0]
  }

  private _ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private _getRetention(level: string): number {
    return this._LOG_RETENTION_DAYS[level as LogLevel] ?? -1
  }

  private _cleanOldLogs(): void {
    fs.readdir(this.logDir, (err, files) => {
      if (err) {
        this.error(`Error reading log directory: ${err}`)
        return
      }

      const now = Date.now()

      files.forEach((file) => {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})-([a-z]+)\.log$/i)
        if (!match) return

        const [, dateStr, level] = match
        const retentionDays = this._getRetention(level)
        if (retentionDays === -1) return

        const fileDate = new Date(dateStr).getTime()
        const ageMs = now - fileDate
        const retentionMs = retentionDays * 24 * 60 * 60 * 1000

        if (ageMs > retentionMs) {
          const fullPath = path.join(this.logDir, file)
          fs.unlink(fullPath, (unlinkErr) => {
            if (unlinkErr) this.error(`Failed to delete ${file}: ${unlinkErr}`)
            else this._debug(`Deleted old log: ${file}`)
          })
        }
      })
    })
  }

  private _shutdown(signal: string): void {
    console.log(`Received ${signal}, closing log streams...`)
    for (const level in this.logStreams) {
      this.logStreams[level as LogLevel]?.end()
    }
    setTimeout(() => {
      console.log('Log streams closed. Exiting process.')
      process.exit(0)
    }, 500)
  }
}

const logger = new Logger()
export { logger, Logger }
