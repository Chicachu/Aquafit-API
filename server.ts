import app from './app'
import DBConnector from './config/db'
import { CronSchedulerService } from './src/services/CronScheduler'

const main = async () => {
  await new DBConnector().connect()

  // Start cron jobs only after DB is connected so payables/invoices/enrollments run against a live connection
  await CronSchedulerService.startAllJobs().catch((error) => {
    console.error('Error starting cron jobs:', error)
  })

  const port = process.env.PORT ?? '8000'

  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}

main()

