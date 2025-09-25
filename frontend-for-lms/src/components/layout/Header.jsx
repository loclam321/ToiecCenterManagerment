import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';
import UserMenu from './UserMenu';
import logo from '../../assets/logo.png';
import './css/Header.css';

function Header() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo + Brand */}
          <a href="/" className="brand">
            <img src={logo} alt="TOEIC Center" className="brand-logo" />
            <div className="brand-text">
              <span className="brand-title">Hệ Thống Quản Lý</span>
              <span className="brand-subtitle">Trung Tâm TOEIC</span>
            </div>
          </a>

          {/* Navigation */}
          <nav className="header-nav">
            <a href="/" className="nav-link">Trang chủ</a>
            <a href="/students" className="nav-link">Lộ trình học</a>
            <a href="/teachers" className="nav-link">Khóa học</a>
            <a href="/courses" className="nav-link">Giáo viên</a>
            <a href="/exams" className="nav-link">Kiểm tra đầu vào</a>
          </nav>

          {/* CTA Buttons or User Menu */}
          {authenticated ? (
            <UserMenu />
          ) : (
            <div className="header-actions">
              <button className="btn-login" onClick={() => navigate('/login?mode=login')}>Đăng nhập</button>
              <button className="btn-cta" onClick={() => navigate('/login?mode=register')}>ĐĂNG KÝ NGAY</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;