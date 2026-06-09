import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)

  return (
    <nav className="pagination" aria-label="Pagination">
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)} type="button" aria-label="Previous page">
        <ChevronLeft size={17} />
      </button>
      {pages.map((item) => (
        <button className={page === item ? 'active' : ''} key={item} onClick={() => onPageChange(item)} type="button">
          {item}
        </button>
      ))}
      <button disabled={page === pageCount} onClick={() => onPageChange(page + 1)} type="button" aria-label="Next page">
        <ChevronRight size={17} />
      </button>
    </nav>
  )
}
