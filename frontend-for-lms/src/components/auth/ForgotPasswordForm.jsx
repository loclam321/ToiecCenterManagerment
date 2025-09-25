import { useState } from 'react';
import './css/AuthForms.css';

function ForgotPasswordForm({ onSubmit, isLoading = false }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validate = () => {
    if (!validateEmail(email)) {
      setError('Email không hợp lệ.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ email });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group mb-4">
        <label className="form-label text-dark fw-medium" htmlFor="email">Email</label>
        <input
          className="form-control"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <div className="error-text text-danger small mt-1">{error}</div>}
        <div className="help-text text-muted small mt-1">
          Nhập email bạn đã dùng để đăng ký tài khoản. Chúng tôi sẽ gửi link đặt lại mật khẩu qua email này.
        </div>
      </div>

      <div className="d-grid">
        <button
          type="submit"
          className="btn btn-primary py-2"
          disabled={isLoading}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </button>
      </div>
    </form>
  );
}

export default ForgotPasswordForm;