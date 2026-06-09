import express from 'express'
import { createReview, getMyReviews, getProductReviews } from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/mine', protect, getMyReviews)
router.get('/product/:productId', getProductReviews)
router.post('/', protect, createReview)

export default router
