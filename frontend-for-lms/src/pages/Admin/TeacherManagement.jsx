import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeacherTable from '../../components/admin/TeacherTable';
import TeacherFilters from '../../components/admin/TeacherFilters';
import { getTeachers } from '../../services/teacherService';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './css/TeacherManagement.css';

function TeacherManagement() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  console.log('Teachers state:', teachers);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    specialization: 'all',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    per_page: 10,
    total: 0
  });

  useEffect(() => {
    fetchTeachers();
  }, [filters, pagination.page]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const sortOptions = getSortOptions(filters.sortBy);

      const options = {
        page: pagination.page,
        perPage: pagination.per_page,
        search: filters.search,
        sortBy: sortOptions.field,
        sortOrder: sortOptions.order,
        status: filters.status !== 'all' ? filters.status : ''
      };

      const result = await getTeachers(options);

      // Xử lý response API mới
      if (result.success && result.data) {
        setTeachers(result.data.teachers || []);
        setPagination(result.data.pagination || {
          page: 1,
          total_pages: 1,
          per_page: 10,
          total: 0
        });
      } else {
        console.error('API response format error:', result);
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const getSortOptions = (sortBy) => {
    switch (sortBy) {
      case 'newest':
        return { field: 'created_at', order: 'desc' };
      case 'oldest':
        return { field: 'created_at', order: 'asc' };
      case 'name_asc':
        return { field: 'user_name', order: 'asc' };
      case 'name_desc':
        return { field: 'user_name', order: 'desc' };
      case 'experience_asc':
        return { field: 'tch_hire_date', order: 'desc' }; // Sắp xếp theo ngày thuê
      case 'experience_desc':
        return { field: 'tch_hire_date', order: 'asc' };
      default:
        return { field: '', order: '' };
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminPageHeader
          title="Quản lý giáo viên"
          notificationCount={3}
          onNotificationClick={() => console.log('Notifications')}
        />

        <div className="admin-content">
          <div className="teacher-management">
            <div className="content-header">
              <h1 className="page-title">Danh sách giáo viên</h1>
              <Link to="/admin/teachers/add" className="btn-primary">
                <i className="bi bi-plus-lg"></i>
                <span>Thêm giáo viên mới</span>
              </Link>
            </div>

            <div className="content-filters">
              <TeacherFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="content-table">
              <TeacherTable
                teachers={teachers}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherManagement;