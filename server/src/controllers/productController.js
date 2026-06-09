import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getProducts = asyncHandler(async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {}
  const products = await Product.find(filter).sort({ createdAt: -1 })
  res.json(products)
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
  if (!product) {
    const error = new Error('Product not found')
    error.statusCode = 404
    throw error
  }
  res.json(product)
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body)
  res.status(201).json(product)
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  res.json(product)
})

export const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id)
  res.status(204).end()
})
