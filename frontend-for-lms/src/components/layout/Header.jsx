import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { fetchCoursesSummary } from '../../services/courseService';
import { isAuthenticated } from '../../services/authService';
import UserMenu from './UserMenu';
import logo from '../../assets/logo.png';
import './css/Header.css';

function Header() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const [showPaths, setShowPaths] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (showPaths && courses.length === 0 && !loading) {
      (async () => {
        try {
          setLoading(true);
          setError(null);
          const list = await fetchCoursesSummary();
          setCourses(list);
        } catch (e) {
          setError(e.message || 'Không thể tải danh sách khóa học');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [showPaths, courses.length, loading]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPaths && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPaths(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPaths]);

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
            <div
              className={`nav-link nav-dropdown ${showPaths ? 'open' : ''}`}
              ref={dropdownRef}
              role="button"
              tabIndex={0}
              onClick={() => setShowPaths((v) => !v)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPaths((v) => !v); } }}
            >
              Lộ trình học
              {showPaths && (
                <div className="dropdown-panel">
                  <div className="dropdown-body">
                    {loading && <div className="dropdown-loading">Đang tải...</div>}
                    {error && <div className="dropdown-error">{error}</div>}
                    {!loading && !error && courses.length === 0 && (
                      <div className="dropdown-empty">Chưa có khóa học</div>
                    )}
                    {!loading && !error && courses.length > 0 && (
                      <ul className="dropdown-list">
                        {courses.map((c) => (
                          <li key={c.course_id} className="dropdown-item" onClick={() => { setShowPaths(false); navigate(`/courses/${c.course_id}`); }}>
                            <div className="course-name">{c.course_name}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <a href="/teachers" className="nav-link">Giảng viên</a>
            <a href="/facility" className="nav-link">Cơ sở vật chất</a>
            <a href="/test" className="nav-link">Kiểm tra đầu vào</a>
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