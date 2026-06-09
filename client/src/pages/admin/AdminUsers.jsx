import { useEffect, useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import api from '../../services/api'

const PAGE_SIZE = 6

function formatMoney(value = 0) {
  return `Rs. ${value.toLocaleString('en-IN')}`
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Could not load users.'))
  }, [])

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return users
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role].some((field) => field?.toLowerCase().includes(value)),
    )
  }, [query, users])

  const pagedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredUsers, page],
  )

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <span className="eyebrow">Customers</span>
        <h1>Users and orders</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-panel users-toolbar">
        <label>
          Search users
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Name, email, phone, role"
          />
        </label>
      </div>
      <div className="admin-users-grid">
        {pagedUsers.map((user) => (
          <article className="user-card" key={user._id}>
            <div className="user-card-head">
              <div>
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>
              <span className={user.isEmailVerified ? 'verified-badge' : 'status-pill pending'}>
                {user.isEmailVerified ? 'verified' : 'pending'}
              </span>
            </div>
            <div className="user-contact">
              <span>{user.email}</span>
              <span>{user.phone}</span>
            </div>
            <div className="user-stats">
              <div><span>Orders</span><strong>{user.orderCount}</strong></div>
              <div><span>Total spent</span><strong>{formatMoney(user.totalSpent)}</strong></div>
            </div>
            <div className="user-detail-block">
              <h3>Saved addresses</h3>
              {user.savedAddresses?.length ? (
                user.savedAddresses.slice(0, 2).map((address) => (
                  <p key={address._id}>{address.line1}, {address.city} - {address.pincode}</p>
                ))
              ) : (
                <p>No saved address.</p>
              )}
            </div>
            <div className="user-detail-block">
              <h3>Last order</h3>
              {user.lastOrder ? (
                <p>#{user.lastOrder._id.slice(-8).toUpperCase()} · {user.lastOrder.status} · {formatMoney(user.lastOrder.total)}</p>
              ) : (
                <p>No orders yet.</p>
              )}
            </div>
          </article>
        ))}
        {filteredUsers.length === 0 && <div className="empty-state">No users found.</div>}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredUsers.length} onPageChange={setPage} />
    </section>
  )
}
