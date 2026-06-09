import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Testimonial from '../models/Testimonial.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

const activeOrderFilter = { status: { $ne: 'cancelled' } }

export const getDashboard = asyncHandler(async (_req, res) => {
  const [
    orders,
    customersCount,
    products,
    recentOrders,
    recentOrderUpdates,
    pendingTestimonials,
    recentPendingTestimonials,
  ] = await Promise.all([
    Order.find(activeOrderFilter).select('total status payment createdAt items'),
    User.countDocuments({ role: 'customer' }),
    Product.find().select('name category stock price images updatedAt').sort({ stock: 1 }),
    Order.find().populate('user', 'name email phone').sort({ createdAt: -1 }).limit(8),
    Order.find({ status: { $nin: ['delivered'] } }).populate('user', 'name email phone').sort({ updatedAt: -1 }).limit(8),
    Testimonial.countDocuments({ status: 'pending' }),
    Testimonial.find({ status: 'pending' }).populate('user', 'name email phone').sort({ updatedAt: -1 }).limit(5),
  ])

  const revenue = orders.reduce((sum, order) => sum + order.total, 0)
  const unitsSold = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )
  const stockUnits = products.reduce((sum, product) => sum + product.stock, 0)
  const allLowStockProducts = products.filter((product) => product.stock <= 5)
  const lowStockProducts = allLowStockProducts.slice(0, 8)
  const statusCounts = orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1
    return counts
  }, {})
  const deliveryStatuses = ['placed', 'pending', 'paid', 'packed', 'shipped']
  const ordersToDeliver = orders.filter((order) => deliveryStatuses.includes(order.status))
  const itemsToDeliver = ordersToDeliver.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )
  const revenueByDay = orders.reduce((map, order) => {
    const key = order.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) || 0) + order.total)
    return map
  }, new Map())
  const revenueTrend = Array.from(revenueByDay.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, value]) => ({ date, value }))
  const topProductsMap = orders.reduce((map, order) => {
    order.items.forEach((item) => {
      const key = String(item.product)
      const current = map.get(key) || { product: key, name: item.name, quantity: 0, revenue: 0 }
      current.quantity += item.quantity
      current.revenue += item.quantity * item.price
      map.set(key, current)
    })
    return map
  }, new Map())
  const topProducts = Array.from(topProductsMap.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 6)
  const notifications = [
    ...recentPendingTestimonials.map((testimonial) => ({
      id: `testimonial-${testimonial._id}`,
      type: 'testimonial',
      title: 'Testimonial waiting for approval',
      message: `${testimonial.name} submitted or edited a store testimonial.`,
      level: 'warning',
      href: '/admin/testimonials',
      time: testimonial.updatedAt,
    })),
    ...recentOrderUpdates
      .slice(0, 4)
      .map((order) => ({
        id: `order-${order._id}-${order.status}-${new Date(order.updatedAt).getTime()}`,
        type: 'order',
        title: `Order #${String(order._id).slice(-8).toUpperCase()} is ${formatStatus(order.status)}`,
        message: `${order.user?.name || order.shippingAddress?.fullName || 'Customer'} has ${formatOrderItems(order.items)} in ${formatStatus(order.status)} status.`,
        level: order.status === 'cancelled' ? 'danger' : 'info',
        href: '/admin/orders',
        time: order.updatedAt,
      })),
    ...allLowStockProducts.slice(0, 5).map((product) => ({
      id: `stock-${product._id}`,
      type: product.stock <= 0 ? 'out-stock' : 'low-stock',
      title: product.stock <= 0 ? 'Out of stock' : 'Low stock alert',
      message: `${product.name} has ${product.stock} unit${product.stock === 1 ? '' : 's'} remaining.`,
      level: product.stock <= 0 ? 'danger' : 'warning',
      href: '/admin/products/manage',
      time: product.updatedAt,
    })),
  ]
    .sort((left, right) => new Date(right.time) - new Date(left.time))
    .slice(0, 10)

  res.json({
    metrics: {
      revenue,
      orders: orders.length,
      customers: customersCount,
      products: products.length,
      stockUnits,
      lowStock: allLowStockProducts.length,
      unitsSold,
      ordersToDeliver: ordersToDeliver.length,
      itemsToDeliver,
      pendingTestimonials,
      codOrders: orders.filter((order) => order.payment?.method === 'cod').length,
      razorpayOrders: orders.filter((order) => order.payment?.method === 'razorpay').length,
    },
    recentOrders,
    lowStockProducts,
    statusCounts,
    revenueTrend,
    topProducts,
    notifications,
  })
})

function formatOrderItems(items = []) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return `${count} item${count === 1 ? '' : 's'}`
}

function formatStatus(status = '') {
  return status.replaceAll('-', ' ')
}

export const getUsers = asyncHandler(async (_req, res) => {
  const [users, orders] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }),
    Order.find().select('user total status createdAt shippingAddress payment').sort({ createdAt: -1 }),
  ])

  const ordersByUser = orders.reduce((map, order) => {
    const id = String(order.user)
    if (!map.has(id)) {
      map.set(id, [])
    }
    map.get(id).push(order)
    return map
  }, new Map())

  res.json(
    users.map((user) => {
      const userOrders = ordersByUser.get(String(user._id)) || []
      return {
        ...user.toObject(),
        orderCount: userOrders.length,
        totalSpent: userOrders
          .filter((order) => order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.total, 0),
        lastOrder: userOrders[0] || null,
      }
    }),
  )
})
