import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/authService';
import './css/UserMenu.css';

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

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
          <i className="bi bi-person-circle"></i>
        </div>
      </button>
      
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-avatar-lg">
              <i className="bi bi-person-circle"></i>
            </div>
            <div className="user-details">
              <div className="user-name">{currentUser?.user_name || 'Người dùng'}</div>
              <div className="user-email">{currentUser?.user_email || ''}</div>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <ul className="dropdown-menu-list">
            <li>
              <button onClick={() => navigate('/dashboard')}>
                <i className="bi bi-speedometer2"></i>
                Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/profile')}>
                <i className="bi bi-person"></i>
                Hồ sơ của tôi
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