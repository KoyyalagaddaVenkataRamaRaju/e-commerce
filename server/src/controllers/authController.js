import asyncHandler from '../utils/asyncHandler.js'
import { signToken } from '../utils/token.js'
import User from '../models/User.js'
import Otp from '../models/Otp.js'
import { sendOtpEmail } from '../services/mailService.js'

function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    savedAddresses: user.savedAddresses || [],
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizedEmail(email) {
  return email?.trim().toLowerCase()
}

function createError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

async function ensureUniqueUser({ email, phone }) {
  const existing = await User.findOne({ $or: [{ email }, { phone }] })
  if (!existing) return

  if (existing.email === email) {
    throw createError('Email already registered', 409)
  }
  throw createError('Phone number already registered', 409)
}

async function createOtp({ email, purpose }) {
  const code = generateOtp()
  const otp = await Otp.create({
    channel: 'email',
    code,
    email,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  try {
    await sendOtpEmail(email, code, purpose)
  } catch (error) {
    await Otp.findByIdAndDelete(otp._id)
    throw error
  }

  return otp
}

async function getValidOtp({ channel, code, email, phone, purpose }) {
  const query = {
    channel,
    code,
    purpose,
    verifiedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }

  if (channel === 'email') query.email = email
  if (channel === 'phone') query.phone = phone

  const otp = await Otp.findOne(query).sort({ createdAt: -1 })
  if (!otp) throw createError('Invalid or expired OTP')
  return otp
}

async function markVerified(...otps) {
  await Promise.all(
    otps.map((otp) => {
      otp.verifiedAt = new Date()
      return otp.save()
    }),
  )
}

export const requestRegistrationOtp = asyncHandler(async (req, res) => {
  const email = normalizedEmail(req.body.email)
  const phone = req.body.phone?.trim()

  if (!email || !phone) {
    throw createError('Email and phone are required')
  }

  await ensureUniqueUser({ email, phone })
  await createOtp({ email, purpose: 'verify-email' })

  res.status(201).json({ message: 'Verification OTP sent to email' })
})

export const register = asyncHandler(async (req, res) => {
  const { name, password, emailCode } = req.body
  const email = normalizedEmail(req.body.email)
  const phone = req.body.phone?.trim()

  if (!name || !email || !phone || !password || !emailCode) {
    throw createError('Name, email, phone, password, and email OTP are required')
  }

  await ensureUniqueUser({ email, phone })

  const emailOtp = await getValidOtp({ channel: 'email', code: emailCode, email, purpose: 'verify-email' })

  const user = await User.create({
    name,
    email,
    phone,
    password,
    isEmailVerified: true,
    isPhoneVerified: false,
  })

  await markVerified(emailOtp)
  res.status(201).json({ user: userResponse(user), token: signToken(user) })
})

export const login = asyncHandler(async (req, res) => {
  const email = normalizedEmail(req.body.email)
  const { password } = req.body
  const user = await User.findOne({ email })

  if (!user || !(await user.matchPassword(password))) {
    throw createError('Invalid email or password', 401)
  }

  res.json({ user: userResponse(user), token: signToken(user) })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizedEmail(req.body.email)
  if (!email) throw createError('Email is required')

  const user = await User.findOne({ email })
  if (user) {
    await createOtp({ email, purpose: 'reset-password' })
  }

  res.status(201).json({ message: 'If the email exists, a password reset OTP has been sent' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizedEmail(req.body.email)
  const { code, password } = req.body

  if (!email || !code || !password) {
    throw createError('Email, OTP, and new password are required')
  }

  const user = await User.findOne({ email })
  if (!user) throw createError('Invalid or expired OTP')

  const otp = await getValidOtp({ channel: 'email', code, email, purpose: 'reset-password' })
  user.password = password
  await user.save()
  await markVerified(otp)

  res.json({ message: 'Password reset successfully' })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user })
})
