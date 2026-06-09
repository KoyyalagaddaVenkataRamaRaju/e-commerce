import crypto from 'crypto'
import { getRazorpayClient } from '../config/razorpay.js'
import Order from '../models/Order.js'
import asyncHandler from '../utils/asyncHandler.js'
import { env } from '../config/env.js'

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body
  const order = await Order.findById(orderId)
  if (!order) {
    const error = new Error('Order not found')
    error.statusCode = 404
    throw error
  }

  if (order.payment?.method !== 'razorpay') {
    const error = new Error('This order is not a Razorpay order')
    error.statusCode = 400
    throw error
  }

  const razorpay = getRazorpayClient()
  const paymentOrder = await razorpay.orders.create({
    amount: Math.round(order.total * 100),
    currency: 'INR',
    receipt: String(order._id),
  })

  order.payment.orderId = paymentOrder.id
  await order.save()

  res.json({
    key: env.razorpayKeyId,
    razorpayOrderId: paymentOrder.id,
    amount: paymentOrder.amount,
    currency: paymentOrder.currency,
  })
})

export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    const error = new Error('Payment verification failed')
    error.statusCode = 400
    throw error
  }

  const order = await Order.findById(orderId)
  order.status = 'paid'
  order.payment.provider = 'razorpay'
  order.payment.method = 'razorpay'
  order.payment.status = 'paid'
  order.payment.paymentId = razorpay_payment_id
  order.payment.signature = razorpay_signature
  order.payment.paidAt = new Date()
  await order.save()

  res.json({ success: true, order })
})
