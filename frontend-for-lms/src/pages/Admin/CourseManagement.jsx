import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getCourses, getStatusBadgeClass, getStatusText, getLevelText, formatCurrency, formatDate } from '../../services/courseService';
import { toast } from 'react-toastify';
import './css/CourseManagement.css';

function CourseManagement() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        level: '',
        mode: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 10,
        totalItems: 0
    });

    useEffect(() => {
        fetchCourses();
    }, [filters, pagination.currentPage]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const options = {
                page: pagination.currentPage,
                perPage: pagination.itemsPerPage,
                search: filters.search,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                status: filters.status,
                level: filters.level,
                mode: filters.mode
            };

            const result = await getCourses(options);

            setCourses(result.courses);
            setPagination({
                currentPage: result.pagination.page,
                totalPages: result.pagination.pages,
                itemsPerPage: result.pagination.per_page,
                totalItems: result.pagination.total
            });
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Không thể tải danh sách khóa học');
        } finally {
            setLoading(false);
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

    const handleSortChange = (sortOption) => {
        setFilters(prev => ({
            ...prev,
            sortBy: sortOption.field,
            sortOrder: sortOption.order
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

    const getSelectedSort = () => {
        const { sortBy, sortOrder } = filters;
        if (sortBy === 'created_at' && sortOrder === 'desc') return 'newest';
        if (sortBy === 'created_at' && sortOrder === 'asc') return 'oldest';
        if (sortBy === 'course_name' && sortOrder === 'asc') return 'name_asc';
        if (sortBy === 'course_name' && sortOrder === 'desc') return 'name_desc';
        if (sortBy === 'tuition_fee' && sortOrder === 'asc') return 'price_asc';
        if (sortBy === 'tuition_fee' && sortOrder === 'desc') return 'price_desc';
        if (sortBy === 'start_date' && sortOrder === 'asc') return 'date_asc';
        return 'newest';
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="DANH SÁCH KHÓA HỌC"
                    itemCount={pagination.totalItems}
                    itemName="khóa học"
                    addButtonText="THÊM KHÓA HỌC"
                    addButtonLink="/admin/courses/add"
                    notificationCount={3}
                />

                <div className="admin-content">
                    <div className="course-management">
                        <div className="content-filters">
                            <div className="filter-group">
                                <div className="search-box">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm khóa học..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>

                                <div className="filter-controls">
                                    <select
                                        value={filters.level}
                                        onChange={(e) => handleFilterChange('level', e.target.value)}
                                    >
                                        <option value="">Tất cả trình độ</option>
                                        <option value="BEGINNER">Cơ bản</option>
                                        <option value="INTERMEDIATE">Trung cấp</option>
                                        <option value="ADVANCED">Nâng cao</option>
                                    </select>

                                    <select
                                        value={filters.mode}
                                        onChange={(e) => handleFilterChange('mode', e.target.value)}
                                    >
                                        <option value="">Tất cả hình thức</option>
                                        <option value="ONLINE">Online</option>
                                        <option value="OFFLINE">Offline</option>
                                        <option value="HYBRID">Hybrid</option>
                                    </select>

                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="OPEN">Đang mở</option>
                                        <option value="CLOSED">Đã đóng</option>
                                        <option value="UPCOMING">Sắp mở</option>
                                        <option value="COMPLETED">Đã kết thúc</option>
                                    </select>

                                    <select
                                        value={getSelectedSort()}
                                        onChange={(e) => {
                                            switch (e.target.value) {
                                                case 'newest':
                                                    handleSortChange({ field: 'created_at', order: 'desc' });
                                                    break;
                                                case 'oldest':
                                                    handleSortChange({ field: 'created_at', order: 'asc' });
                                                    break;
                                                case 'name_asc':
                                                    handleSortChange({ field: 'course_name', order: 'asc' });
                                                    break;
                                                case 'name_desc':
                                                    handleSortChange({ field: 'course_name', order: 'desc' });
                                                    break;
                                                case 'price_asc':
                                                    handleSortChange({ field: 'tuition_fee', order: 'asc' });
                                                    break;
                                                case 'price_desc':
                                                    handleSortChange({ field: 'tuition_fee', order: 'desc' });
                                                    break;
                                                case 'date_asc':
                                                    handleSortChange({ field: 'start_date', order: 'asc' });
                                                    break;
                                                default:
                                                    handleSortChange({ field: 'created_at', order: 'desc' });
                                            }
                                        }}
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="oldest">Cũ nhất</option>
                                        <option value="name_asc">Tên A-Z</option>
                                        <option value="name_desc">Tên Z-A</option>
                                        <option value="price_asc">Học phí tăng dần</option>
                                        <option value="price_desc">Học phí giảm dần</option>
                                        <option value="date_asc">Ngày khai giảng gần nhất</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="content-table">
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Đang tải dữ liệu...</p>
                                </div>
                            ) : courses.length > 0 ? (
                                <>
                                    <div className="table-responsive">
                                        <table className="course-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã khóa học</th>
                                                    <th>Tên khóa học</th>
                                                    <th>Trình độ</th>
                                                    <th>Hình thức</th>
                                                    <th>Lịch học</th>
                                                    <th>Thời gian</th>
                                                    <th>Học phí</th>
                                                    <th>Trạng thái</th>
                                                    <th>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courses.map(course => (
                                                    <tr key={course.course_id}>
                                                        <td>{course.course_code}</td>
                                                        <td>
                                                            <div className="course-name">
                                                                <span className="primary-text">{course.course_name}</span>
                                                                <span className="secondary-text">{course.course_description}</span>
                                                            </div>
                                                        </td>
                                                        <td>{getLevelText(course.level)}</td>
                                                        <td>{course.mode}</td>
                                                        <td>{course.schedule_text}</td>
                                                        <td>
                                                            <div className="date-range">
                                                                <div>{formatDate(course.start_date)}</div>
                                                                <div>→</div>
                                                                <div>{formatDate(course.end_date)}</div>
                                                            </div>
                                                        </td>
                                                        <td>{formatCurrency(course.tuition_fee)}</td>
                                                        <td>
                                                            <span className={`status-badge ${getStatusBadgeClass(course.course_status)}`}>
                                                                {getStatusText(course.course_status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <Link to={`/admin/courses/${course.course_id}`} className="btn-icon" title="Xem chi tiết">
                                                                    <i className="bi bi-eye"></i>
                                                                </Link>
                                                                <Link to={`/admin/courses/${course.course_id}/edit`} className="btn-icon" title="Chỉnh sửa">
                                                                    <i className="bi bi-pencil"></i>
                                                                </Link>
                                                                <button
                                                                    className="btn-icon text-danger"
                                                                    title="Xóa"
                                                                    onClick={() => {
                                                                        if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
                                                                            // Gọi API xóa
                                                                            console.log(`Delete course ${course.course_id}`);
                                                                        }
                                                                    }}
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

                                    <div className="pagination">
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={pagination.currentPage === 1}
                                            className="page-button"
                                        >
                                            <i className="bi bi-chevron-double-left"></i>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="page-button"
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>

                                        <div className="page-info">
                                            Trang {pagination.currentPage} / {pagination.totalPages}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="page-button"
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.totalPages)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="page-button"
                                        >
                                            <i className="bi bi-chevron-double-right"></i>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <i className="bi bi-journal-x"></i>
                                    </div>
                                    <h3>Không tìm thấy khóa học nào</h3>
                                    <p>Không có khóa học nào phù hợp với tiêu chí tìm kiếm.</p>
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => {
                                            setFilters({
                                                search: '',
                                                status: '',
                                                level: '',
                                                mode: '',
                                                sortBy: 'created_at',
                                                sortOrder: 'desc'
                                            });
                                        }}
                                    >
                                        <i className="bi bi-arrow-repeat"></i> Đặt lại bộ lọc
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

export default CourseManagement;