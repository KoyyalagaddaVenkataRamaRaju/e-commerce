import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, PenLine, Quote } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/useAuth'

const fallbackPalette = ['#8a5a36', '#2f4f3f', '#f59e0b', '#06b6d4', '#f97316', '#a855f7', '#fffaf0', '#22c55e']

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

export default function TestimonialSpotlight() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [testimonials, setTestimonials] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let ignore = false
    api.get('/testimonials')
      .then(({ data }) => {
        if (!ignore) setTestimonials(data)
      })
      .catch(() => {
        if (!ignore) setTestimonials([])
      })
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (testimonials.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length)
    }, 6200)
    return () => window.clearInterval(timer)
  }, [testimonials.length])

  if (location.pathname !== '/') {
    return null
  }

  function move(step, event) {
    event?.stopPropagation()
    setActive((current) => (current + step + testimonials.length) % testimonials.length)
  }

  function getOffset(index) {
    const total = testimonials.length
    let offset = index - active
    if (offset > total / 2) offset -= total
    if (offset < total / -2) offset += total
    return offset
  }

  return (
    <section className="testimonial-footer-section" aria-label="Customer testimonials">
      {testimonials.length > 0 && (
        <div className="testimonial-stack-wrap">
          <div className="testimonial-stack-heading">
            <span className="eyebrow">Customer voice</span>
            <h2>Stories from real buyers</h2>
          </div>
          <div className="testimonial-stack">
            {testimonials.map((testimonial, index) => {
              const offset = getOffset(index)
              const visible = Math.abs(offset) <= 8
              const color = testimonial.cardColor || fallbackPalette[index % fallbackPalette.length]
              const ink = getInk(color)
              return (
                <article
                  className={`testimonial-stack-card ${offset === 0 ? 'active' : ''}`}
                  key={testimonial._id}
                  onClick={() => setActive(index)}
                  style={{
                    '--card-ink': ink,
                    '--card-x': `${offset * 243}px`,
                    '--card-y': offset === 0 ? '0px' : `${offset % 2 === 0 ? 15 : -15}px`,
                    '--card-rotate': offset === 0 ? '0deg' : `${offset > 0 ? 2.5 : -2.5}deg`,
                    background: color,
                    opacity: visible ? 1 : 0,
                    pointerEvents: visible ? 'auto' : 'none',
                    zIndex: offset === 0 ? 30 : Math.max(1, 16 - Math.abs(offset)),
                  }}
                >
                  <div className="testimonial-stack-body">
                    {testimonial.avatarUrl ? (
                      <img src={testimonial.avatarUrl} alt={testimonial.name} />
                    ) : (
                      <span className="testimonial-initials">{getInitials(testimonial.name)}</span>
                    )}
                    <p>"{testimonial.message}"</p>
                    <strong>- {testimonial.name}{testimonial.role ? `, ${testimonial.role}` : ''}</strong>
                  </div>
                </article>
              )
            })}
            {testimonials.length > 1 && (
              <div className="testimonial-stack-controls">
                <button aria-label="Previous testimonial" onClick={(event) => move(-1, event)} type="button">
                  <ArrowLeft size={28} />
                </button>
                <button aria-label="Next testimonial" onClick={(event) => move(1, event)} type="button">
                  <ArrowRight size={28} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="testimonial-write-band">
        <div>
          <Quote size={34} />
          <span className="eyebrow">Store testimonial</span>
          <h2>Tell us how Varma Hardware helped your work.</h2>
          <p>Your testimonial appears after admin review, separate from product reviews.</p>
        </div>
        <Link to="/testimonials" className="button testimonial-write-link">
          <PenLine size={18} />
          {isAuthenticated ? 'Write a testimonial' : 'Login to write'}
        </Link>
      </div>
    </section>
  )
}
