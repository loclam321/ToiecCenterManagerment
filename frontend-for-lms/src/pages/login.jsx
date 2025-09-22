import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './css/login.css'

function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const getModeFromQuery = () => {
    const params = new URLSearchParams(location.search)
    const m = params.get('mode') || 'login'
    return ['login', 'register', 'forgot', 'reset'].includes(m) ? m : 'login'
  }

  const [mode, setMode] = useState(getModeFromQuery()) // 'login' | 'register' | 'forgot' | 'reset'

  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const nextMode = (params.get('mode') || 'login')
    const validMode = ['login', 'register', 'forgot', 'reset'].includes(nextMode) ? nextMode : 'login'
    const notice = params.get('notice')

    setMode(validMode)
    setFormValues({ fullName: '', email: '', password: '', confirmPassword: '' })
    setErrors({})

    if (notice === 'registered') {
      setMessage('Tạo tài khoản thành công. Vui lòng đăng nhập.')
      // Clean the notice param to avoid repeated message on refresh, but keep message
      params.delete('notice')
      navigate({ pathname: '/login', search: params.toString() }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const setUrlMode = (nextMode, extraParams) => {
    const params = new URLSearchParams(location.search)
    params.set('mode', nextMode)
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v === null || typeof v === 'undefined') return
        params.set(k, String(v))
      })
    }
    navigate({ pathname: '/login', search: params.toString() }, { replace: false })
  }

  const resetStateForMode = (nextMode) => {
    setUrlMode(nextMode)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase())
  }

  const validate = () => {
    const nextErrors = {}

    if (mode === 'login') {
      if (!validateEmail(formValues.email)) nextErrors.email = 'Email không hợp lệ.'
      if ((formValues.password || '').length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.'
    }

    if (mode === 'register') {
      if (!formValues.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ tên.'
      if (!validateEmail(formValues.email)) nextErrors.email = 'Email không hợp lệ.'
      if ((formValues.password || '').length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.'
      if (formValues.password !== formValues.confirmPassword) nextErrors.confirmPassword = 'Xác nhận mật khẩu không trùng.'
    }

    if (mode === 'forgot') {
      if (!validateEmail(formValues.email)) nextErrors.email = 'Email không hợp lệ.'
    }

    if (mode === 'reset') {
      if ((formValues.password || '').length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.'
      if (formValues.password !== formValues.confirmPassword) nextErrors.confirmPassword = 'Xác nhận mật khẩu không trùng.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('')
    if (!validate()) return

    if (mode === 'login') setMessage('Đăng nhập thành công (demo).')
    if (mode === 'register') {
      // Reset form and redirect to login with success notice
      setUrlMode('login', { notice: 'registered' })
      return
    }
    if (mode === 'forgot') {
      setMessage('Đã gửi link đặt lại mật khẩu (demo).')
      setUrlMode('reset')
      return
    }
    if (mode === 'reset') setMessage('Đổi mật khẩu thành công (demo).')
  }

  return (
    <div className="auth-page container">
      <div className="auth-wrap">
        <div className="mode-switcher" role="tablist" aria-label="Chọn chế độ">
          <button type="button" className={`switch-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => resetStateForMode('login')}>Đăng nhập</button>
          <button type="button" className={`switch-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => resetStateForMode('register')}>Đăng ký</button>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">
            {mode === 'login' && 'Đăng nhập'}
            {mode === 'register' && 'Đăng ký tài khoản'}
            {mode === 'forgot' && 'Quên mật khẩu'}
            {mode === 'reset' && 'Đặt lại mật khẩu'}
          </h2>

          {message && (
            <div className="alert-success" role="status">{message}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  value={formValues.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && <div className="error-text">{errors.fullName}</div>}
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formValues.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••"
                  value={formValues.password}
                  onChange={handleChange}
                />
                {mode !== 'forgot' && errors.password && <div className="error-text">{errors.password}</div>}
                {mode === 'login' && (
                  <div className="help-text">Mật khẩu tối thiểu 6 ký tự.</div>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="form-actions-row">
                <button type="button" className="forgot-link" onClick={() => resetStateForMode('forgot')}>Bạn quên mật khẩu?</button>
              </div>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
              </div>
            )}

            <button type="submit" className="submit-btn">
              {mode === 'login' && 'Đăng nhập'}
              {mode === 'register' && 'Đăng ký'}
              {mode === 'forgot' && 'Gửi link đặt lại'}
              {mode === 'reset' && 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
