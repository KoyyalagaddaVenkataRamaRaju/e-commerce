import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true, index: true },
    channel: { type: String, enum: ['email'], default: 'email', required: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['login', 'checkout', 'verify-email', 'reset-password'],
      default: 'verify-email',
    },
    expiresAt: { type: Date, required: true },
    verifiedAt: Date,
  },
  { timestamps: true },
)

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

otpSchema.pre('validate', function requireDestination(next) {
  if (!this.email) {
    const error = new Error('Email is required for OTP')
    error.statusCode = 400
    return next(error)
  }
  next()
})

export default mongoose.model('Otp', otpSchema)
