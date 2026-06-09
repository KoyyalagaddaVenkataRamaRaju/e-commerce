import Otp from '../models/Otp.js'
import asyncHandler from '../utils/asyncHandler.js'
import { sendOtpEmail } from '../services/mailService.js'

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function createError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export const sendOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase()
  const purpose = req.body.purpose || 'verify-email'
  const code = generateOtp()

  if (!email) {
    throw createError('Email is required')
  }

  const otp = await Otp.create({
    channel: 'email',
    email,
    code,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  try {
    await sendOtpEmail(email, code, purpose)
  } catch (error) {
    await Otp.findByIdAndDelete(otp._id)
    throw error
  }

  res.status(201).json({ message: 'OTP sent to email' })
})

export const verifyOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase()
  const { code } = req.body
  const purpose = req.body.purpose || 'verify-email'

  if (!email || !code) {
    throw createError('Email and OTP code are required')
  }

  const otp = await Otp.findOne({
    channel: 'email',
    email,
    code,
    purpose,
    verifiedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })

  if (!otp) {
    throw createError('Invalid or expired OTP')
  }

  otp.verifiedAt = new Date()
  await otp.save()
  res.json({ verified: true })
})
