import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import './css/Adminsidebar.css';

function AdminSidebar({ collapsed, toggleSidebar }) {
    const location = useLocation();
    const currentUser = getCurrentUser();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-profile">
                <div className="user-avatar">
                    {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.user_name || 'Admin'} />
                    ) : (
                        <img src="https://ui-avatars.com/api/?name=Admin&background=8A77FB&color=fff" alt="Admin" />
                    )}
                </div>
                {!collapsed && (
                    <div className="user-info">
                        <div className="user-name">{currentUser?.user_name || 'Admin'}</div>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    <li className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                        <Link to="/admin" className="nav-link">
                            <i className="bi bi-grid-1x2"></i>
                            {!collapsed && <span>Dashboard</span>}
                        </Link>
                    </li>

                    <li className={`nav-item ${isActive('/admin/classes') ? 'active' : ''}`}>
                        <Link to="/admin/classes" className="nav-link">
                            <i className="bi bi-calendar3"></i>
                            {!collapsed && <span>Lớp học</span>}
                        </Link>
                    </li>

                    <li className={`nav-item ${isActive('/admin/groups') ? 'active' : ''}`}>
                        <Link to="/admin/courses" className="nav-link">
                            <i className="bi bi-people"></i>
                            {!collapsed && <span>Khóa học</span>}
                        </Link>
                    </li>

                    <li className={`nav-item ${isActive('/admin/students') ? 'active' : ''}`}>
                        <Link to="/admin/students" className="nav-link">
                            <i className="bi bi-mortarboard"></i>
                            {!collapsed && <span>Học viên</span>}
                        </Link>
                    </li>

                    <li className={`nav-item ${isActive('/admin/teachers') ? 'active' : ''}`}>
                        <Link to="/admin/teachers" className="nav-link">
                            <i className="bi bi-person-workspace"></i>
                            {!collapsed && <span>Giáo viên</span>}
                        </Link>
                    </li>

    

                    <li className={`nav-item ${isActive('/admin/downloads') ? 'active' : ''}`}>
                        <Link to="/admin/downloads" className="nav-link">
                            <i className="bi bi-cloud-download"></i>
                            {!collapsed && <span>Tài liệu</span>}
                        </Link>
                    </li>


                    <li className="nav-item">
                        <Link to="/logout" className="nav-link">
                            <i className="bi bi-box-arrow-right"></i>
                            {!collapsed && <span>Đăng xuất</span>}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default AdminSidebar;