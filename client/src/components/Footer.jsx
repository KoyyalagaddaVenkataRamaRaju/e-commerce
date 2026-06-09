import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Varma Hardware Enterprises</strong>
        <p>Reliable cement, iron, timber, fittings, tools, and trade supply dispatch for site-ready work.</p>
      </div>
      <nav className="footer-nav" aria-label="Footer navigation">
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/testimonials">Leave a testimonial</Link>
      </nav>
      <div className="footer-contact">
        <span>Phone: +91 98765 43210</span>
        <span>Email: orders@varmahardware.in</span>
      </div>
      <div className="footer-contact">
        <span>Local dispatch</span>
        <span>Verified hardware stock</span>
      </div>
    </footer>
  )
}
