import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/login.css';

// Import các form components
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(getModeFromQuery());
  const [message, setMessage] = useState('');

  function getModeFromQuery() {
    const params = new URLSearchParams(location.search);
    const m = params.get('mode') || 'login';
    return ['login', 'register', 'forgot', 'reset'].includes(m) ? m : 'login';
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextMode = params.get('mode') || 'login';
    const validMode = ['login', 'register', 'forgot', 'reset'].includes(nextMode) ? nextMode : 'login';
    const notice = params.get('notice');

    setMode(validMode);
    setMessage('');

    if (notice === 'registered') {
      setMessage('Tạo tài khoản thành công. Vui lòng đăng nhập.');
      // Clean the notice param to avoid repeated message on refresh, but keep message
      params.delete('notice');
      navigate({ pathname: '/login', search: params.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const setUrlMode = (nextMode, extraParams) => {
    const params = new URLSearchParams(location.search);
    params.set('mode', nextMode);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v === null || typeof v === 'undefined') return;
        params.set(k, String(v));
      });
    }
    navigate({ pathname: '/login', search: params.toString() }, { replace: false });
  };

  const handleLoginSubmit = (formData) => {
    setMessage('Đăng nhập thành công (demo).');
    // Xử lý login logic ở đây
  };

  const handleRegisterSubmit = (formData) => {
    // Xử lý register logic ở đây
    setUrlMode('login', { notice: 'registered' });
  };

  const handleForgotSubmit = (formData) => {
    setMessage('Đã gửi link đặt lại mật khẩu (demo).');
    setUrlMode('reset');
  };

  const handleResetSubmit = (formData) => {
    setMessage('Đổi mật khẩu thành công (demo).');
    // Xử lý reset password logic ở đây
  };

  const handleForgotPasswordClick = () => {
    setUrlMode('forgot');
  };

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return <LoginForm onSubmit={handleLoginSubmit} onForgotPassword={handleForgotPasswordClick} />;
      case 'register':
        return <RegisterForm onSubmit={handleRegisterSubmit} />;
      case 'forgot':
        return <ForgotPasswordForm onSubmit={handleForgotSubmit} />;
      case 'reset':
        return <ResetPasswordForm onSubmit={handleResetSubmit} />;
      default:
        return <LoginForm onSubmit={handleLoginSubmit} onForgotPassword={handleForgotPasswordClick} />;
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-wrap">
        <div className="mode-switcher" role="tablist" aria-label="Chọn chế độ">
          <button
            type="button"
            className={`switch-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setUrlMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`switch-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setUrlMode('register')}
          >
            Đăng ký
          </button>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">
            {mode === 'login' && 'Đăng nhập'}
            {mode === 'register' && 'Đăng ký tài khoản'}
            {mode === 'forgot' && 'Quên mật khẩu'}
            {mode === 'reset' && 'Đặt lại mật khẩu'}
          </h2>

          {message && <div className="alert-success" role="status">{message}</div>}

          {renderForm()}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
