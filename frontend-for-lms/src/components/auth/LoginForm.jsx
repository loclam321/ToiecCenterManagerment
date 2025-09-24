import { useState } from 'react';

function LoginForm({ onSubmit, onForgotPassword }) {
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
    <form onSubmit={handleSubmit} noValidate>
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
        {errors.password && <div className="error-text">{errors.password}</div>}
        <div className="help-text">Mật khẩu tối thiểu 6 ký tự.</div>
      </div>

      <div className="form-actions-row">
        <button type="button" className="forgot-link" onClick={onForgotPassword}>
          Bạn quên mật khẩu?
        </button>
      </div>

      <button type="submit" className="submit-btn">
        Đăng nhập
      </button>
    </form>
  );
}

export default LoginForm;