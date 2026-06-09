import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, required: true, trim: true },
    status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' },
  },
  { timestamps: true },
)

reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true })

export default mongoose.model('Review', reviewSchema)
