import Razorpay from 'razorpay'
import { env } from './env.js'

export function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error('Razorpay credentials are missing')
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  })
}
