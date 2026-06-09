import Testimonial from '../models/Testimonial.js'
import asyncHandler from '../utils/asyncHandler.js'

const cardColors = [
  '#8a5a36',
  '#2f4f3f',
  '#4c1d26',
  '#243447',
  '#fffaf0',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#f97316',
  '#a855f7',
  '#e11d48',
  '#84cc16',
  '#0f172a',
  '#ffffff',
]

function createError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export const createTestimonial = asyncHandler(async (req, res) => {
  const {
    avatarUrl = '',
    cardColor = cardColors[0],
    company = '',
    message,
    rating = 5,
    role = 'Customer',
    videoUrl = '',
  } = req.body
  const cleanMessage = message?.trim()
  if (!cleanMessage) {
    throw createError('Testimonial message is required')
  }

  const existing = await Testimonial.findOne({ user: req.user._id })
  if (existing) {
    throw createError('You already have a testimonial. Please edit your existing testimonial instead.', 409)
  }

  const testimonial = await Testimonial.create({
    user: req.user._id,
    name: req.user.name,
    role: role?.trim() || 'Customer',
    company: company?.trim() || '',
    message: cleanMessage,
    rating: Number(rating),
    avatarUrl: avatarUrl?.trim() || '',
    videoUrl: videoUrl?.trim() || '',
    cardColor: cardColors.includes(cardColor) ? cardColor : cardColors[0],
  })

  res.status(201).json(testimonial)
})

export const updateMyTestimonial = asyncHandler(async (req, res) => {
  const {
    avatarUrl = '',
    cardColor = cardColors[0],
    company = '',
    message,
    rating = 5,
    role = 'Customer',
    videoUrl = '',
  } = req.body
  const cleanMessage = message?.trim()
  if (!cleanMessage) {
    throw createError('Testimonial message is required')
  }

  const testimonial = await Testimonial.findOneAndUpdate(
    { user: req.user._id },
    {
      name: req.user.name,
      role: role?.trim() || 'Customer',
      company: company?.trim() || '',
      message: cleanMessage,
      rating: Number(rating),
      avatarUrl: avatarUrl?.trim() || '',
      videoUrl: videoUrl?.trim() || '',
      cardColor: cardColors.includes(cardColor) ? cardColor : cardColors[0],
      status: 'pending',
    },
    { new: true, runValidators: true },
  )

  if (!testimonial) {
    throw createError('Create a testimonial before editing it.', 404)
  }

  res.json(testimonial)
})

export const getApprovedTestimonials = asyncHandler(async (_req, res) => {
  const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(18)
  res.json(testimonials)
})

export const getMyTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(testimonials)
})

export const getAllTestimonials = asyncHandler(async (_req, res) => {
  const testimonials = await Testimonial.find().populate('user', 'name email phone').sort({ createdAt: -1 })
  res.json(testimonials)
})

export const updateTestimonialStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw createError('Invalid testimonial status')
  }

  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!testimonial) {
    throw createError('Testimonial not found', 404)
  }
  res.json(testimonial)
})
