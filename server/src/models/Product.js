import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, required: true },
    brand: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    description: { type: String, required: true },
    features: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0, default: 0 },
    discountPercent: { type: Number, min: 0, max: 95, default: 0 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    images: {
      type: [{ type: String }],
      default: [],
      required: true,
      validate: {
        validator: (images) => Array.isArray(images) && images.length > 0,
        message: 'At least one Cloudinary image is required',
      },
    },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model('Product', productSchema)
