import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    image: String,
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      email: String,
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['placed', 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    payment: {
      provider: { type: String, enum: ['cod', 'razorpay'], default: 'cod' },
      method: { type: String, enum: ['cod', 'razorpay'], default: 'cod' },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      orderId: String,
      paymentId: String,
      signature: String,
      paidAt: Date,
    },
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
