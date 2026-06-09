import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Clock, MessageSquareQuote, XCircle } from 'lucide-react'
import Pagination from '../../components/Pagination'
import api from '../../services/api'

const filters = ['pending', 'approved', 'rejected', 'all']
const PAGE_SIZE = 6

function getInitials(name = 'Customer') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VH'
}

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [filter, setFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTestimonials()
  }, [])

  const visibleTestimonials = useMemo(
    () => testimonials.filter((testimonial) => filter === 'all' || testimonial.status === filter),
    [filter, testimonials],
  )

  const pagedTestimonials = useMemo(
    () => visibleTestimonials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, visibleTestimonials],
  )

  function getCount(status) {
    if (status === 'all') return testimonials.length
    return testimonials.filter((testimonial) => testimonial.status === status).length
  }

  function loadTestimonials() {
    api.get('/testimonials/admin')
      .then(({ data }) => setTestimonials(data))
      .catch(() => setError('Could not load testimonials.'))
  }

  async function updateStatus(id, status) {
    setError('')
    try {
      const { data } = await api.patch(`/testimonials/${id}/status`, { status })
      setTestimonials((current) => current.map((item) => (item._id === id ? data : item)))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update testimonial.')
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-heading admin-heading-row">
        <div>
          <span className="eyebrow">Social proof</span>
          <h1>Testimonials</h1>
        </div>
        <div className="admin-review-stat">
          <Clock size={18} />
          <strong>{getCount('pending')}</strong>
          <span>need review</span>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}

      <div className="testimonial-filter-bar">
        {filters.map((item) => (
          <button
            className={filter === item ? 'active' : ''}
            key={item}
            onClick={() => {
              setFilter(item)
              setPage(1)
            }}
            type="button"
          >
            {item} <span>{getCount(item)}</span>
          </button>
        ))}
      </div>

      <div className="testimonial-admin-grid">
        {pagedTestimonials.map((testimonial) => (
          <article
            className="testimonial-admin-card admin-testimonial-review-card"
            key={testimonial._id}
            style={{ borderTopColor: testimonial.cardColor || '#f59e0b' }}
          >
            <div className="testimonial-card-head">
              {testimonial.avatarUrl ? (
                <img src={testimonial.avatarUrl} alt={testimonial.name} />
              ) : (
                <span>{getInitials(testimonial.name)}</span>
              )}
              <div>
                <strong>{testimonial.name}</strong>
                <small>{[testimonial.role, testimonial.company].filter(Boolean).join(', ') || 'Customer'} - {testimonial.rating}/5</small>
              </div>
            </div>
            <p>{testimonial.message}</p>
            {testimonial.videoUrl && <video controls src={testimonial.videoUrl} title={`${testimonial.name} testimonial video`} />}
            <span className={`status-pill ${testimonial.status}`}>{testimonial.status}</span>
            <div className="order-actions testimonial-review-actions">
              <button onClick={() => updateStatus(testimonial._id, 'approved')} type="button">
                <CheckCircle size={16} /> Approve
              </button>
              <button onClick={() => updateStatus(testimonial._id, 'rejected')} type="button">
                <XCircle size={16} /> Reject
              </button>
            </div>
          </article>
        ))}
        {visibleTestimonials.length === 0 && (
          <div className="empty-state">
            <MessageSquareQuote size={28} />
            No {filter === 'all' ? '' : filter} testimonials.
          </div>
        )}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={visibleTestimonials.length} onPageChange={setPage} />
    </section>
  )
}
