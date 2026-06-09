import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const registerInitial = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  emailCode: '',
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    forgotPassword,
    login,
    register,
    requestRegistrationOtp,
    resetPassword,
  } = useAuth()
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState(registerInitial)
  const [forgotForm, setForgotForm] = useState({ email: '', code: '', password: '' })
  const [registerOtpSent, setRegisterOtpSent] = useState(false)
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [message, setMessage] = useState(location.state?.message || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const from = location.state?.from?.pathname || '/'

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  function updateLogin(event) {
    setLoginForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateRegister(event) {
    setRegisterForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateForgot(event) {
    setForgotForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(loginForm)
      navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterOtp(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await requestRegistrationOtp({
        email: registerForm.email,
        phone: registerForm.phone,
      })
      setRegisterOtpSent(true)
      setMessage('OTP sent. Check your email, then enter the code.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
        emailCode: registerForm.emailCode,
      })
      navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotOtp(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await forgotPassword({ email: forgotForm.email })
      setForgotOtpSent(true)
      setMessage('If the email exists, a password reset OTP has been sent.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send password reset OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(forgotForm)
      setForgotOtpSent(false)
      setForgotForm({ email: '', code: '', password: '' })
      setMode('login')
      setMessage('Password updated. Sign in with your new password.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page page-section">
      <div className="auth-card">
        <span className="eyebrow">Customer access</span>
        <h1>{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Reset password'}</h1>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} type="button">
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} type="button">
            Register
          </button>
          <button className={mode === 'forgot' ? 'active' : ''} onClick={() => switchMode('forgot')} type="button">
            Forgot
          </button>
        </div>
        {message && <p className="form-note">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        {mode === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input name="email" type="email" value={loginForm.email} onChange={updateLogin} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={loginForm.password} onChange={updateLogin} placeholder="Password" required />
            </label>
            <button className="button" disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form className="auth-form" onSubmit={registerOtpSent ? handleRegister : handleRegisterOtp}>
            <label>
              Full name
              <input name="name" value={registerForm.name} onChange={updateRegister} placeholder="Customer name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={registerForm.email} onChange={updateRegister} placeholder="you@example.com" required />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" value={registerForm.phone} onChange={updateRegister} placeholder="+91 98765 43210" required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={registerForm.password} onChange={updateRegister} placeholder="Minimum 6 characters" required />
            </label>
            <label>
              Confirm password
              <input name="confirmPassword" type="password" value={registerForm.confirmPassword} onChange={updateRegister} placeholder="Repeat password" required />
            </label>
            {registerOtpSent && (
              <label>
                Email OTP
                <input name="emailCode" inputMode="numeric" value={registerForm.emailCode} onChange={updateRegister} placeholder="6 digit code" required />
              </label>
            )}
            <button className="button" disabled={loading} type="submit">
              {loading ? 'Please wait...' : registerOtpSent ? 'Verify and register' : 'Send email OTP'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="auth-form" onSubmit={forgotOtpSent ? handleResetPassword : handleForgotOtp}>
            <label>
              Email
              <input name="email" type="email" value={forgotForm.email} onChange={updateForgot} placeholder="you@example.com" required />
            </label>
            {forgotOtpSent && (
              <>
                <label>
                  Reset OTP
                  <input name="code" inputMode="numeric" value={forgotForm.code} onChange={updateForgot} placeholder="6 digit code" required />
                </label>
                <label>
                  New password
                  <input name="password" type="password" value={forgotForm.password} onChange={updateForgot} placeholder="New password" required />
                </label>
              </>
            )}
            <button className="button" disabled={loading} type="submit">
              {loading ? 'Please wait...' : forgotOtpSent ? 'Reset password' : 'Send reset OTP'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
