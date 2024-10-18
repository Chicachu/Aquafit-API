import mongoose from 'mongoose'

const dbLocation = process.env.MONOGO_URI!

class DBConnector {
  constructor() { }

  async connect() {
    try {
      const conn = await mongoose.connect(dbLocation)
      console.log(`Mongo DB connected: ${conn.connection.host}`)
    } catch (error) {
      console.log(error)
      process.exit(1)
    }
  }
}

export default DBConnector