import { useCallback, useMemo, useState } from 'react'
import api from '../services/api'
import { AuthContext } from './AuthStore'

function getStoredUser() {
  try {
    const value = localStorage.getItem('user')
    return value ? JSON.parse(value) : null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)

  const saveSession = useCallback((payload) => {
    localStorage.setItem('token', payload.token)
    localStorage.setItem('user', JSON.stringify(payload.user))
    setUser(payload.user)
    return payload.user
  }, [])

  const login = useCallback(
    async (credentials) => {
      const { data } = await api.post('/auth/login', credentials)
      return saveSession(data)
    },
    [saveSession],
  )

  const register = useCallback(
    async (form) => {
      const { data } = await api.post('/auth/register', form)
      return saveSession(data)
    },
    [saveSession],
  )

  const requestRegistrationOtp = useCallback(async (form) => {
    const { data } = await api.post('/auth/register/request-otp', form)
    return data
  }, [])

  const forgotPassword = useCallback(async (form) => {
    const { data } = await api.post('/auth/forgot-password', form)
    return data
  }, [])

  const resetPassword = useCallback(async (form) => {
    const { data } = await api.post('/auth/reset-password', form)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      logout,
      forgotPassword,
      requestRegistrationOtp,
      register,
      resetPassword,
      user,
    }),
    [forgotPassword, login, logout, register, requestRegistrationOtp, resetPassword, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
