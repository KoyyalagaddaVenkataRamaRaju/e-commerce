import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

function requireJwtSecret() {
  if (env.jwtSecret) return env.jwtSecret

  const error = new Error('JWT_SECRET is missing')
  error.statusCode = 500
  error.code = 'JWT_SECRET_MISSING'
  error.publicMessage = 'Server authentication is not configured'
  throw error
}

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, requireJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token) {
  return jwt.verify(token, requireJwtSecret())
}
