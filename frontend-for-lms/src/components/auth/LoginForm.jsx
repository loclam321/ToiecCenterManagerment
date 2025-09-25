import { useState } from 'react';
import './css/LoginForm.css';

function LoginForm({ onSubmit, onForgotPassword, isLoading = false }) {
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validate = () => {
    const nextErrors = {};

    if (!validateEmail(formValues.email)) nextErrors.email = 'Email không hợp lệ.';
    if ((formValues.password || '').length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formValues);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group mb-3">
        <label className="form-label text-dark fw-medium" htmlFor="email">Email</label>
        <input
          className="form-control"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formValues.email}
          onChange={handleChange}
        />
        {errors.email && <div className="error-text text-danger small">{errors.email}</div>}
      </div>

      <div className="form-group mb-4">
        <label className="form-label text-dark fw-medium" htmlFor="password">Mật khẩu</label>
        <input
          className="form-control"
          id="password"
          name="password"
          type="password"
          placeholder="••••••"
          value={formValues.password}
          onChange={handleChange}
        />
        {errors.password && <div className="error-text text-danger small">{errors.password}</div>}
        <div className="help-text text-muted small mt-1">Mật khẩu tối thiểu 6 ký tự.</div>
      </div>

      <div className="form-actions-row d-flex justify-content-end mb-3">
        <button
          type="button"
          className="forgot-link btn btn-link text-primary p-0"
          onClick={onForgotPassword}
        >
          Bạn quên mật khẩu?
        </button>
      </div>

      <div className="d-grid">
        <button
          type="submit"
          className="btn btn-primary py-2"
          disabled={isLoading}
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </div>
    </form>
  );
}

export default LoginForm;