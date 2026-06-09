import express from 'express'
import {
  createTestimonial,
  getAllTestimonials,
  getApprovedTestimonials,
  getMyTestimonials,
  updateMyTestimonial,
  updateTestimonialStatus,
} from '../controllers/testimonialController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getApprovedTestimonials)
router.post('/', protect, createTestimonial)
router.get('/mine', protect, getMyTestimonials)
router.patch('/mine', protect, updateMyTestimonial)
router.get('/admin', protect, adminOnly, getAllTestimonials)
router.patch('/:id/status', protect, adminOnly, updateTestimonialStatus)

export default router
