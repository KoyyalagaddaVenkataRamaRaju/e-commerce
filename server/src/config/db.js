import mongoose from 'mongoose'
import { env } from './env.js'

export default async function connectDB() {
  const uri = env.mongoUri
  if (!uri) {
    throw new Error('MONGO_URI is missing')
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
