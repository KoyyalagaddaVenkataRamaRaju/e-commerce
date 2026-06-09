import { useEffect, useMemo, useState } from 'react'
import { Camera, PenLine, Save, Send, ShieldCheck, Video } from 'lucide-react'
import api from '../services/api'
import { env } from '../config/env'
import { useAuth } from '../context/useAuth'

const testimonialColors = [
  '#8a5a36',
  '#2f4f3f',
  '#4c1d26',
  '#243447',
  '#fffaf0',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#f97316',
  '#a855f7',
  '#e11d48',
  '#84cc16',
]

const emptyForm = {
  avatarUrl: '',
  cardColor: testimonialColors[0],
  company: '',
  message: '',
  rating: 5,
  role: 'Customer',
  videoUrl: '',
}

function getInitials(name = 'Customer') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VH'
}

function getInk(color = '#ffffff') {
  const normalized = color.replace('#', '')
  if (normalized.length !== 6) return '#0f172a'

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000
  return brightness > 150 ? '#0f172a' : '#f8fafc'
}

export default function Testimonials() {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [testimonial, setTestimonial] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState('')

  const previewMeta = useMemo(
    () => [form.role, form.company].filter(Boolean).join(', ') || 'Customer',
    [form.company, form.role],
  )

  useEffect(() => {
    loadTestimonials()
  }, [])

  function loadTestimonials() {
    api.get('/testimonials/mine')
      .then(({ data }) => {
        const current = data[0] || null
        setTestimonial(current)
        if (current) {
          setForm({
            avatarUrl: current.avatarUrl || '',
            cardColor: current.cardColor || testimonialColors[0],
            company: current.company || '',
            message: current.message || '',
            rating: current.rating || 5,
            role: current.role || 'Customer',
            videoUrl: current.videoUrl || '',
          })
        }
      })
      .catch(() => setTestimonial(null))
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function uploadToCloudinary(file, resourceType) {
    if (!env.cloudinaryCloudName || !env.cloudinaryUploadPreset) {
      throw new Error('Cloudinary is not configured. Add the Cloudinary cloud name and upload preset in client .env.')
    }

    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', env.cloudinaryUploadPreset)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/${resourceType}/upload`, {
      method: 'POST',
      body,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'Cloudinary upload failed')
    }
    return data.secure_url
  }

  async function handleMedia(event, field, resourceType) {
    const [file] = Array.from(event.target.files || [])
    if (!file) return

    setUploading(field)
    setError('')
    try {
      const url = await uploadToCloudinary(file, resourceType)
      setForm((current) => ({ ...current, [field]: url }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  async function submitTestimonial(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        company: form.company.trim(),
        message: form.message.trim(),
        rating: Number(form.rating),
        role: form.role.trim() || 'Customer',
      }
      if (testimonial) {
        await api.patch('/testimonials/mine', payload)
      } else {
        await api.post('/testimonials', payload)
      }
      await loadTestimonials()
      setMessage(testimonial ? 'Testimonial updated and sent for admin review.' : 'Testimonial submitted for admin review.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit testimonial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="testimonials-page page-section">
      <div className="testimonial-page-header">
        <div>
          <span className="eyebrow">Customer register</span>
          <h1>Share your store experience</h1>
          <p>Submit a short testimonial for admin review. Approved stories are shown formally on the store homepage.</p>
        </div>
        <div className="testimonial-header-note">
          <ShieldCheck size={18} />
          <span>Reviewed before publishing</span>
        </div>
      </div>
      {message && <p className="form-note">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="testimonial-form-shell">
        <form className="testimonial-write-form" onSubmit={submitTestimonial}>
          <div>
            <span className="eyebrow">Formal note</span>
            <h2><PenLine size={22} /> {testimonial ? 'Edit testimonial' : 'Store testimonial'}</h2>
          </div>

          <div className="testimonial-media-grid">
            <label className="testimonial-upload-tile" htmlFor="testimonial-photo">
              <span>
                {form.avatarUrl ? <img src={form.avatarUrl} alt="Uploaded customer" /> : <Camera size={24} />}
              </span>
              <div>
                <strong>{uploading === 'avatarUrl' ? 'Uploading photo...' : 'Add customer photo'}</strong>
                <small>JPG or PNG</small>
              </div>
              <input
                accept="image/*"
                className="visually-hidden-input"
                id="testimonial-photo"
                onChange={(event) => handleMedia(event, 'avatarUrl', 'image')}
                type="file"
              />
            </label>
            <label className="testimonial-upload-tile" htmlFor="testimonial-video">
              <span>
                <Video size={24} />
              </span>
              <div>
                <strong>{uploading === 'videoUrl' ? 'Uploading video...' : form.videoUrl ? 'Video added' : 'Add short video'}</strong>
                <small>MP4 or WebM</small>
              </div>
              <input
                accept="video/*"
                className="visually-hidden-input"
                id="testimonial-video"
                onChange={(event) => handleMedia(event, 'videoUrl', 'video')}
                type="file"
              />
            </label>
          </div>

          <div className="testimonial-field-grid">
            <label>
              Full name
              <input value={user?.name || ''} readOnly />
            </label>
            <label>
              Rating
              <select name="rating" value={form.rating} onChange={updateField}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
            </label>
            <label>
              Role
              <input name="role" value={form.role} onChange={updateField} placeholder="Contractor, homeowner..." />
            </label>
            <label>
              Company
              <input name="company" value={form.company} onChange={updateField} placeholder="Optional company or project" />
            </label>
          </div>

          <label>
            Your testimonial
            <textarea
              name="message"
              value={form.message}
              onChange={updateField}
              placeholder="Tell us about your buying experience, delivery, material quality, or support."
              required
            />
          </label>

          <div className="testimonial-color-picker" aria-label="Choose testimonial card color">
            <span>Card color</span>
            <div>
              {testimonialColors.map((color, index) => (
                <button
                  aria-label={`Choose color ${index + 1}`}
                  className={form.cardColor === color ? 'active' : ''}
                  key={color}
                  onClick={() => setForm((current) => ({ ...current, cardColor: color }))}
                  style={{ background: color }}
                  type="button"
                />
              ))}
            </div>
          </div>

          <button className="button testimonial-submit-button" disabled={loading || Boolean(uploading)} type="submit">
            {testimonial ? <Save size={18} /> : <Send size={18} />}
            {loading ? 'Saving...' : testimonial ? 'Update testimonial' : 'Submit testimonial'}
          </button>
        </form>

        <aside className="testimonial-live-preview">
          <div
            className="testimonial-preview-card"
            style={{ '--card-ink': getInk(form.cardColor), background: form.cardColor }}
          >
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Customer preview" />
            ) : (
              <span className="testimonial-preview-avatar">{getInitials(user?.name)}</span>
            )}
            <p>"{form.message || 'Your testimonial will appear here as you fill the form.'}"</p>
            <strong>- {user?.name || 'Your Name'}</strong>
            <small>{previewMeta}</small>
            {form.videoUrl && <video controls src={form.videoUrl} title="Testimonial video preview" />}
          </div>
        </aside>
      </div>
    </section>
  )
}
