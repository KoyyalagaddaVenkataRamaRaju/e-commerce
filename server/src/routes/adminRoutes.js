import express from 'express'
import { getDashboard, getUsers } from '../controllers/adminController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/dashboard', protect, adminOnly, getDashboard)
router.get('/users', protect, adminOnly, getUsers)

export default router
