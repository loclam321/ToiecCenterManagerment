import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, isAdmin } from '../../services/authService';
import './css/UserMenu.css';

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Resolve avatar from various possible user properties and normalize to web path
  const resolveAvatar = (u) => {
    if (!u) return null;
    const candidates = [
      u.user_avatar,
      u.avatar,
      u.avatarPath,
      u.tch_avtlink,
      u.avatar_url,
      u.user_avatar_url,
      u.avatar_path,
      u.user_avatar_path
    ];
    const raw = candidates.find((c) => c !== undefined && c !== null && String(c).trim() !== '');
    if (!raw) return null;
    if (/^(https?:|data:)/i.test(raw)) return raw;
    let path = String(raw).replace(/\\/g, '/');
    const lower = path.toLowerCase();
    const publicIdx = lower.indexOf('/public/');
    if (publicIdx !== -1) {
      path = path.substring(publicIdx + '/public'.length);
    }
    // Accept both /avatar1/ and /avatar/
    const idx1 = path.toLowerCase().indexOf('/avatar1/');
    const idx2 = path.toLowerCase().indexOf('/avatar/');
    if (idx1 !== -1) path = path.substring(idx1);
    else if (idx2 !== -1) path = path.substring(idx2);
    if (!path.startsWith('/')) path = '/' + path;
    return path;
  };
  const avatarSrc = resolveAvatar(currentUser) || '/avatar/default.svg';

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    console.log('Admin status:', !isAdmin);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="user-avatar">
          <img src={avatarSrc} alt={currentUser?.user_name || 'Người dùng'} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar/default.svg'; }} />
        </div>
      </button>
      
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-info">

            <div className="user-details">
              <div className="user-name">{currentUser?.user_name || 'Người dùng'}</div>
              <div className="user-email">{currentUser?.user_email || ''}</div>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <ul className="dropdown-menu-list">
            <li>
              <button onClick={() => {
                // Close menu then navigate to base section per role
                setIsOpen(false);
                try {
                  if (isAdmin()) {
                    // Admin users -> admin dashboard
                    navigate('/admin');
                    return;
                  }
                } catch (e) {
                  // fall back to role string if helper fails
                }

                const user = getCurrentUser();
                const role = (user?.role || localStorage.getItem('role') || '').toString().toLowerCase();
                if (role === 'student') {
                  navigate('/student');
                } else if (role === 'teacher') {
                  navigate('/teachers');
                } else {
                  navigate('/dashboard');
                }
              }}>
                <i className="bi bi-speedometer2"></i>
                Tổng quan 
              </button>
            </li>
            <li>
              <button onClick={() => {
                const user = getCurrentUser();
                const role = (user?.role || localStorage.getItem('role') || '').toString().toLowerCase();
                if (role === 'student') {
                  navigate('../student/profile');
                } else if (role === 'teacher' || role === 'admin') {
                  navigate('/teacher-profile');
                } else {
                  navigate('/Teacher_intro');
                }
              }}>
                <i className="bi bi-pencil-square"></i>
                Quản lý thông tin 
              </button>
            </li>
            <li className="dropdown-divider"></li>
            <li>
              <button onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i>
                Đăng xuất
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default UserMenu;