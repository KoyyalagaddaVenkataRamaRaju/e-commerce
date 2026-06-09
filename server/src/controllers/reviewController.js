import Order from '../models/Order.js'
import Review from '../models/Review.js'
import asyncHandler from '../utils/asyncHandler.js'

function createError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, title, comment } = req.body
  if (!productId || !orderId || !rating || !comment) {
    throw createError('Product, order, rating, and comment are required')
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id })
  if (!order) {
    throw createError('Order not found', 404)
  }
  if (order.status !== 'delivered') {
    throw createError('Reviews can be added after delivery')
  }
  if (!order.items.some((item) => String(item.product) === String(productId))) {
    throw createError('This product was not in the selected order')
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: orderId,
    rating: Number(rating),
    title,
    comment,
  })

  res.status(201).json(review)
})

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
  res.json(reviews)
})

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(reviews)
})
