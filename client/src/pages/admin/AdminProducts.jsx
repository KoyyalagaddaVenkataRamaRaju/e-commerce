import { useEffect, useMemo, useState } from 'react'
import { Edit3, UploadCloud } from 'lucide-react'
import Pagination from '../../components/Pagination'
import api from '../../services/api'
import { env } from '../../config/env'

const defaultCategories = ['Cement', 'Iron', 'Timber', 'Windows', 'Tools', 'Fittings', 'Paints', 'Electrical', 'Plumbing']
const PAGE_SIZE = 8

const emptyProduct = {
  brand: '',
  category: '',
  company: '',
  description: '',
  discountPercent: '',
  features: '',
  images: [],
  isFeatured: true,
  isNew: true,
  mrp: '',
  name: '',
  price: '',
  slug: '',
  stock: '',
  tags: '',
  unit: 'piece',
}

function formatMoney(value = 0) {
  return `Rs. ${Number(value).toLocaleString('en-IN')}`
}

function splitList(value = '') {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function AdminProducts({ mode = 'add' }) {
  const [form, setForm] = useState(emptyProduct)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [stockEdits, setStockEdits] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const categoryOptions = useMemo(
    () => Array.from(new Set([...defaultCategories, ...products.map((product) => product.category).filter(Boolean)])),
    [products],
  )

  const pagedProducts = useMemo(
    () => products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, products],
  )

  async function loadProducts() {
    const { data } = await api.get('/products')
    setProducts(data)
  }

  useEffect(() => {
    loadProducts().catch(() => setError('Could not load products.'))
  }, [])

  function makeSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function updateField(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' ? { slug: makeSlug(value) } : {}),
    }))
  }

  async function uploadToCloudinary(file) {
    if (!env.cloudinaryCloudName || !env.cloudinaryUploadPreset) {
      throw new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
    }

    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', env.cloudinaryUploadPreset)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
      method: 'POST',
      body,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Cloudinary upload failed')
    }
    return data.secure_url
  }

  async function handleImages(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setUploading(true)
    setError('')
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary))
      setForm((current) => ({ ...current, images: [...current.images, ...urls] }))
      setMessage('Images uploaded to Cloudinary.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function removeImage(url) {
    setForm((current) => ({ ...current, images: current.images.filter((image) => image !== url) }))
  }

  function productToForm(product) {
    return {
      brand: product.brand || '',
      category: product.category || '',
      company: product.company || '',
      description: product.description || '',
      discountPercent: product.discountPercent || '',
      features: (product.features || []).join('\n'),
      images: product.images || [],
      isFeatured: Boolean(product.isFeatured),
      isNew: Boolean(product.isNew),
      mrp: product.mrp || '',
      name: product.name || '',
      price: product.price || '',
      slug: product.slug || '',
      stock: product.stock || '',
      tags: (product.tags || []).join('\n'),
      unit: product.unit || 'piece',
    }
  }

  function selectProduct(product) {
    setSelectedProduct(product)
    setForm(productToForm(product))
    setMessage('')
    setError('')
    window.requestAnimationFrame(() => {
      document.querySelector('.product-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function buildPayload() {
    return {
      brand: form.brand.trim(),
      category: form.category.trim(),
      company: form.company.trim(),
      description: form.description.trim(),
      discountPercent: Number(form.discountPercent || 0),
      features: splitList(form.features),
      images: form.images,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      mrp: Number(form.mrp || 0),
      name: form.name.trim(),
      price: Number(form.price),
      slug: form.slug.trim(),
      stock: Number(form.stock),
      tags: splitList(form.tags),
      unit: form.unit.trim(),
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (form.images.length === 0) {
      setError('Upload at least one product image to Cloudinary before saving.')
      return
    }

    setLoading(true)
    try {
      await api.post('/products', buildPayload())
      setForm(emptyProduct)
      await loadProducts()
      setMessage('Product added to the database.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add product.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStock(product) {
    const nextStock = Number(stockEdits[product._id])
    if (Number.isNaN(nextStock) || nextStock < 0) return

    setError('')
    try {
      await api.put(`/products/${product._id}`, { stock: nextStock })
      await loadProducts()
      setMessage(`${product.name} stock updated.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update stock.')
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    if (!selectedProduct) return
    setError('')
    setMessage('')

    if (form.images.length === 0) {
      setError('Keep at least one product image before updating.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.put(`/products/${selectedProduct._id}`, buildPayload())
      setProducts((current) => current.map((product) => (product._id === data._id ? data : product)))
      setSelectedProduct(data)
      setMessage(`${data.name} updated successfully.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update product.')
    } finally {
      setLoading(false)
    }
  }

  function renderProductForm({ onSubmit, submitText, title }) {
    return (
      <form className="admin-panel product-form product-edit-panel" onSubmit={onSubmit}>
        <div className="form-title">
          <h2>{title}</h2>
          <span>Images are uploaded only through Cloudinary. Add brand, category, tags, and offers for storefront badges.</span>
        </div>
        {message && <p className="form-note wide">{message}</p>}
        {error && <p className="form-error wide">{error}</p>}
        <label>
          Product name
          <input name="name" value={form.name} onChange={updateField} placeholder="Premium brass door handle" required />
        </label>
        <label>
          Slug
          <input name="slug" value={form.slug} onChange={updateField} placeholder="premium-brass-door-handle" required />
        </label>
        <label>
          Category
          <input list="product-categories" name="category" value={form.category} onChange={updateField} placeholder="Fittings" required />
          <datalist id="product-categories">
            {categoryOptions.map((category) => <option key={category} value={category} />)}
          </datalist>
        </label>
        <label>
          Brand
          <input name="brand" value={form.brand} onChange={updateField} placeholder="Bosch, Tata, Asian Paints" />
        </label>
        <label>
          Company
          <input name="company" value={form.company} onChange={updateField} placeholder="Manufacturer or supplier" />
        </label>
        <label>
          Selling price
          <input name="price" type="number" min="0" value={form.price} onChange={updateField} placeholder="1299" required />
        </label>
        <label>
          MRP
          <input name="mrp" type="number" min="0" value={form.mrp} onChange={updateField} placeholder="1599" />
        </label>
        <label>
          Discount %
          <input name="discountPercent" type="number" min="0" max="95" value={form.discountPercent} onChange={updateField} placeholder="20" />
        </label>
        <label>
          Unit
          <input name="unit" value={form.unit} onChange={updateField} placeholder="piece, bag, kg" required />
        </label>
        <label>
          Stock
          <input name="stock" type="number" min="0" value={form.stock} onChange={updateField} placeholder="25" required />
        </label>
        <label className="toggle-field">
          <input name="isFeatured" type="checkbox" checked={form.isFeatured} onChange={updateField} />
          Featured product
        </label>
        <label className="toggle-field">
          <input name="isNew" type="checkbox" checked={form.isNew} onChange={updateField} />
          New arrival
        </label>
        <label className="wide cloudinary-upload-field">
          <span><UploadCloud size={19} /> Upload product images to Cloudinary</span>
          <input type="file" accept="image/*" multiple onChange={handleImages} disabled={uploading} required={form.images.length === 0} />
        </label>
        <div className="image-preview-strip wide">
          {form.images.map((url) => (
            <button key={url} type="button" onClick={() => removeImage(url)} aria-label="Remove uploaded image">
              <img src={url} alt="Product upload" />
            </button>
          ))}
          {form.images.length === 0 && <span>No Cloudinary images uploaded yet.</span>}
        </div>
        <label className="wide">
          Description
          <textarea name="description" value={form.description} onChange={updateField} placeholder="Detailed product description for customers." required />
        </label>
        <label className="wide">
          Features
          <textarea name="features" value={form.features} onChange={updateField} placeholder={'One feature per line\nHeavy-duty finish\nEasy installation\nWarranty included'} />
        </label>
        <label className="wide">
          Storefront tags
          <textarea name="tags" value={form.tags} onChange={updateField} placeholder={'Use commas or one per line\nBest seller\nContractor choice\nLimited stock'} />
        </label>
        <button className="button" disabled={loading || uploading} type="submit">
          {loading ? 'Saving...' : uploading ? 'Uploading...' : submitText}
        </button>
      </form>
    )
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <span className="eyebrow">Catalog</span>
        <h1>{mode === 'add' ? 'Add product' : 'Manage products'}</h1>
      </div>
      {mode === 'add' && renderProductForm({ onSubmit: handleSubmit, submitText: 'Add product', title: 'Add product' })}
      {mode === 'manage' && selectedProduct && (
        renderProductForm({ onSubmit: handleUpdate, submitText: 'Update product', title: `Editing ${selectedProduct.name}` })
      )}
      {mode === 'manage' && !selectedProduct && (
        <div className="admin-panel product-select-empty">
          <Edit3 size={24} />
          <strong>Select a product below to edit pricing, stock, images, tags, and storefront details.</strong>
        </div>
      )}
      {mode === 'manage' && (
      <div className="admin-panel">
        <h2>Live inventory</h2>
        <div className="inventory-card-grid">
          {pagedProducts.map((product) => (
            <article className="inventory-card" key={product._id}>
              <div className="inventory-card-media">
                {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : <span>No image</span>}
              </div>
              <div className="inventory-card-body">
                <div className="inventory-card-head">
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.brand || product.company || 'Unbranded'}</span>
                  </div>
                  <span className={`status-pill ${product.stock <= 5 ? 'pending' : 'approved'}`}>{product.stock} stock</span>
                </div>
                <div className="inventory-meta-row">
                  <span>{product.category}</span>
                  <span>{product.images?.length || 0} images</span>
                  <span>{product.discountPercent ? `${product.discountPercent}% off` : product.isNew ? 'New' : 'Regular'}</span>
                </div>
                <div className="inventory-price-row">
                  <strong>{formatMoney(product.price)}</strong>
                  {product.mrp > product.price && <del>{formatMoney(product.mrp)}</del>}
                  <span>/ {product.unit}</span>
                </div>
                <div className="stock-update product-manage-actions">
                  <input type="number" min="0" value={stockEdits[product._id] ?? product.stock} onChange={(event) => setStockEdits((current) => ({ ...current, [product._id]: event.target.value }))} />
                  <button type="button" onClick={() => updateStock(product)}>Stock</button>
                  <button type="button" onClick={() => selectProduct(product)}>Edit</button>
                </div>
              </div>
            </article>
          ))}
          {products.length === 0 && <div className="empty-state">No products yet. Add the first product above.</div>}
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={products.length} onPageChange={setPage} />
      </div>
      )}
    </section>
  )
}
