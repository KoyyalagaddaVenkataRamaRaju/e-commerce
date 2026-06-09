import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { orderConfirmationTemplate, orderReceiptTemplate, sendMail } from '../services/mailService.js'

const DELIVERY_FEE = 750
const FREE_DELIVERY_MINIMUM = 50000
const TAX_RATE = 0.18

function createError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = subtotal > FREE_DELIVERY_MINIMUM || subtotal === 0 ? 0 : DELIVERY_FEE
  const tax = Math.round(subtotal * TAX_RATE)
  return {
    subtotal,
    tax,
    deliveryFee,
    total: subtotal + tax + deliveryFee,
  }
}

function normalizeAddress(address = {}, fallbackUser) {
  return {
    fullName: address.fullName?.trim() || fallbackUser.name,
    phone: address.phone?.trim() || fallbackUser.phone,
    email: address.email?.trim().toLowerCase() || fallbackUser.email,
    line1: address.line1?.trim(),
    city: address.city?.trim(),
    state: address.state?.trim(),
    pincode: address.pincode?.trim(),
  }
}

function validateAddress(address) {
  const missing = ['fullName', 'phone', 'email', 'line1', 'city', 'state', 'pincode'].filter((key) => !address[key])
  if (missing.length > 0) {
    throw createError(`Missing address fields: ${missing.join(', ')}`)
  }
}

function buildAddressKey(address) {
  return [address.fullName, address.phone, address.email, address.line1, address.city, address.state, address.pincode]
    .map((part) => String(part || '').trim().toLowerCase())
    .join('|')
}

async function saveAddressIfRequested(userId, address, shouldSave, makeDefault) {
  if (!shouldSave) return

  const user = await User.findById(userId)
  if (!user) return

  const nextKey = buildAddressKey(address)
  const existing = user.savedAddresses.find((saved) => buildAddressKey(saved) === nextKey)
  const shouldDefault = makeDefault || user.savedAddresses.length === 0

  if (shouldDefault) {
    user.savedAddresses.forEach((saved) => {
      saved.isDefault = false
    })
  }

  if (existing) {
    existing.isDefault = shouldDefault || existing.isDefault
  } else {
    user.savedAddresses.unshift({ ...address, isDefault: shouldDefault })
    user.savedAddresses = user.savedAddresses.slice(0, 5)
  }

  await user.save()
}

async function buildOrderItems(cartItems = []) {
  if (!cartItems.length) {
    throw createError('Cart is empty')
  }

  const requested = cartItems.map((item) => ({
    productId: item.product || item.productId || item.id,
    quantity: Number(item.quantity),
  }))

  if (requested.some((item) => !mongoose.Types.ObjectId.isValid(item.productId) || item.quantity < 1)) {
    throw createError('Invalid cart items')
  }

  const products = await Product.find({ _id: { $in: requested.map((item) => item.productId) } })
  const productMap = new Map(products.map((product) => [String(product._id), product]))

  return requested.map((item) => {
    const product = productMap.get(String(item.productId))
    if (!product) {
      throw createError('A product in your cart no longer exists')
    }
    if (product.stock < item.quantity) {
      throw createError(`${product.name} has only ${product.stock} units in stock`)
    }

    return {
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      unit: product.unit,
      image: product.images?.[0],
    }
  })
}

async function reduceStock(items) {
  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } },
      },
    })),
  )
}

async function restoreStock(items) {
  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    })),
  )
}

export const createOrder = asyncHandler(async (req, res) => {
  const orderItems = await buildOrderItems(req.body.items)
  const shippingAddress = normalizeAddress(req.body.shippingAddress, req.user)
  validateAddress(shippingAddress)

  const paymentMethod = req.body.paymentMethod === 'razorpay' ? 'razorpay' : 'cod'
  const totals = calculateTotals(orderItems)

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    ...totals,
    status: paymentMethod === 'razorpay' ? 'pending' : 'placed',
    payment: {
      provider: paymentMethod,
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    },
  })

  await reduceStock(orderItems)
  await saveAddressIfRequested(req.user._id, shippingAddress, req.body.saveAddress, req.body.makeDefaultAddress)

  sendMail({
    to: shippingAddress.email,
    subject: 'Varma Hardware order received',
    html: orderConfirmationTemplate(order),
  }).catch((error) => console.error('Order email failed:', error.message))

  res.status(201).json(order)
})

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(orders)
})

export const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().populate('user', 'name email phone').sort({ createdAt: -1 })
  res.json(orders)
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    throw createError('Order not found', 404)
  }

  const nextStatus = req.body.status
  const allowedStatuses = ['placed', 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']
  if (!allowedStatuses.includes(nextStatus)) {
    throw createError('Invalid order status')
  }

  const wasCancelled = order.status === 'cancelled'
  const willCancel = nextStatus === 'cancelled'
  const wasDelivered = order.status === 'delivered'
  const willDeliver = nextStatus === 'delivered'
  if (wasCancelled && !willCancel) {
    throw createError('Cancelled orders cannot be reopened')
  }

  order.status = nextStatus
  if (nextStatus === 'paid' || (nextStatus === 'delivered' && order.payment.method === 'cod')) {
    order.payment.status = 'paid'
    order.payment.paidAt = order.payment.paidAt || new Date()
  }

  await order.save()

  if (!wasCancelled && willCancel) {
    await restoreStock(order.items)
  }

  await order.populate('user', 'name email phone')
  if (!wasDelivered && willDeliver) {
    sendMail({
      to: order.shippingAddress?.email || order.user?.email,
      subject: `Varma Hardware bill receipt for order #${String(order._id).slice(-8).toUpperCase()}`,
      html: orderReceiptTemplate(order),
    }).catch((error) => console.error('Order receipt email failed:', error.message))
  }

  res.json(order)
})
