import { useState } from 'react';

function ResetPasswordForm({ onSubmit }) {
  const [formValues, setFormValues] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if ((formValues.password || '').length < 6) nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    if (formValues.password !== formValues.confirmPassword)
      nextErrors.confirmPassword = 'Xác nhận mật khẩu không trùng.';

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
        <label htmlFor="password">Mật khẩu mới</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••"
          value={formValues.password}
          onChange={handleChange}
        />
        {errors.password && <div className="error-text">{errors.password}</div>}
      </div>

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

      <button type="submit" className="submit-btn">
        Đổi mật khẩu
      </button>
    </form>
  );
}

export default ResetPasswordForm;