import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { verifyToken } from '../utils/token.js'

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies.token

  if (!token) {
    const error = new Error('Not authorized')
    error.statusCode = 401
    throw error
  }

  const decoded = verifyToken(token)
  req.user = await User.findById(decoded.id).select('-password')
  next()
})

export function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') {
    const error = new Error('Admin access required')
    error.statusCode = 403
    return next(error)
  }
  next()
}
