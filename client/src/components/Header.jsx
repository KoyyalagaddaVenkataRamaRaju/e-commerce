import { Link, NavLink } from 'react-router-dom'
import { LogOut, Menu, ShoppingBag, Store, UserRound } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { env } from '../config/env'

export default function Header() {
  const { totals } = useCart()
  const { isAdmin, isAuthenticated, logout, user } = useAuth()

  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Varma Hardware home">
        <Store size={26} />
        <span>{env.appName}</span>
      </Link>
      <nav className="primary-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        {isAuthenticated && <NavLink to="/orders">Orders</NavLink>}
        {isAdmin && <NavLink to="/admin/dashboard">Admin</NavLink>}
      </nav>
      <div className="header-actions">
        {isAuthenticated ? (
          <>
            <span className="user-chip"><UserRound size={16} /> {user.name}</span>
            <button className="icon-button" onClick={logout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link to="/login" className="login-link">Login</Link>
        )}
        <Link to="/cart" className="icon-button" aria-label="Open cart">
          <ShoppingBag size={19} />
          <span>{totals.count}</span>
        </Link>
        <button className="icon-button menu-button" aria-label="Open menu">
          <Menu size={19} />
        </button>
      </div>
    </header>
  )
}
