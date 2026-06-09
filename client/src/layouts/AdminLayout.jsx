import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Boxes, ClipboardList, Gauge, Home, LogOut, MessageSquareQuote, PackagePlus, Store, UsersRound } from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <NavLink to="/" className="brand admin-brand">
            <Store size={24} />
            <span>Varma Hardware</span>
          </NavLink>
          <NavLink to="/" className="admin-store-link">
            <Home size={17} /> Storefront
          </NavLink>
          <nav>
            <NavLink to="/admin/dashboard">
              <Gauge size={18} /> Dashboard
            </NavLink>
            <NavLink to="/admin/products/add">
              <PackagePlus size={18} /> Add Product
            </NavLink>
            <NavLink to="/admin/products/manage">
              <Boxes size={18} /> Manage Products
            </NavLink>
            <NavLink to="/admin/orders">
              <ClipboardList size={18} /> Orders
            </NavLink>
            <NavLink to="/admin/users">
              <UsersRound size={18} /> Users
            </NavLink>
            <NavLink to="/admin/testimonials">
              <MessageSquareQuote size={18} /> Testimonials
            </NavLink>
          </nav>
        </div>
        <button className="admin-logout-button" onClick={handleLogout} type="button">
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
