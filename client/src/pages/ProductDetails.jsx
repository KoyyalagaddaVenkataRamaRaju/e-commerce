import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PackageCheck, ShieldCheck, ShoppingCart, Star, Tag } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import api from '../services/api'
import { productToView } from '../utils/productView'

export default function ProductDetails() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [activeImage, setActiveImage] = useState('')
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let ignore = false
    setStatus('loading')
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        if (!ignore) {
          const viewProduct = productToView(data)
          setProduct(viewProduct)
          setActiveImage(viewProduct.image)
          setStatus('ready')
          api.get(`/reviews/product/${viewProduct.id}`).then(({ data: reviewData }) => setReviews(reviewData)).catch(() => setReviews([]))
        }
      })
      .catch(() => {
        if (!ignore) setStatus('error')
      })
    return () => {
      ignore = true
    }
  }, [slug])

  const gallery = useMemo(() => {
    if (!product) return []
    return Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)))
  }, [product])

  const reviewStats = useMemo(() => {
    const total = reviews.length
    const average = total ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0
    const counts = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }))
    return { average, counts, total }
  }, [reviews])

  function handleAdd() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location, message: 'Please sign in before adding items.' } })
      return
    }
    addItem(product)
  }

  if (status === 'loading') {
    return <section className="section page-section">Loading product...</section>
  }

  if (status === 'error' || !product) {
    return <section className="section page-section">Product not found.</section>
  }

  return (
    <section className="product-detail page-section">
      <div className="detail-media product-gallery">
        <img src={activeImage} alt={product.name} />
        <div className="gallery-thumbs">
          {gallery.map((image) => (
            <button className={activeImage === image ? 'active' : ''} key={image} onClick={() => setActiveImage(image)} type="button">
              <img src={image} alt={product.name} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <span className="eyebrow">{product.category}</span>
        <h1>{product.name}</h1>
        <div className="detail-badge-row">
          {product.brand && <span>{product.brand}</span>}
          {product.badges?.map((badge) => <span key={badge}>{badge}</span>)}
        </div>
        <p>{product.description}</p>
        <div className="detail-price">
          Rs. {product.price.toLocaleString('en-IN')} <span>/ {product.unit}</span>
          {product.mrp > product.price && <del>Rs. {product.mrp.toLocaleString('en-IN')}</del>}
        </div>
        {product.tags?.length > 0 && (
          <div className="detail-tag-row">
            {product.tags.map((tag) => <span key={tag}><Tag size={14} /> {tag}</span>)}
          </div>
        )}
        <div className="stock-note">
          <PackageCheck size={19} /> {product.stock} units available
        </div>
        {product.features?.length > 0 && (
          <div className="feature-list">
            <h2><ShieldCheck size={18} /> Features</h2>
            {product.features.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        )}
        <button className="button" onClick={handleAdd} disabled={product.stock <= 0}>
          <ShoppingCart size={18} /> {product.stock <= 0 ? 'Out of stock' : 'Add to cart'}
        </button>
        <div className="review-panel amazon-review-panel">
          <h2>Customer reviews</h2>
          {reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <>
              <div className="review-summary">
                <div className="review-average">
                  <strong>{reviewStats.average.toFixed(1)}</strong>
                  <span><Star size={18} /> out of 5</span>
                  <small>{reviewStats.total} global ratings</small>
                </div>
                <div className="rating-bars">
                  {reviewStats.counts.map((item) => (
                    <div className="rating-bar-row" key={item.rating}>
                      <span>{item.rating} star</span>
                      <div><b style={{ width: `${reviewStats.total ? (item.count / reviewStats.total) * 100 : 0}%` }} /></div>
                      <small>{item.count}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="review-list">
                {reviews.map((review) => (
                  <article className="amazon-review-card" key={review._id}>
                    <div className="review-card-head">
                      <strong>{review.user?.name || 'Customer'}</strong>
                      <span className="verified-badge">Verified purchase</span>
                    </div>
                    <strong className="review-stars"><Star size={16} /> {review.rating}/5 {review.title}</strong>
                    <small>Reviewed on {new Date(review.createdAt).toLocaleDateString('en-IN')}</small>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
