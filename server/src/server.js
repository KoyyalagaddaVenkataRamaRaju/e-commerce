import 'dotenv/config'
import app from './app.js'
import connectDB from './config/db.js'
import { env } from './config/env.js'
import Otp from './models/Otp.js'
import ensureAdmin from './utils/ensureAdmin.js'

connectDB()
  .then(async () => {
    await Otp.createIndexes()
    await ensureAdmin()
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
