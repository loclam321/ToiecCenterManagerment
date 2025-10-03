import { useState } from 'react';
import AdminSidebar from '../admin/Adminsidebar';
import AdminPageHeader from '../admin/AdminPageHeader';
import './css/AdminLayout.css';

function AdminLayout({ children, title, notificationCount = 0 }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="admin-main">
        <AdminPageHeader title={title} notificationCount={notificationCount} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;