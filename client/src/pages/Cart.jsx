import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../context/useCart'

export default function Cart() {
  const { items, removeItem, totals, updateQuantity } = useCart()

  return (
    <section className="cart-page page-section">
      <div className="section-heading">
        <span className="eyebrow">Cart</span>
        <h1>Material order</h1>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/shop" className="button">Browse products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((item) => (
              <article className="cart-line" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <span>₹{item.price.toLocaleString('en-IN')} / {item.unit}</span>
                </div>
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={15} /></button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={15} /></button>
                </div>
                <button className="icon-button" onClick={() => removeItem(item.id)} aria-label="Remove item">
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
          <OrderSummary totals={totals} />
        </div>
      )}
    </section>
  )
}

function OrderSummary({ totals }) {
  return (
    <aside className="summary-box">
      <h2>Summary</h2>
      <div><span>Subtotal</span><strong>₹{totals.subtotal.toLocaleString('en-IN')}</strong></div>
      <div><span>GST</span><strong>₹{totals.tax.toLocaleString('en-IN')}</strong></div>
      <div><span>Delivery</span><strong>₹{totals.delivery.toLocaleString('en-IN')}</strong></div>
      <div className="summary-total"><span>Total</span><strong>₹{totals.total.toLocaleString('en-IN')}</strong></div>
      <Link to="/checkout" className="button">Proceed to checkout</Link>
    </aside>
  )
}
