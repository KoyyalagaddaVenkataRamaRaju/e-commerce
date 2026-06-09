import { useEffect, useMemo, useState } from 'react'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import api from '../services/api'
import { productToView } from '../utils/productView'

const PAGE_SIZE = 8

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let ignore = false
    setStatus('loading')
    api
      .get('/products')
      .then(({ data }) => {
        if (!ignore) {
          setProducts(data.map(productToView))
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!ignore) setStatus('error')
      })
    return () => {
      ignore = true
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).filter(Boolean),
    [products],
  )

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products
    return products.filter((product) => product.category === activeCategory)
  }, [activeCategory, products])

  const pagedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProducts, page],
  )

  function selectCategory(category) {
    setActiveCategory(category)
    setPage(1)
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <span className="eyebrow">Inventory</span>
        <h1>Hardware materials</h1>
      </div>
      {categories.length > 0 && (
        <div className="filter-bar">
          {['All', ...categories].map((category) => (
          <button
            className={activeCategory === category ? 'active' : ''}
            key={category}
            onClick={() => selectCategory(category)}
          >
            {category}
          </button>
          ))}
        </div>
      )}
      {status === 'loading' && <div className="empty-state">Loading products...</div>}
      {status === 'error' && <div className="empty-state">Could not load products.</div>}
      {status === 'ready' && filteredProducts.length === 0 && (
        <div className="empty-state">No products yet. Login as admin and add your first item.</div>
      )}
      <div className="product-grid">
        {pagedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredProducts.length} onPageChange={setPage} />
    </section>
  )
}
