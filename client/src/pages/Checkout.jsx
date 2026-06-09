import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CreditCard, Mail, MapPin, PackageCheck, Smartphone, Truck } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'

const emptyAddress = {
  fullName: '',
  phone: '',
  email: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
}

function formatMoney(value = 0) {
  return `Rs. ${value.toLocaleString('en-IN')}`
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const { user } = useAuth()
  const { clearCart, items, totals } = useCart()
  const [address, setAddress] = useState(emptyAddress)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [saveAddress, setSaveAddress] = useState(true)
  const [makeDefaultAddress, setMakeDefaultAddress] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [orders, setOrders] = useState([])
  const [placedOrder, setPlacedOrder] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAddress((current) => ({
      ...current,
      fullName: current.fullName || user?.name || '',
      phone: current.phone || user?.phone || '',
      email: current.email || user?.email || '',
    }))
  }, [user])

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setSavedAddresses(data.user.savedAddresses || [])
      const defaultAddress = data.user.savedAddresses?.find((item) => item.isDefault) || data.user.savedAddresses?.[0]
      if (defaultAddress) {
        setAddress((current) => ({ ...current, ...defaultAddress }))
      }
    }).catch(() => {})

    loadOrders()
  }, [])

  const canPlaceOrder = useMemo(() => items.length > 0 && !loading, [items.length, loading])

  function loadOrders() {
    api.get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
  }

  function updateAddress(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function selectSavedAddress(event) {
    const selected = savedAddresses.find((item) => item._id === event.target.value)
    if (selected) {
      setAddress((current) => ({ ...current, ...selected }))
    }
  }

  async function handleRazorpayPayment(order) {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setMessage('Order created, but Razorpay could not load. Admin can follow up from the dashboard.')
      return
    }

    const { data: paymentOrder } = await api.post('/payments/create-order', { orderId: order._id })

    const razorpay = new window.Razorpay({
      key: paymentOrder.key,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: 'Varma Hardware',
      description: `Order ${order._id}`,
      order_id: paymentOrder.razorpayOrderId,
      prefill: {
        name: address.fullName,
        email: address.email,
        contact: address.phone,
      },
      handler: async (response) => {
        const { data } = await api.post('/payments/verify', {
          orderId: order._id,
          ...response,
        })
        setPlacedOrder(data.order)
        clearCart()
        loadOrders()
        setMessage('Payment received and order placed.')
      },
      modal: {
        ondismiss: () => {
          setMessage('Order created with Razorpay payment pending. You can complete payment later from admin follow-up.')
        },
      },
    })

    razorpay.open()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!items.length) {
      setError('Your cart is empty.')
      return
    }

    setLoading(true)
    try {
      const { data: order } = await api.post('/orders', {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: address,
        saveAddress,
        makeDefaultAddress,
        paymentMethod,
      })

      setPlacedOrder(order)
      loadOrders()

      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(order)
      } else {
        clearCart()
        setMessage('COD order placed. Admin will pack and dispatch it.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="checkout-page page-section">
      <div className="checkout-main">
        <div className="section-heading">
          <span className="eyebrow">Checkout</span>
          <h1>Delivery and payment</h1>
        </div>
        {message && <p className="form-note">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        {placedOrder && <OrderPlaced order={placedOrder} />}

        <form className="checkout-form" onSubmit={handleSubmit}>
          {savedAddresses.length > 0 && (
            <label className="wide">
              Saved address
              <select onChange={selectSavedAddress} defaultValue={(savedAddresses.find((item) => item.isDefault) || savedAddresses[0])?._id || ''}>
                {savedAddresses.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.isDefault ? 'Default: ' : ''}{item.line1}, {item.city} - {item.pincode}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Full name
            <input name="fullName" value={address.fullName} onChange={updateAddress} placeholder="Customer name" required />
          </label>
          <label>
            Mobile number
            <input name="phone" value={address.phone} onChange={updateAddress} placeholder="+91 98765 43210" required />
          </label>
          <label>
            Email address
            <input name="email" type="email" value={address.email} onChange={updateAddress} placeholder="customer@example.com" required />
          </label>
          <label>
            Pincode
            <input name="pincode" value={address.pincode} onChange={updateAddress} placeholder="500001" required />
          </label>
          <label className="wide">
            Delivery address
            <textarea name="line1" value={address.line1} onChange={updateAddress} placeholder="House/site, street, area" required />
          </label>
          <label>
            City
            <input name="city" value={address.city} onChange={updateAddress} placeholder="Hyderabad" required />
          </label>
          <label>
            State
            <input name="state" value={address.state} onChange={updateAddress} placeholder="Telangana" required />
          </label>
          <label className="toggle-field wide">
            <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />
            Save this address for next order
          </label>
          <label className="toggle-field wide">
            <input type="checkbox" checked={makeDefaultAddress} onChange={(event) => setMakeDefaultAddress(event.target.checked)} />
            Make this my default shipping address
          </label>

          <div className="payment-options wide">
            <button className={paymentMethod === 'cod' ? 'active' : ''} onClick={() => setPaymentMethod('cod')} type="button">
              <Truck size={18} /> Cash on delivery
            </button>
            <button className={paymentMethod === 'razorpay' ? 'active' : ''} onClick={() => setPaymentMethod('razorpay')} type="button">
              <CreditCard size={18} /> Razorpay
            </button>
          </div>

          <button className="button wide" disabled={!canPlaceOrder} type="submit">
            {loading ? 'Placing order...' : paymentMethod === 'cod' ? 'Place COD order' : 'Place order and pay'}
          </button>
        </form>
      </div>

      <aside className="payment-panel">
        <h2>Order summary</h2>
        <div><span>Items</span><strong>{totals.count}</strong></div>
        <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div>
        <div><span>GST</span><strong>{formatMoney(totals.tax)}</strong></div>
        <div><span>Delivery</span><strong>{formatMoney(totals.delivery)}</strong></div>
        <div className="summary-total"><span>Total</span><strong>{formatMoney(totals.total)}</strong></div>
        <div><Smartphone size={18} /> Phone saved on profile</div>
        <div><Mail size={18} /> Confirmation email</div>
        <div><PackageCheck size={18} /> Admin stock update</div>
      </aside>

      <section className="my-orders-panel">
        <div className="section-heading">
          <span className="eyebrow">Your orders</span>
          <h2>Order history</h2>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">No orders yet.</div>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <OrderRow key={order._id} order={order} />
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function OrderPlaced({ order }) {
  return (
    <div className="order-success">
      <CheckCircle2 size={22} />
      <div>
        <strong>Order placed</strong>
        <span>#{order._id.slice(-8).toUpperCase()} · {formatMoney(order.total)} · {order.payment?.method?.toUpperCase()}</span>
      </div>
    </div>
  )
}

function OrderRow({ order }) {
  return (
    <article className="order-row">
      <div>
        <strong>#{order._id.slice(-8).toUpperCase()}</strong>
        <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
      </div>
      <div>
        <span>{order.items.length} item types</span>
        <strong>{formatMoney(order.total)}</strong>
      </div>
      <div>
        <MapPin size={16} />
        <span>{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
      </div>
      <span className={`status-pill ${order.status}`}>{order.status}</span>
    </article>
  )
}
