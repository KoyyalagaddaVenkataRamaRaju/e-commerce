import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, CreditCard, MapPin, Package, Star, Truck } from 'lucide-react'
import Pagination from '../components/Pagination'
import api from '../services/api'

const deliverySteps = ['placed', 'paid', 'packed', 'shipped', 'delivered']
const PAGE_SIZE = 5

function formatMoney(value = 0) {
  return `Rs. ${value.toLocaleString('en-IN')}`
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getProgressStatus(order) {
  if (order.status === 'cancelled') return 'cancelled'
  if (order.payment?.method === 'cod' && order.status === 'placed') return 'placed'
  return order.status === 'pending' ? 'placed' : order.status
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/orders/mine'), api.get('/reviews/mine')])
      .then(([ordersResponse, reviewsResponse]) => {
        setOrders(ordersResponse.data)
        setReviews(reviewsResponse.data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const reviewedKeys = useMemo(
    () => new Set(reviews.map((review) => `${review.order}-${review.product}`)),
    [reviews],
  )

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders
    return orders.filter((order) => order.status === activeFilter)
  }, [activeFilter, orders])

  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOrders, page],
  )

  const filters = useMemo(() => {
    const statuses = Array.from(new Set(orders.map((order) => order.status))).filter(Boolean)
    return ['all', ...statuses]
  }, [orders])

  return (
    <section className="orders-page page-section">
      <div className="section-heading">
        <span className="eyebrow">Order history</span>
        <h1>Track your orders</h1>
      </div>

      {message && <p className="form-note">{message}</p>}
      {error && <p className="form-error">{error}</p>}
      {status === 'loading' && <div className="empty-state">Loading your orders...</div>}
      {status === 'error' && <div className="empty-state">Could not load orders.</div>}
      {status === 'ready' && orders.length === 0 && (
        <div className="empty-state">
          <p>No orders yet.</p>
          <Link to="/shop" className="button">Browse products</Link>
        </div>
      )}

      {orders.length > 0 && (
        <>
          <div className="filter-bar">
            {filters.map((filter) => (
              <button
                className={activeFilter === filter ? 'active' : ''}
                key={filter}
                onClick={() => {
                  setActiveFilter(filter)
                  setPage(1)
                }}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="orders-stack">
            {pagedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                reviewedKeys={reviewedKeys}
                onReview={(review) => setReviews((current) => [review, ...current])}
              />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filteredOrders.length} onPageChange={setPage} />
        </>
      )}
    </section>
  )
}

function OrderCard({ order, reviewedKeys, onReview }) {
  const progressStatus = getProgressStatus(order)
  const currentStep = deliverySteps.indexOf(progressStatus)
  const isCancelled = order.status === 'cancelled'

  return (
    <article className="order-track-card">
      <div className="order-track-head">
        <div>
          <strong>#{order._id.slice(-8).toUpperCase()}</strong>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <span className={`status-pill ${order.status}`}>{order.status}</span>
      </div>

      <div className="order-track-meta">
        <div>
          <CreditCard size={17} />
          <span>{(order.payment?.method || 'cod').toUpperCase()} - {order.payment?.status || 'pending'}</span>
        </div>
        <div>
          <Truck size={17} />
          <span>{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
        </div>
        <strong>{formatMoney(order.total)}</strong>
      </div>

      <div className={`delivery-timeline ${isCancelled ? 'cancelled' : ''}`}>
        {deliverySteps.map((step, index) => {
          const completed = !isCancelled && index <= currentStep
          const active = !isCancelled && index === currentStep
          return (
            <div className={`timeline-step ${completed ? 'complete' : ''} ${active ? 'active' : ''}`} key={step}>
              <span>{completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}</span>
              <strong>{step}</strong>
            </div>
          )
        })}
      </div>

      {isCancelled && <p className="form-error">This order was cancelled. Stock has been returned to the store.</p>}

      <div className="order-track-body">
        <div className="order-products">
          {order.items.map((item) => (
            <OrderProduct
              isDelivered={order.status === 'delivered'}
              item={item}
              key={`${order._id}-${item.product}`}
              onReview={onReview}
              orderId={order._id}
              reviewed={reviewedKeys.has(`${order._id}-${item.product}`)}
            />
          ))}
        </div>

        <div className="order-address">
          <h2><MapPin size={18} /> Delivery address</h2>
          <p>{order.shippingAddress?.fullName}</p>
          <span>{order.shippingAddress?.line1}</span>
          <span>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</span>
          <span>{order.shippingAddress?.phone}</span>
        </div>
      </div>
    </article>
  )
}

function OrderProduct({ isDelivered, item, onReview, orderId, reviewed }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })
  const [error, setError] = useState('')

  async function submitReview(event) {
    event.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/reviews', {
        productId: item.product,
        orderId,
        ...form,
      })
      onReview(data)
      setOpen(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review.')
    }
  }

  return (
    <div className="order-product-line reviewable-line">
      {item.image ? <img src={item.image} alt={item.name} /> : <Package size={22} />}
      <div>
        <strong>{item.name}</strong>
        <span>{item.quantity} x {formatMoney(item.price)} / {item.unit}</span>
        {isDelivered && !reviewed && (
          <button className="text-button" onClick={() => setOpen((current) => !current)} type="button">
            <Star size={15} /> Write review
          </button>
        )}
        {reviewed && <span className="verified-badge">reviewed</span>}
        {open && (
          <form className="review-form" onSubmit={submitReview}>
            {error && <p className="form-error">{error}</p>}
            <select value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Review title" />
            <textarea value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Your review" required />
            <button className="button compact" type="submit">Submit review</button>
          </form>
        )}
      </div>
    </div>
  )
}
