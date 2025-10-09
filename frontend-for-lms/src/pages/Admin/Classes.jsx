import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { 
  getAllClasses, 
  deleteClass, 
  getClassStatusBadgeClass, 
  getClassStatusText
} from '../../services/classService';
import { getCourses } from '../../services/courseService';
import './css/Classes.css';

function Classes() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
        per_page: 10
    });
    const [filters, setFilters] = useState({
        search: '',
        course_id: '',
        status: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    useEffect(() => {
        fetchCourses();
        fetchClasses();
    }, [pagination.page, filters]);

    const fetchCourses = async () => {
        try {
            const response = await getCourses();
            if (response && response.data) {
                setCourses(response.data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                per_page: pagination.per_page,
                search: filters.search,
                course_id: filters.course_id,
                status: filters.status,
                sort_by: filters.sort_by,
                sort_order: filters.sort_order
            };
            
            const response = await getAllClasses(params);
            if (response.success && response.data) {
                setClasses(response.data);
                setPagination(response.pagination);
            } else {
                toast.error('Không thể tải danh sách lớp học');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Đã xảy ra lỗi khi tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPagination(prev => ({
            ...prev,
            page: 1
        }));
    };

    const handleSort = (field) => {
        setFilters(prev => {
            if (prev.sort_by === field) {
                return {
                    ...prev,
                    sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc'
                };
            } else {
                return {
                    ...prev,
                    sort_by: field,
                    sort_order: 'asc'
                };
            }
        });
    };

    const handleChangePage = (newPage) => {
        setPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const handleDeleteClass = async (classId, className) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"?`)) {
            try {
                await deleteClass(classId);
                toast.success('Đã xóa lớp học thành công');
                fetchClasses();
            } catch (error) {
                console.error('Error deleting class:', error);
                toast.error('Không thể xóa lớp học');
            }
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClasses();
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            course_id: '',
            status: '',
            sort_by: 'created_at',
            sort_order: 'desc'
        });
    };

    const renderSortIcon = (field) => {
        if (filters.sort_by !== field) return <i className="bi bi-arrow-down-up text-muted"></i>;
        return filters.sort_order === 'asc' 
            ? <i className="bi bi-sort-down"></i> 
            : <i className="bi bi-sort-up"></i>;
    };

    const getCourseName = (courseId) => {
        const course = courses.find(c => c.course_id === courseId);
        return course ? course.course_name : 'N/A';
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="QUẢN LÝ LỚP HỌC"
                    subtitle="Xem và quản lý tất cả các lớp học trong hệ thống"
                    actions={[
                        {
                            type: 'link',
                            text: 'Thêm lớp học',
                            icon: 'fas fa-plus',
                            variant: 'primary',
                            to: '/admin/courses'
                        }
                    ]}
                />

                <div className="admin-content">
                    <div className="classes-container">
                        <div className="filter-section">
                            <form onSubmit={handleSearch}>
                                <div className="filter-row">
                                    <div className="filter-group">
                                        <input
                                            type="text"
                                            name="search"
                                            value={filters.search}
                                            onChange={handleFilterChange}
                                            placeholder="Tìm theo tên lớp..."
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <select
                                            name="course_id"
                                            value={filters.course_id}
                                            onChange={handleFilterChange}
                                            className="form-control"
                                        >
                                            <option value="">Tất cả khóa học</option>
                                            {courses.map(course => (
                                                <option key={course.course_id} value={course.course_id}>
                                                    {course.course_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <select
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                            className="form-control"
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="ACTIVE">Đang diễn ra</option>
                                            <option value="UPCOMING">Sắp khai giảng</option>
                                            <option value="COMPLETED">Đã kết thúc</option>
                                            <option value="CANCELLED">Đã hủy</option>
                                            <option value="INACTIVE">Tạm ngưng</option>
                                        </select>
                                    </div>
                                    <div className="filter-actions">
                                        <button type="submit" className="btn btn-primary">
                                            <i className="bi bi-search"></i> Tìm kiếm
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={resetFilters}>
                                            <i className="bi bi-x-circle"></i> Xóa bộ lọc
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="class-list-section">
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Đang tải danh sách lớp học...</p>
                                </div>
                            ) : classes.length > 0 ? (
                                <>
                                    <div className="table-responsive">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th onClick={() => handleSort('class_id')}>
                                                        Mã lớp {renderSortIcon('class_id')}
                                                    </th>
                                                    <th onClick={() => handleSort('class_name')}>
                                                        Tên lớp {renderSortIcon('class_name')}
                                                    </th>
                                                    <th>Khóa học</th>
                                                    <th onClick={() => handleSort('class_startdate')}>
                                                        Thời gian {renderSortIcon('class_startdate')}
                                                    </th>
                                                    <th onClick={() => handleSort('class_currentenrollment')}>
                                                        Sĩ số {renderSortIcon('class_currentenrollment')}
                                                    </th>
                                                    <th>Trạng thái</th>
                                                    <th>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {classes.map(classItem => (
                                                    <tr key={classItem.class_id}>
                                                        <td>{classItem.class_id}</td>
                                                        <td className="class-name-cell">
                                                            <Link to={`/admin/classes/${classItem.class_id}`}>
                                                                {classItem.class_name}
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            <Link to={`/admin/courses/${classItem.course_id}`}>
                                                                {classItem.course_name || getCourseName(classItem.course_id)}
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            <div className="date-range">
                                                                <div>{new Date(classItem.class_startdate).toLocaleDateString('vi-VN')}</div>
                                                                <div>→</div>
                                                                <div>{new Date(classItem.class_enddate).toLocaleDateString('vi-VN')}</div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="enrollment-count">
                                                                {classItem.class_currentenrollment}/{classItem.class_maxstudents}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${getClassStatusBadgeClass(classItem.class_status)}`}>
                                                                {getClassStatusText(classItem.class_status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <Link to={`/admin/classes/${classItem.class_id}`} className="btn-icon" title="Xem chi tiết">
                                                                    <i className="bi bi-eye"></i>
                                                                </Link>
                                                                <Link to={`/admin/classes/${classItem.class_id}/edit`} className="btn-icon" title="Chỉnh sửa">
                                                                    <i className="bi bi-pencil"></i>
                                                                </Link>
                                                                <button
                                                                    className="btn-icon text-danger"
                                                                    title="Xóa lớp"
                                                                    onClick={() => handleDeleteClass(classItem.class_id, classItem.class_name)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {pagination.pages > 1 && (
                                        <div className="pagination-container">
                                            <button 
                                                className="pagination-button"
                                                disabled={!pagination.has_prev}
                                                onClick={() => handleChangePage(pagination.page - 1)}
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                            <span className="pagination-info">
                                                Trang {pagination.page} / {pagination.pages}
                                            </span>
                                            <button 
                                                className="pagination-button"
                                                disabled={!pagination.has_next}
                                                onClick={() => handleChangePage(pagination.page + 1)}
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <i className="bi bi-grid-3x3-gap"></i>
                                    </div>
                                    <h3>Không tìm thấy lớp học nào</h3>
                                    <p>Không có lớp học nào phù hợp với tiêu chí tìm kiếm.</p>
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={resetFilters}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Classes;