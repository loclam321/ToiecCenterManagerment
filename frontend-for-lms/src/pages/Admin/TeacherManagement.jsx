import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeacherTable from '../../components/admin/TeacherTable';
import TeacherFilters from '../../components/admin/TeacherFilters';
import { getTeachers, mapTeacherFromApi } from '../../services/teacherService';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './css/TeacherManagement.css';

function TeacherManagement() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    specialization: 'all',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  useEffect(() => {
    fetchTeachers();
  }, [filters, pagination.currentPage]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const sortOptions = getSortOptions(filters.sortBy);

      const options = {
        page: pagination.currentPage,
        perPage: pagination.itemsPerPage,
        search: filters.search,
        sortBy: sortOptions.field,
        sortOrder: sortOptions.order,
        status: filters.status !== 'all' ? filters.status : ''
      };

      const result = await getTeachers(options);

      const mappedTeachers = result.teachers.map(teacher => mapTeacherFromApi(teacher));

      setTeachers(mappedTeachers);
      setPagination({
        currentPage: result.pagination.page,
        totalPages: result.pagination.pages,
        itemsPerPage: result.pagination.per_page,
        totalItems: result.pagination.total
      });
    } catch (error) {
      console.error('Error fetching teachers:', error);
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
        return { field: 'experience', order: 'asc' };
      case 'experience_desc':
        return { field: 'experience', order: 'desc' };
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
      currentPage: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
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