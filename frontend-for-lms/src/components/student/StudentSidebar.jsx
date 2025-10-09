import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import '../admin/css/Adminsidebar.css';

function StudentSidebar() {
  const location = useLocation();
  const currentUser = getCurrentUser();

  // Resolve avatar from system user data with safe fallbacks (align with Profile/Admin/Teacher logic)
  const resolveAvatar = (u) => {
    if (!u) return null;
    const candidates = [
      u.user_avatar,
      u.avatar_url,
      u.avatar,
      u.profile_image,
      u.image_url,
      u.user_avtlink,
      u.sd_avtlink,
      u.avatar_path,
      u.user_image
    ];
    const found = candidates.find((c) => typeof c === 'string' && c.trim().length > 0);
    if (!found) return null;
    const val = found.toString().trim();
    if (/^data:/.test(val) || /^https?:\/\//.test(val) || val.startsWith('/')) return val;
    return `/${val}`; // ensure root-relative if backend returns a relative path (served from public/)
  };
  const avatarSrc = resolveAvatar(currentUser) || '/avatar/default.png';

  const isActive = (path) => {
    if (path === '/student' && location.pathname === '/student') return true;
    return path !== '/student' && location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: '/student', icon: 'bi bi-grid-1x2', label: 'Tổng quan' },
    { path: '/student/courses', icon: 'bi bi-journal-text', label: 'Khóa học của tôi' },
    { path: '/student/schedule', icon: 'bi bi-calendar3', label: 'Lịch học' },
    { path: '/student/tests', icon: 'bi bi-check2-circle', label: 'Bài kiểm tra' },
    // Hồ sơ sẽ được truy cập bằng cách click vào user-section phía trên, không còn là nav item nữa
  ];

  return (
    <aside className="admin-sidebar">
      <Link
        to="/student/profile"
        className="user-section"
        role="button"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <div
          className="user-banner"
          aria-hidden="true"
        />
        <div className="user-meta">
          <div className="user-avatar large">
            <img
              src={avatarSrc}
              alt={currentUser?.user_name || 'Student'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                // Fallback to local default avatar in public/avatar
                e.currentTarget.src = '/avatar/1.jpg';
              }}
            />
            <span className="status-dot"></span>
          </div>
          <div className="user-details">
            <p className="user-name mb-1">{currentUser?.user_name || 'Student'}</p>
            <p className="user-role text-uppercase">Student</p>
          </div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link to="/logout" className="logout-btn">
          <i className="bi bi-box-arrow-right"></i>
          <span>Đăng xuất</span>
        </Link>
      </div>
    </aside>
  );
}

export default StudentSidebar;
