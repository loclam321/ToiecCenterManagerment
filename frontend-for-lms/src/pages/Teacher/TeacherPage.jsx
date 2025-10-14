import { Outlet } from 'react-router-dom';
import ManagementLayout from '../../components/admin/ManagementLayout';

const teacherMenu = [
  {
    path: '/teachers',
    icon: 'bi bi-speedometer2',
    label: 'Dashboard'
  },
  {
    path: '/teachers/schedule',
    icon: 'bi bi-calendar3',
    label: 'Lịch dạy'
  },
  {
    path: '/teachers/classes',
    icon: 'bi bi-people',
    label: 'Lớp phụ trách'
  },
  {
    path: '/teachers/lessons',
    icon: 'bi bi-journal-text',
    label: 'Bài học'
  },
  {
    path: '/teachers/resources',
    icon: 'bi bi-folder',
    label: 'Tài nguyên'
  }
];

const resolveTitle = (pathname) => {
  if (pathname === '/teachers') {
    return 'Tổng quan giảng viên';
  }
  if (pathname.startsWith('/teachers/schedule')) {
    return 'Lịch dạy';
  }
  if (pathname.startsWith('/teachers/classes')) {
    return 'Lớp phụ trách';
  }
  if (pathname.startsWith('/teachers/lessons')) {
    return 'Quản lý bài học';
  }
  if (pathname.startsWith('/teachers/resources')) {
    return 'Tài nguyên giảng dạy';
  }
  return 'Khu vực giảng viên';
};

function TeacherPage() {
  return (
    <ManagementLayout
      menuItems={teacherMenu}
      basePath="/teachers"
      titleResolver={resolveTitle}
      defaultTitle="Khu vực giảng viên"
      roleLabel="TEACHER"
      logoText="Teacher Portal"
      headerProps={{ notificationCount: 0, onNotificationClick: () => {} }}
    >
      <Outlet />
    </ManagementLayout>
  );
}

export default TeacherPage;
