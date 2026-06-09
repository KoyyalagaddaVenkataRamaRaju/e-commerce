import { useEffect, useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import api from '../../services/api'

const statuses = ['placed', 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']
const PAGE_SIZE = 15

function formatMoney(value = 0) {
  return `Rs. ${value.toLocaleString('en-IN')}`
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [activeStatus, setActiveStatus] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loadingId, setLoadingId] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  function loadOrders() {
    api.get('/orders')
      .then(({ data }) => setOrders(data))
      .catch(() => setError('Could not load orders.'))
  }

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = activeStatus === 'all' || order.status === activeStatus
      const matchesPayment = paymentFilter === 'all' || order.payment?.method === paymentFilter || order.payment?.status === paymentFilter
      const matchesDate = !dateFilter || new Date(order.createdAt).toISOString().slice(0, 10) === dateFilter
      const searchable = [
        order._id,
        order.status,
        order.payment?.method,
        order.payment?.status,
        order.user?.name,
        order.user?.email,
        order.user?.phone,
        order.shippingAddress?.fullName,
        order.shippingAddress?.email,
        order.shippingAddress?.phone,
        order.shippingAddress?.city,
        order.shippingAddress?.state,
        ...order.items.map((item) => item.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesQuery = !search || searchable.includes(search)
      return matchesStatus && matchesPayment && matchesDate && matchesQuery
    })
  }, [activeStatus, dateFilter, orders, paymentFilter, query])

  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOrders, page],
  )

  async function updateStatus(orderId, status) {
    setLoadingId(orderId)
    setError('')
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status })
      setOrders((current) => current.map((order) => (order._id === orderId ? data : order)))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order.')
    } finally {
      setLoadingId('')
    }
  }

  function resetPage(action) {
    action()
    setPage(1)
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <span className="eyebrow">Fulfillment</span>
        <h1>Orders</h1>
      </div>
      {error && <p className="form-error">{error}</p>}

      <div className="admin-panel order-filter-panel">
        <label>
          Search contents
          <input value={query} onChange={(event) => resetPage(() => setQuery(event.target.value))} placeholder="Order, customer, phone, city, product" />
        </label>
        <label>
          Order date
          <input type="date" value={dateFilter} onChange={(event) => resetPage(() => setDateFilter(event.target.value))} />
        </label>
        <label>
          Payment method
          <select value={paymentFilter} onChange={(event) => resetPage(() => setPaymentFilter(event.target.value))}>
            <option value="all">All payments</option>
            <option value="cod">COD</option>
            <option value="razorpay">Razorpay</option>
            <option value="pending">Payment pending</option>
            <option value="paid">Payment paid</option>
          </select>
        </label>
        <button
          className="button ghost"
          onClick={() => {
            setQuery('')
            setDateFilter('')
            setPaymentFilter('all')
            setActiveStatus('all')
            setPage(1)
          }}
          type="button"
        >
          Clear filters
        </button>
      </div>

      <div className="filter-bar admin-filter">
        {['all', ...statuses].map((status) => (
          <button
            className={activeStatus === status ? 'active' : ''}
            key={status}
            onClick={() => resetPage(() => setActiveStatus(status))}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="admin-orders-list">
        {pagedOrders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
          return (
            <article className={`admin-order-card user-style-order-card ${order.status === 'delivered' ? 'delivered-order-card' : ''}`} key={order._id}>
              <div className="admin-order-head user-card-head">
                <div>
                  <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                  <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <span className={`status-pill ${order.status}`}>{order.status}</span>
              </div>

              <div className="user-contact">
                <span>{order.user?.name || order.shippingAddress?.fullName}</span>
                <span>{order.user?.email || order.shippingAddress?.email}</span>
                <span>{order.user?.phone || order.shippingAddress?.phone}</span>
              </div>

              <div className="user-stats">
                <div>
                  <span>Total</span>
                  <strong className={order.status === 'delivered' ? 'delivered-total' : ''}>{formatMoney(order.total)}</strong>
                </div>
                <div>
                  <span>Items</span>
                  <strong>{itemCount}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>{order.payment?.method?.toUpperCase()}</strong>
                </div>
              </div>

              <div className="user-detail-block">
                <h3>Delivery</h3>
                <p>{order.shippingAddress?.line1}</p>
                <span>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</span>
                {order.status === 'delivered' && (
                  <span className="bill-number">Bill No: VH-{order._id.slice(-8).toUpperCase()}</span>
                )}
              </div>

              <div className="user-detail-block">
                <h3>Order items</h3>
                <div className="order-items-mini">
                  {order.items.map((item) => (
                    <span key={`${order._id}-${item.product}`}>
                      {item.name} x {item.quantity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="order-actions">
                <label className="admin-status-select">
                  Update status
                  <select value={order.status} onChange={(event) => updateStatus(order._id, event.target.value)} disabled={loadingId === order._id}>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          )
        })}
        {filteredOrders.length === 0 && <div className="empty-state">No orders found.</div>}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredOrders.length} onPageChange={setPage} />
    </section>
  )
}
