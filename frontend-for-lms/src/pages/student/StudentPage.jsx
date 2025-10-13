import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StudentSidebar from '../../components/student/StudentSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import '../Admin/css/Adminpage.css';

function StudentPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/student') return 'Tổng quan';
  if (path.startsWith('/student/courses')) return 'Khóa học của tôi';
  if (path.startsWith('/student/lessons')) return 'Bài học hàng tuần';
  if (path.startsWith('/student/schedule')) return 'Lịch học';
  if (path.startsWith('/student/tests')) return 'Bài kiểm tra';
    if (path.startsWith('/student/profile')) return 'Hồ sơ cá nhân';
    return 'Khu vực học viên';
  };

  return (
    <div className="admin-layout">
      <StudentSidebar collapsed={sidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminPageHeader title={getPageTitle()} notificationCount={0} onNotificationClick={() => {}} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default StudentPage;
