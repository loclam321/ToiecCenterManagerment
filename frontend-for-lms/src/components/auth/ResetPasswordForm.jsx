import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './css/AuthForms.css';

function ResetPasswordForm({ onSubmit, isLoading = false }) {
  const [formValues, setFormValues] = useState({
    password: '',
    confirmPassword: '',
    token: ''
  });
  const [errors, setErrors] = useState({});
  const location = useLocation();
  console.log(formValues.token);

  // Trích xuất token từ URL khi component mount
  useEffect(() => {
    // Lấy token từ mode=reset/TOKEN hoặc từ path
    const extractToken = () => {
      const searchParams = new URLSearchParams(location.search);
      const modeParam = searchParams.get('mode') || '';

      if (modeParam.startsWith('reset/')) {
        return modeParam.substring(6); // Cắt "reset/"
      }

      // Kiểm tra nếu token nằm trong pathname (sau /reset-password/)
      const pathMatch = location.pathname.match(/\/reset-password\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
      }

      return '';
    };

    const token = extractToken();
    if (token) {
      setFormValues(prev => ({ ...prev, token }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if ((formValues.password || '').length < 6) {
      nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    }

    if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Xác nhận mật khẩu không trùng.';
    }

    if (!formValues.token) {
      nextErrors.token = 'Token đặt lại mật khẩu không hợp lệ.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Gửi dữ liệu theo định dạng API yêu cầu
    onSubmit({
      new_password: formValues.password,
      token: formValues.token
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {!formValues.token && (
        <div className="alert alert-warning mb-3">
          Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link đặt lại mật khẩu mới.
        </div>
      )}

      <div className="form-group mb-3">
        <label className="form-label text-dark fw-medium" htmlFor="password">Mật khẩu mới</label>
        <input
          className="form-control"
          id="password"
          name="password"
          type="password"
          placeholder="••••••"
          value={formValues.password}
          onChange={handleChange}
        />
        {errors.password && <div className="error-text text-danger small mt-1">{errors.password}</div>}
        <div className="help-text text-muted small mt-1">Mật khẩu tối thiểu 6 ký tự.</div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label text-dark fw-medium" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
        <input
          className="form-control"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={formValues.confirmPassword}
          onChange={handleChange}
        />
        {errors.confirmPassword && <div className="error-text text-danger small mt-1">{errors.confirmPassword}</div>}
      </div>

      <div className="d-grid">
        <button
          type="submit"
          className="btn btn-primary py-2"
          disabled={isLoading || !formValues.token}
        >
          {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </div>
    </form>
  );
}

export default ResetPasswordForm;