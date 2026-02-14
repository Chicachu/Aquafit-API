import app from './app'
import DBConnector from './config/db'
import { CronSchedulerService } from './src/services/CronScheduler'

const port = parseInt(process.env.PORT ?? '8000', 10)
const host = process.env.NODE_ENV === 'production' || process.env.PORT ? '0.0.0.0' : 'localhost'

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`)
})

const main = async () => {
  await new DBConnector().connect()

  await CronSchedulerService.startAllJobs().catch((error) => {
    console.error('Error starting cron jobs:', error)
  })
}

main()

