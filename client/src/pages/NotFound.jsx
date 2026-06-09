import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="empty-state page-section">
      <h1>Page not found</h1>
      <Link to="/" className="button">Back home</Link>
    </section>
  )
}
