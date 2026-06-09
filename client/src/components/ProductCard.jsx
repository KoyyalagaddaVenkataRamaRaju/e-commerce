import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, Tag } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleAdd() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location, message: 'Please sign in before adding items.' } })
      return
    }
    addItem(product)
  }

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-media">
        <img src={product.image} alt={product.name} />
        {product.badges?.length > 0 && (
          <div className="product-badge-stack">
            {product.badges.slice(0, 3).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        )}
      </Link>
      <div className="product-body">
        <div className="product-kicker">
          <span>{product.category}</span>
          {product.brand && <span>{product.brand}</span>}
        </div>
        <h3>{product.name}</h3>
        {product.tags?.length > 0 && (
          <div className="product-tag-row">
            {product.tags.slice(0, 2).map((tag) => (
              <span key={tag}><Tag size={13} /> {tag}</span>
            ))}
          </div>
        )}
        <div className="product-meta">
          <strong>Rs. {product.price.toLocaleString('en-IN')}</strong>
          {product.mrp > product.price && <del>Rs. {product.mrp.toLocaleString('en-IN')}</del>}
          <span>/ {product.unit}</span>
        </div>
        <button onClick={handleAdd} className="button compact" disabled={product.stock <= 0}>
          <Plus size={17} /> {product.stock <= 0 ? 'Out of stock' : 'Add'}
        </button>
      </div>
    </article>
  )
}
