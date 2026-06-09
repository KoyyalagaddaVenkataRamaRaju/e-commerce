import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, Building2, Drill, Hammer, PackageCheck, ShieldCheck, Sparkles, Store, Truck, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandShowcase from '../components/BrandShowcase'
import ProductCard from '../components/ProductCard'
import api from '../services/api'
import { productToView } from '../utils/productView'
import heroImage from '../assets/hero.png'

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    let ignore = false
    api
      .get('/products')
      .then(({ data }) => {
        if (!ignore) setProducts(data.map(productToView))
      })
      .catch(() => {
        if (!ignore) setProducts([])
      })
    return () => {
      ignore = true
    }
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).filter(Boolean).slice(0, 8),
    [products],
  )
  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).slice(0, 4),
    [products],
  )
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4)
  const heroProduct = displayProducts[0] || products[0]
  const heroVisual = heroProduct?.image || heroImage
  const categoryIcons = [Hammer, Building2, Wrench, Drill, PackageCheck, ShieldCheck, Truck, Sparkles]

  return (
    <>
      <section className="hero-section home-hero">
        <div className="hero-copy">
          <span className="eyebrow">Varma Hardware Enterprises</span>
          <h1>Varma Hardware Enterprises</h1>
          <p>
            Contractor-grade cement, iron, timber, fittings, tools, and site essentials arranged for fast buying,
            dependable pricing, and clean dispatch.
          </p>
          <div className="hero-mini-ledger" aria-label="Store highlights">
            <div>
              <strong>Trade supply</strong>
              <span>Bulk and daily site orders</span>
            </div>
            <div>
              <strong>Verified stock</strong>
              <span>Brands, tools, fittings</span>
            </div>
          </div>
          <div className="hero-actions">
            <Link to="/shop" className="button">
              Shop materials <ArrowRight size={18} />
            </Link>
            <Link to="/checkout" className="button ghost">
              Request bulk quote
            </Link>
          </div>
          <div className="hero-store-search">
            <span><Store size={15} /> Hardware</span>
            <Link to="/shop">Search materials <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-trust-row">
            <span><BadgeCheck size={17} /> Quality checked</span>
            <span><Truck size={17} /> Local dispatch</span>
            <span><ShieldCheck size={17} /> Trade support</span>
          </div>
        </div>
        <div className="hero-panel">
          <img src={heroVisual} alt={heroProduct?.name || 'Hardware enterprise materials'} />
          <div className="hero-image-caption">
            <div>
              <strong>{heroProduct?.name || 'Hardware supply counter'}</strong>
              <span>{heroProduct ? `${heroProduct.category} ready for site work` : 'Materials, tools, and fittings ready for site work'}</span>
            </div>
            <Link to="/shop" aria-label="Open shop">
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="feature-strip home-feature-strip">
        <div>
          <Truck size={22} />
          <span>Delivery scheduling</span>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>Verified suppliers</span>
        </div>
        <div>
          <Hammer size={22} />
          <span>Contractor-ready stock</span>
        </div>
      </section>

      <section className="home-stats-band">
        <div>
          <strong>1,200+</strong>
          <span>site orders handled</span>
        </div>
        <div>
          <strong>60+</strong>
          <span>trusted brands</span>
        </div>
        <div>
          <strong>24 hr</strong>
          <span>quote response</span>
        </div>
        <div>
          <strong>4.8/5</strong>
          <span>customer confidence</span>
        </div>
      </section>

      <section className="section home-section">
        <div className="section-heading">
          <span className="eyebrow">Categories</span>
          <h2>Shop by material</h2>
        </div>
        {categories.length === 0 ? (
          <div className="empty-state">Add categories from the admin product form.</div>
        ) : (
          <div className="category-grid">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length]
              return (
              <Link to="/shop" key={category}>
                <Icon size={24} />
                <span>{category}</span>
                <small>View stock</small>
              </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="section home-split-band">
        <div>
          <span className="eyebrow">Built for daily trade</span>
          <h2>Everything a site team needs, without hunting through shelves.</h2>
        </div>
        <div className="service-grid">
          <article>
            <PackageCheck size={22} />
            <strong>Organized stock</strong>
            <span>Clear units, categories, brands, and availability.</span>
          </article>
          <article>
            <Truck size={22} />
            <strong>Dispatch ready</strong>
            <span>Plan orders for local site delivery and pickup.</span>
          </article>
          <article>
            <ShieldCheck size={22} />
            <strong>Reliable supply</strong>
            <span>Verified materials for repeat contractor purchases.</span>
          </article>
        </div>
      </section>

      <section className="section home-section">
        <div className="section-heading product-heading-row">
          <div>
            <span className="eyebrow">Popular stock</span>
            <h2>Featured products</h2>
          </div>
          <Link to="/shop" className="button ghost">View shop <ArrowRight size={17} /></Link>
        </div>
        {displayProducts.length === 0 ? (
          <div className="empty-state">Your database is ready. Login as admin to add products.</div>
        ) : (
          <div className="product-grid">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <BrandShowcase products={products} />
    </>
  )
}
