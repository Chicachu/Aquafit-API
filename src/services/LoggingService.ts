import fs, { WriteStream } from 'fs'
import path from 'path'
import { LogLevel } from '../types/enums/LogLevel'

class Logger {
  private readonly _LOG_DIR = path.join(__dirname, 'logs')
  private readonly _LOG_RETENTION_DAYS: Record<LogLevel, number> = {
    debug: 7,
    info: 14, 
    warn: 14, 
    error: 30,
    access: 90
  }
  logStreams: Record<LogLevel, WriteStream> = {} as any
  currentDate: string | null = null

  constructor() {
    this._ensureLogDirectoryExists()
    this._openLogStreams()
    this._cleanOldLogs()

    setInterval(() => this._cleanOldLogs(), 24 * 60 * 60 * 1000)

    process.on('SIGINT', () => this._shutdown('SIGINT'))
    process.on('SIGTERM', () => this._shutdown('SIGTERM'))
  }

  public debug(message: string): void {
    this._writeLog(LogLevel.DEBUG, message)
  }

  public info(message: string): void {
    this._writeLog(LogLevel.INFO, message)
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

  private _writeLog(logLevel: LogLevel, message: string): void {
    const now = new Date()
    const dateStr = this._getTodaysDate(now)


    if (dateStr !== this.currentDate) {
      this._rotateLogStreams(dateStr)
    }

    const timestamp = now.toISOString()
    const logEntry = `[${timestamp}]: ${message}\n`
    this.logStreams[logLevel].write(logEntry)
    console.log(logEntry)
  }

  private _openLogStreams(): void {
      const dateStr = this._getTodaysDate() 

      for (const level of Object.values(LogLevel) as LogLevel[]) {
        const filePath = this._getLogFilePath(dateStr, level as LogLevel)
        this.logStreams[level] = fs.createWriteStream(filePath, {flags: 'a'})

        this.logStreams[level].on('error', (err) => {
          console.error(`Error writing to ${level} log:`, err)
        })
      }
      this.currentDate = dateStr
  }

  private _rotateLogStreams(date: string): void {
    for (const level in this.logStreams) {
      this.logStreams[level as LogLevel].end()
    }

    this.logStreams = {} as any
    this.currentDate = date
    this._openLogStreams()
  }

  private _getLogFilePath(dateStr: string, logLevel: LogLevel): string {
    return path.join(this._LOG_DIR, `${dateStr}-${logLevel}.log`)
  }

  private _getTodaysDate(date = new Date()): string {
    return date.toISOString().split("T")[0]
  }

  private _ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this._LOG_DIR)) {
      fs.mkdirSync(this._LOG_DIR, { recursive: true })
    }
  }

  private _getRetention(level: string): number {
    if (level in this._LOG_RETENTION_DAYS) return this._LOG_RETENTION_DAYS[level as LogLevel]
    return -1
  }

  private _cleanOldLogs(): void {
    fs.readdir(this._LOG_DIR, (err, files) => {
      if (err) {
        this.error(`Error reading log directory: ${err}`)
        return
      } 

      const now = new Date()

      files.forEach((file) => {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})-([a-z]+)\.log$/i)
        if (!match) return 

        const [ , dateStr, level ] = match 
        const retentionDays = this._getRetention(level)

        if (retentionDays == -1) return  

        const fileDate = new Date(dateStr)
        const ageInMs = now.getTime() - fileDate.getTime()
        const cutOffInMs = retentionDays * 24 * 60 * 60 * 1000

        if (ageInMs > cutOffInMs) {
          const fullPath = path.join(this._LOG_DIR, file)

          fs.unlink(fullPath, (err) => {
            if (err) this.error(`Failed to delete ${file}: ${err}`)
            else this.debug(`Deleted old log: ${file}`)
          })
        }
      })
    })
  }

  private _shutdown(signal: string): void {
    console.log(`Received ${signal}, closing log streams...`)
    for (const level in this.logStreams) {
      this.logStreams[level as LogLevel].end()
    }
    
    setTimeout(() => {
      console.log('Log streams closed. Exiting process.')
      process.exit(0)
    }, 500)
  }
}

const logger = new Logger()
export { logger, Logger }