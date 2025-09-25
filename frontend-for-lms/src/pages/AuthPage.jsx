import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/login.css';

// Import các form components
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

// Import services
import { registerStudent, loginUser, isAuthenticated, forgotPassword, resetPassword } from '../services/authService';

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(getModeFromQuery());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function getModeFromQuery() {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode') || 'login';

    // Xử lý đặc biệt cho trường hợp mode=reset/TOKEN
    if (modeParam.startsWith('reset/')) {
      return 'reset';
    }

    return ['login', 'register', 'forgot', 'reset'].includes(modeParam) ? modeParam : 'login';
  }

  useEffect(() => {
    // Nếu đã đăng nhập thì chuyển hướng về trang chính
    if (isAuthenticated()) {
      navigate('/');
      return;
    }

    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode') || 'login';

    // Xác định mode thực tế
    let validMode;
    if (modeParam.startsWith('reset/')) {
      validMode = 'reset';
    } else {
      validMode = ['login', 'register', 'forgot', 'reset'].includes(modeParam) ? modeParam : 'login';
    }

    const notice = params.get('notice');

    setMode(validMode);
    setMessage('');
    setError('');

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

  const handleLoginSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await loginUser(formData);

      // Hiển thị thông báo thành công
      setMessage(result.message || 'Đăng nhập thành công');

      // Chuyển hướng người dùng dựa vào role
      const role = localStorage.getItem('role');
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/'); // Mặc định cho học viên
        }
      }, 1000);
    } catch (err) {
      console.error('Đăng nhập thất bại:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Gọi service đăng ký
      const result = await registerStudent(formData);

      if (result.success) {
        // Đăng ký thành công
        setUrlMode('login', { notice: 'registered' });
      } else {
        throw new Error(result.message || 'Đăng ký thất bại vì lý do không xác định');
      }
    } catch (err) {
      console.error('Đăng ký thất bại:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await forgotPassword(formData);

      // Thông báo chung có thể hiển thị bất kể email có tồn tại hay không
      // để không tiết lộ thông tin về tài khoản đã đăng ký
      setMessage('Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu sẽ được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu đặt lại mật khẩu:', err);
      // Có thể hiển thị thông báo chung giống trường hợp thành công để bảo mật
      setMessage('Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu sẽ được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await resetPassword(formData);

      if (result.success) {
        setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
        // Chuyển về trang đăng nhập sau 2 giây
        setTimeout(() => {
          setUrlMode('login');
        }, 2000);
      } else {
        throw new Error(result.message || 'Đặt lại mật khẩu thất bại vì lý do không xác định');
      }
    } catch (err) {
      console.error('Lỗi khi đặt lại mật khẩu:', err);
      setError(err.message || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setUrlMode('forgot');
  };

  const renderForm = () => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode') || '';

    // Trích xuất token từ query param khi ở chế độ reset
    let resetToken = '';
    if (modeParam.startsWith('reset/')) {
      resetToken = modeParam.substring(6); // Cắt phần "reset/" khỏi giá trị
    }

    switch (mode) {
      case 'login':
        return <LoginForm onSubmit={handleLoginSubmit} onForgotPassword={handleForgotPasswordClick} isLoading={isLoading} />;
      case 'register':
        return <RegisterForm onSubmit={handleRegisterSubmit} isLoading={isLoading} />;
      case 'forgot':
        return <ForgotPasswordForm onSubmit={handleForgotSubmit} isLoading={isLoading} />;
      case 'reset':
        return <ResetPasswordForm onSubmit={handleResetSubmit} isLoading={isLoading} token={resetToken} />;
      default:
        return <LoginForm onSubmit={handleLoginSubmit} onForgotPassword={handleForgotPasswordClick} isLoading={isLoading} />;
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

          {message && <div className="alert alert-success" role="status">{message}</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {renderForm()}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
