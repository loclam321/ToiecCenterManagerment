import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import '../admin/css/Adminsidebar.css';

function StudentSidebar() {
  const location = useLocation();
  const currentUser = getCurrentUser();

  const isActive = (path) => {
    if (path === '/student' && location.pathname === '/student') return true;
    return path !== '/student' && location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: '/student', icon: 'bi bi-grid-1x2', label: 'Tổng quan' },
    { path: '/student/courses', icon: 'bi bi-journal-text', label: 'Khóa học của tôi' },
    { path: '/student/schedule', icon: 'bi bi-calendar3', label: 'Lịch học' },
    { path: '/student/tests', icon: 'bi bi-check2-circle', label: 'Bài kiểm tra' },
    { path: '/student/profile', icon: 'bi bi-person', label: 'Hồ sơ' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="user-section">
        <div className="user-avatar">
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.user_name || 'Student')}&background=22c55e&color=fff`}
            alt="User"
          />
          <span className="status-dot"></span>
        </div>
        <div className="user-details">
          <p className="user-name">{currentUser?.user_name || 'Student'}</p>
          <p className="user-role">Student</p>
        </div>
      </div>

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
