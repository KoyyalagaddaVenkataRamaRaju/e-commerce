import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    company: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatarUrl: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    cardColor: { type: String, trim: true, default: '#f59e0b' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true },
)

export default mongoose.model('Testimonial', testimonialSchema)
