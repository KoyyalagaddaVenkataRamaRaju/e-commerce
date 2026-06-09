import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function getBrandName(product) {
  return product.brand || product.company || product.category || 'Varma Hardware'
}

function buildRows(products) {
  const brandMap = new Map()

  products.forEach((product) => {
    const brandName = getBrandName(product)
    if (!brandMap.has(brandName)) {
      brandMap.set(brandName, {
        id: product.id || product._id || product.slug || brandName,
        name: brandName,
        slug: product.slug,
      })
    }
  })

  const brands = Array.from(brandMap.values()).slice(0, 18)
  if (brands.length === 0) return []
  const firstRow = brands.length < 5 ? [...brands, ...brands, ...brands] : brands
  const secondRow = [...firstRow].reverse()
  return [firstRow, secondRow]
}

export default function BrandShowcase({ products = [] }) {
  const rows = buildRows(products)
  if (rows.length === 0) return null

  return (
    <section className="section brand-showcase-section">
      <div className="section-heading brand-showcase-heading">
        <div>
          <span className="eyebrow">Brands and companies</span>
          <h2>Trusted names in stock</h2>
        </div>
        <Link to="/shop" className="button ghost">
          Shop all <ArrowRight size={17} />
        </Link>
      </div>

      <div className="brand-marquee-shell">
        {rows.map((row, rowIndex) => (
          <div className="brand-marquee" key={rowIndex}>
            <div className={`brand-marquee-track ${rowIndex === 1 ? 'reverse' : ''}`}>
              {[...row, ...row].map((brand, index) => {
                const detailUrl = brand.slug ? `/products/${brand.slug}` : '/shop'
                return (
                  <article className="brand-product-card" key={`${brand.id}-${rowIndex}-${index}`}>
                    <Link to={detailUrl} className="brand-title-button">
                      {brand.name}
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
