import app from './app'
import DBConnector from './config/db'

const main = async () => {
  await new DBConnector().connect()

  const port = process.env.PORT

  app.listen(port, () => {
    console.log(`Server started on port ${port}`)
  })
}

main()

