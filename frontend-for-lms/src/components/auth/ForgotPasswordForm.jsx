import { useState } from 'react';

function ForgotPasswordForm({ onSubmit }) {
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
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <div className="error-text">{error}</div>}
      </div>

      <button type="submit" className="submit-btn">
        Gửi link đặt lại
      </button>
    </form>
  );
}

export default ForgotPasswordForm;