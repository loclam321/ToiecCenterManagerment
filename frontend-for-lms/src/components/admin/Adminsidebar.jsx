import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import './css/Adminsidebar.css';

const defaultMenuItems = [
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

function AdminSidebar({
    collapsed = false,
    toggleSidebar,
    menuItems: customMenuItems,
    roleLabel,
    profilePath
}) {
    const location = useLocation();
    const currentUser = getCurrentUser();
    const menuItems = (customMenuItems && customMenuItems.length > 0) ? customMenuItems : defaultMenuItems;

    const resolveAvatar = (user) => {
        if (!user) {
            return null;
        }
        const candidates = [
            user.user_avatar,
            user.avatar_url,
            user.avatar,
            user.profile_image,
            user.image_url,
            user.user_avtlink,
            user.sd_avtlink,
            user.avatar_path,
            user.user_image
        ];
        const found = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
        if (!found) {
            return null;
        }
        const normalized = found.trim();
        if (/^data:/.test(normalized) || /^https?:\/\//.test(normalized) || normalized.startsWith('/')) {
            return normalized;
        }
        return `/${normalized}`;
    };
    const avatarSrc = resolveAvatar(currentUser) || '/avatar/default.png';

    const normalize = (value) => {
        if (!value) {
            return '';
        }
        return value.endsWith('/') && value !== '/' ? value.slice(0, -1) : value;
    };

    const isActive = (path) => {
        const currentPath = normalize(location.pathname);
        const targetPath = normalize(path);
        if (!targetPath) {
            return false;
        }
        if (currentPath === targetPath) {
            return true;
        }
        return currentPath.startsWith(`${targetPath}/`);
    };

    const displayRole = roleLabel || (localStorage.getItem('role') || 'admin').toString().toUpperCase();

    const UserWrapper = profilePath ? Link : 'div';
    const userSectionProps = profilePath
        ? {
            to: profilePath,
            role: 'button',
            style: { textDecoration: 'none', color: 'inherit', display: 'block' }
        }
        : {};

    return (
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>

            <UserWrapper
                className="user-section"
                {...userSectionProps}
            >
                <div className="user-banner" aria-hidden="true" />
                <div className="user-meta">
                    <div className="user-avatar large">
                        <img
                            src={avatarSrc}
                            alt={currentUser?.user_name || 'User'}
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = '/avatar/1.jpg';
                            }}
                        />
                        <span className="status-dot"></span>
                    </div>
                    <div className="user-details">
                        <p className="user-name mb-1">{currentUser?.user_name || 'User'}</p>
                        <p className="user-role text-uppercase">{displayRole}</p>
                    </div>
                </div>
            </UserWrapper>

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

            <div className="sidebar-footer">
                <Link to="/logout" className="logout-btn">
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Đăng xuất</span>
                </Link>
            </div>
        </aside>
    );
}

AdminSidebar.propTypes = {
    collapsed: PropTypes.bool,
    toggleSidebar: PropTypes.func,
    menuItems: PropTypes.arrayOf(
        PropTypes.shape({
            path: PropTypes.string.isRequired,
            icon: PropTypes.string,
            label: PropTypes.string.isRequired
        })
    ),
    roleLabel: PropTypes.string,
    profilePath: PropTypes.string
};

export default AdminSidebar;