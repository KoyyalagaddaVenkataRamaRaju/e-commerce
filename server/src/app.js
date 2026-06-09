import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import otpRoutes from './routes/otpRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import productRoutes from './routes/productRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import testimonialRoutes from './routes/testimonialRoutes.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import { env } from './config/env.js'

const app = express()

app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hardware-commerce-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/otp', otpRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/testimonials', testimonialRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
