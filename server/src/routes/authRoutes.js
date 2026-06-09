import express from 'express'
import {
  forgotPassword,
  login,
  me,
  register,
  requestRegistrationOtp,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register/request-otp', requestRegistrationOtp)
router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', protect, me)

export default router
