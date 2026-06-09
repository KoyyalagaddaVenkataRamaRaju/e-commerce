import User from '../models/User.js'
import { env } from '../config/env.js'

export default async function ensureAdmin() {
  const existingAdmin = await User.findOne({ role: 'admin' })
  if (existingAdmin) return

  await User.create({
    email: env.adminEmail,
    isEmailVerified: true,
    isPhoneVerified: true,
    name: env.adminName,
    password: env.adminPassword,
    phone: env.adminPhone,
    role: 'admin',
  })

  console.log(`Admin login ready: ${env.adminEmail}`)
}
