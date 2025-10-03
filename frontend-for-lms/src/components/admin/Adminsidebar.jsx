import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import './css/Adminsidebar.css';

function AdminSidebar() {
    const location = useLocation();
    const currentUser = getCurrentUser();

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') {
            return true;
        }
        if (path !== '/admin' && location.pathname.startsWith(path)) {
            return true;
        }
        return false;
    };

    const menuItems = [
        {
            path: '/admin',
            icon: 'bi bi-grid-1x2',
            label: 'Dashboard'
        },
        {
            path: '/admin/schedule',
            icon: 'bi bi-calendar3',
            label: 'Thời khóa biểu'
        },
        {
            path: '/admin/classes',
            icon: 'bi bi-people',
            label: 'Lớp học'
        },
        {
            path: '/admin/courses',
            icon: 'bi bi-book',
            label: 'Khóa học'
        },
        {
            path: '/admin/students',
            icon: 'bi bi-person-badge',
            label: 'Học viên'
        },
        {
            path: '/admin/teachers',
            icon: 'bi bi-person-workspace',
            label: 'Giáo viên'
        },
        {
            path: '/admin/downloads',
            icon: 'bi bi-file-earmark-text',
            label: 'Tài liệu'
        },
        {
            path: '/admin/settings',
            icon: 'bi bi-gear',
            label: 'Cài đặt'
        }
    ];

    return (
        <aside className="admin-sidebar">

            {/* User Info */}
            <div className="user-section">
                <div className="user-avatar">
                    <img
                        src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.user_name || 'Admin')}&background=667eea&color=fff`}
                        alt="User"
                    />
                    <span className="status-dot"></span>
                </div>
                <div className="user-details">
                    <p className="user-name">{currentUser?.user_name || 'Admin'}</p>
                    <p className="user-role">Administrator</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <ul className="nav-menu">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            >
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout */}
            <div className="sidebar-footer">
                <Link to="/logout" className="logout-btn">
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Đăng xuất</span>
                </Link>
            </div>
        </aside>
    );
}

export default AdminSidebar;