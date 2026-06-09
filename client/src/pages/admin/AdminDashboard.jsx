import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, Boxes, IndianRupee, MessageSquareQuote, PackageSearch, ShoppingBag, Truck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

function formatMoney(value = 0) {
  return `Rs. ${value.toLocaleString('en-IN')}`
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [dismissedNotifications, setDismissedNotifications] = useState([])
  const [error, setError] = useState('')
  const [orderAlert, setOrderAlert] = useState(null)
  const previousOrderNotificationIds = useRef(null)

  useEffect(() => {
    let ignore = false

    function loadDashboard() {
      api.get('/admin/dashboard')
        .then(({ data }) => {
          if (!ignore) setDashboard(data)
        })
        .catch(() => {
          if (!ignore) setError('Could not load dashboard.')
        })
    }

    loadDashboard()
    const timer = window.setInterval(() => {
      if (!ignore) loadDashboard()
    }, 30000)

    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [])

  const visibleNotifications = dashboard?.notifications?.filter((notification) => !dismissedNotifications.includes(notification.id)) || []
  const orderNotifications = visibleNotifications.filter((notification) => notification.type === 'order')

  useEffect(() => {
    if (!dashboard) return
    const currentIds = orderNotifications.map((notification) => notification.id)
    if (previousOrderNotificationIds.current === null) {
      previousOrderNotificationIds.current = currentIds
      return
    }
    const newestOrderNotification = orderNotifications.find((notification) => !previousOrderNotificationIds.current.includes(notification.id))
    if (newestOrderNotification) {
      playNotificationSound()
      setOrderAlert(newestOrderNotification)
    }
    previousOrderNotificationIds.current = currentIds
  }, [dashboard, orderNotifications])

  if (error) return <section className="admin-page"><p className="form-error">{error}</p></section>
  if (!dashboard) return <section className="admin-page"><div className="empty-state">Loading dashboard...</div></section>

  const { metrics, recentOrders, lowStockProducts, revenueTrend, statusCounts, topProducts } = dashboard
  const stats = [
    { label: 'Revenue', value: formatMoney(metrics.revenue), note: 'Non-cancelled order value', icon: IndianRupee },
    { label: 'Orders', value: metrics.orders, note: `${metrics.codOrders} COD / ${metrics.razorpayOrders} Razorpay`, icon: ShoppingBag },
    { label: 'Items to deliver', value: metrics.itemsToDeliver, note: `${metrics.ordersToDeliver} active orders`, icon: Truck },
    { label: 'Stock units', value: metrics.stockUnits, note: `${metrics.lowStock} low-stock products`, icon: Boxes },
    { label: 'Customers', value: metrics.customers, note: `${metrics.pendingTestimonials} testimonials pending`, icon: UsersRound },
  ]

  const analytics = [
    { label: 'Average order value', value: formatMoney(metrics.orders ? Math.round(metrics.revenue / metrics.orders) : 0) },
    { label: 'Units sold', value: metrics.unitsSold },
    { label: 'Product catalog', value: metrics.products },
    { label: 'Delivery queue', value: metrics.ordersToDeliver },
  ]

  return (
    <section className="admin-page">
      <div className="admin-heading admin-dashboard-hero">
        <div>
          <span className="eyebrow">Admin command center</span>
          <h1>Business dashboard</h1>
          <p>Track orders, testimonial approvals, delivery workload, revenue, and stock warnings from one place.</p>
        </div>
        <div className="admin-hero-alert">
          <Bell size={20} />
          <strong>{visibleNotifications.length}</strong>
          <span>live notifications</span>
        </div>
      </div>

      {orderAlert && (
        <Link
          className="admin-order-alert-banner"
          onClick={() => {
            setDismissedNotifications((current) => [...current, orderAlert.id])
            setOrderAlert(null)
          }}
          to={orderAlert.href || '/admin/orders'}
        >
          <Bell size={19} />
          <div>
            <strong>{orderAlert.title}</strong>
            <span>{orderAlert.message}</span>
          </div>
          <small>Open orders</small>
        </Link>
      )}

      <div className="admin-grid dashboard-top-grid">
        <NotificationsPanel
          notifications={visibleNotifications}
          onOpen={(id) => setDismissedNotifications((current) => [...current, id])}
        />
        <div className="admin-panel dashboard-action-panel">
          <h2><AlertTriangle size={20} /> Today needs attention</h2>
          <div className="dashboard-action-list">
            <div>
              <strong>{metrics.pendingTestimonials}</strong>
              <span>testimonials pending approval</span>
            </div>
            <div>
              <strong>{metrics.ordersToDeliver}</strong>
              <span>orders still in delivery flow</span>
            </div>
            <div>
              <strong>{metrics.lowStock}</strong>
              <span>products at low stock</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-analytics-strip">
        {analytics.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="stats-grid admin-stats-wide">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article className="stat-card metric-card" key={stat.label}>
              <Icon size={22} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </article>
          )
        })}
      </div>

      <div className="admin-grid two-column">
        <ChartPanel title="Revenue trend" data={revenueTrend} valueKey="value" formatter={formatMoney} />
        <StatusChart statusCounts={statusCounts} />
      </div>

      <div className="admin-grid two-column">
        <div className="admin-panel">
          <h2>Recent orders</h2>
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8).toUpperCase()}</td>
                  <td>{order.user?.name || order.shippingAddress?.fullName}</td>
                  <td><span className={`status-pill ${order.status}`}>{order.status}</span></td>
                  <td>{formatMoney(order.total)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan="4">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <ChartPanel title="Top product revenue" data={topProducts} labelKey="name" valueKey="revenue" formatter={formatMoney} />
      </div>

      <div className="admin-panel">
        <h2><PackageSearch size={20} /> Low stock watch</h2>
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th></tr></thead>
          <tbody>
            {lowStockProducts.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>{formatMoney(product.price)}</td>
              </tr>
            ))}
            {lowStockProducts.length === 0 && <tr><td colSpan="4">Stock levels look healthy.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    ;[0, 0.18].forEach((offset) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, context.currentTime + offset)
      oscillator.frequency.exponentialRampToValueAtTime(620, context.currentTime + offset + 0.12)
      gain.gain.setValueAtTime(0.001, context.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.09, context.currentTime + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.16)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(context.currentTime + offset)
      oscillator.stop(context.currentTime + offset + 0.18)
    })
  } catch {
    // Browsers may block audio before user interaction.
  }
}

function NotificationsPanel({ notifications = [], onOpen }) {
  function getIcon(type) {
    if (type === 'testimonial') return MessageSquareQuote
    if (type === 'low-stock' || type === 'out-stock') return PackageSearch
    return ShoppingBag
  }

  return (
    <div className="admin-panel notification-panel">
      <h2><Bell size={20} /> Notifications</h2>
      <div className="notification-list">
        {notifications.map((notification) => {
          const Icon = getIcon(notification.type)
          return (
            <Link
              className={`notification-item ${notification.level}`}
              key={notification.id}
              onClick={() => onOpen?.(notification.id)}
              to={notification.href || '/admin/dashboard'}
            >
              <span><Icon size={18} /></span>
              <div>
                <strong>{notification.title}</strong>
                <small>{notification.message}</small>
              </div>
            </Link>
          )
        })}
        {notifications.length === 0 && <div className="empty-state">No notifications right now.</div>}
      </div>
    </div>
  )
}

function ChartPanel({ data = [], formatter = (value) => value, labelKey = 'date', title, valueKey }) {
  const max = useMemo(() => Math.max(...data.map((item) => item[valueKey] || 0), 1), [data, valueKey])

  return (
    <div className="admin-panel chart-panel">
      <h2>{title}</h2>
      {data.length === 0 ? (
        <div className="empty-state">No chart data yet.</div>
      ) : (
        <div className="bar-chart">
          {data.map((item) => (
            <div className="bar-row" key={item[labelKey]}>
              <span>{String(item[labelKey]).slice(0, 16)}</span>
              <div><b style={{ width: `${Math.max(8, ((item[valueKey] || 0) / max) * 100)}%` }} /></div>
              <strong>{formatter(item[valueKey] || 0)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusChart({ statusCounts = {} }) {
  const statuses = ['placed', 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']
  const total = statuses.reduce((sum, status) => sum + (statusCounts[status] || 0), 0) || 1

  return (
    <div className="admin-panel chart-panel">
      <h2>Order status graph</h2>
      <div className="donut-chart" style={{ '--delivered': `${((statusCounts.delivered || 0) / total) * 100}%` }}>
        <span>{total}</span>
        <small>orders</small>
      </div>
      <div className="status-breakdown">
        {statuses.map((status) => (
          <div key={status}>
            <span>{status}</span>
            <strong>{statusCounts[status] || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
