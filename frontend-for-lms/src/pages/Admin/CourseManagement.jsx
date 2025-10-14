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
    const [viewMode, setViewMode] = useState('table'); // 'table' hoặc 'grid'
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        level: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 10,
        totalItems: 0
    });
    const [selectedCourses, setSelectedCourses] = useState([]);

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
                level: filters.level
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

    const handleSelectCourse = (courseId) => {
        setSelectedCourses(prev => {
            if (prev.includes(courseId)) {
                return prev.filter(id => id !== courseId);
            }
            return [...prev, courseId];
        });
    };

    const handleSelectAll = () => {
        if (selectedCourses.length === courses.length) {
            setSelectedCourses([]);
        } else {
            setSelectedCourses(courses.map(c => c.course_id));
        }
    };

    const handleDeleteSelected = () => {
        if (selectedCourses.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một khóa học');
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCourses.length} khóa học đã chọn?`)) {
            console.log('Delete courses:', selectedCourses);
            toast.success(`Đã xóa ${selectedCourses.length} khóa học`);
            setSelectedCourses([]);
        }
    };

    const handleDeleteCourse = (courseId, courseName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${courseName}"?`)) {
            console.log(`Delete course ${courseId}`);
            toast.success('Đã xóa khóa học thành công');
        }
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            status: '',
            level: '',
            sortBy: 'created_at',
            sortOrder: 'desc'
        });
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    };

    const hasActiveFilters = () => {
        return filters.search || filters.status || filters.level;
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="QUẢN LÝ KHÓA HỌC"
                    subtitle={`Quản lý và theo dõi ${pagination.totalItems} khóa học`}
                    actions={[
                        {
                            type: 'button',
                            text: 'Thêm khóa học',
                            icon: 'bi bi-plus-circle',
                            variant: 'primary',
                            onClick: () => window.location.href = '/admin/courses/add'
                        },
                        {
                            type: 'button',
                            text: 'Xuất Excel',
                            icon: 'bi bi-file-earmark-excel',
                            variant: 'success',
                            onClick: () => toast.info('Chức năng xuất Excel')
                        }
                    ]}
                />

                <div className="admin-content">
                    <div className="course-management">
                        {/* Filter Section */}
                        <div className="filters-section">
                            <div className="filters-header">
                                <h3 className="filters-title">
                                    <i className="bi bi-funnel"></i>
                                    Bộ lọc
                                </h3>
                                {hasActiveFilters() && (
                                    <button className="reset-filters-btn" onClick={resetFilters}>
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                        Đặt lại
                                    </button>
                                )}
                            </div>

                            <div className="filters-row">
                                <div className="filter-item search-filter">
                                    <div className="search-input-wrapper">
                                        <i className="bi bi-search search-icon"></i>
                                        <input
                                            type="text"
                                            placeholder="Tìm khóa học..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                        {filters.search && (
                                            <button
                                                className="clear-search"
                                                onClick={() => handleFilterChange('search', '')}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="filter-item">
                                    <select
                                        value={filters.level}
                                        onChange={(e) => handleFilterChange('level', e.target.value)}
                                    >
                                        <option value="">Trình độ</option>
                                        <option value="BEGINNER">Cơ bản</option>
                                        <option value="INTERMEDIATE">Trung cấp</option>
                                        <option value="ADVANCED">Nâng cao</option>
                                    </select>
                                </div>

                                <div className="filter-item">
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">Trạng thái</option>
                                        <option value="OPEN">Đang mở</option>
                                        <option value="CLOSED">Đã đóng</option>
                                        <option value="UPCOMING">Sắp mở</option>
                                        <option value="COMPLETED">Đã kết thúc</option>
                                    </select>
                                </div>

                                <div className="filter-item">
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
                                        <option value="newest">Sắp xếp: Mới nhất</option>
                                        <option value="oldest">Sắp xếp: Cũ nhất</option>
                                        <option value="name_asc">Sắp xếp: A-Z</option>
                                        <option value="name_desc">Sắp xếp: Z-A</option>
                                        <option value="price_asc">Sắp xếp: Giá tăng</option>
                                        <option value="price_desc">Sắp xếp: Giá giảm</option>
                                        <option value="date_asc">Sắp xếp: Ngày gần</option>
                                    </select>
                                </div>

                                {hasActiveFilters() && (
                                    <button className="filter-reset-btn" onClick={resetFilters}>
                                        <i className="bi bi-x-circle"></i> Xóa lọc
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="content-toolbar">
                            <div className="toolbar-left">
                                <div className="view-mode-toggle">
                                    <button
                                        className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                        onClick={() => setViewMode('table')}
                                        title="Xem dạng bảng"
                                    >
                                        <i className="bi bi-list-ul"></i>
                                    </button>
                                    <button
                                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Xem dạng lưới"
                                    >
                                        <i className="bi bi-grid-3x3-gap"></i>
                                    </button>
                                </div>

                                {selectedCourses.length > 0 && (
                                    <div className="bulk-actions">
                                        <span className="selected-count">
                                            Đã chọn {selectedCourses.length} khóa học
                                        </span>
                                        <button
                                            className="btn-bulk-delete"
                                            onClick={handleDeleteSelected}
                                        >
                                            <i className="bi bi-trash"></i>
                                            Xóa đã chọn
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="toolbar-right">
                                <span className="result-count">
                                    Hiển thị {courses.length} / {pagination.totalItems} khóa học
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="content-body">
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Đang tải dữ liệu...</p>
                                </div>
                            ) : courses.length > 0 ? (
                                <>
                                    {viewMode === 'table' ? (
                                        <div className="table-view">
                                            <div className="table-responsive">
                                                <table className="course-table">
                                                    <thead>
                                                        <tr>
                                                            <th className="checkbox-cell">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCourses.length === courses.length}
                                                                    onChange={handleSelectAll}
                                                                />
                                                            </th>
                                                            <th>Mã khóa học</th>
                                                            <th>Thông tin khóa học</th>
                                                            <th>Trình độ</th>
                                                            <th>Lịch học</th>
                                                            <th>Thời gian</th>
                                                            <th>Học phí</th>
                                                            <th>Trạng thái</th>
                                                            <th>Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {courses.map(course => (
                                                            <tr key={course.course_id} className={selectedCourses.includes(course.course_id) ? 'selected' : ''}>
                                                                <td className="checkbox-cell">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedCourses.includes(course.course_id)}
                                                                        onChange={() => handleSelectCourse(course.course_id)}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <span className="course-code">{course.course_code}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="course-info">
                                                                        <div className="course-name">{course.course_name}</div>
                                                                        <div className="course-desc">{course.course_description}</div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="level-badge">{getLevelText(course.level)}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="schedule-info">
                                                                        <i className="bi bi-calendar-week"></i>
                                                                        {course.schedule_text}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="date-range">
                                                                        <span>{formatDate(course.start_date)}</span>
                                                                        <i className="bi bi-arrow-right"></i>
                                                                        <span>{formatDate(course.end_date)}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="tuition-fee">{formatCurrency(course.tuition_fee)}</span>
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${getStatusBadgeClass(course.course_status)}`}>
                                                                        {getStatusText(course.course_status)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div className="action-buttons">
                                                                        <Link
                                                                            to={`/admin/courses/${course.course_id}`}
                                                                            className="btn-action view"
                                                                            title="Xem chi tiết"
                                                                        >
                                                                            <i className="bi bi-eye"></i>
                                                                        </Link>
                                                                        <Link
                                                                            to={`/admin/courses/${course.course_id}/edit`}
                                                                            className="btn-action edit"
                                                                            title="Chỉnh sửa"
                                                                        >
                                                                            <i className="bi bi-pencil"></i>
                                                                        </Link>
                                                                        <button
                                                                            className="btn-action delete"
                                                                            title="Xóa"
                                                                            onClick={() => handleDeleteCourse(course.course_id, course.course_name)}
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
                                        </div>
                                    ) : (
                                        <div className="grid-view">
                                            {courses.map(course => (
                                                <div key={course.course_id} className={`course-card ${selectedCourses.includes(course.course_id) ? 'selected' : ''}`}>
                                                    <div className="card-header">
                                                        <input
                                                            type="checkbox"
                                                            className="card-checkbox"
                                                            checked={selectedCourses.includes(course.course_id)}
                                                            onChange={() => handleSelectCourse(course.course_id)}
                                                        />
                                                        <span className={`status-badge ${getStatusBadgeClass(course.course_status)}`}>
                                                            {getStatusText(course.course_status)}
                                                        </span>
                                                    </div>

                                                    <div className="card-body">
                                                        <div className="course-code-badge">{course.course_code}</div>
                                                        <h3 className="course-title">{course.course_name}</h3>
                                                        <p className="course-description">{course.course_description}</p>

                                                        <div className="course-meta">
                                                            <div className="meta-item">
                                                                <i className="bi bi-bar-chart-steps"></i>
                                                                <span>{getLevelText(course.level)}</span>
                                                            </div>
                                                            <div className="meta-item">
                                                                <i className="bi bi-calendar-week"></i>
                                                                <span>{course.schedule_text}</span>
                                                            </div>
                                                        </div>

                                                        <div className="course-dates">
                                                            <div className="date-item">
                                                                <i className="bi bi-calendar-check"></i>
                                                                <span>{formatDate(course.start_date)}</span>
                                                            </div>
                                                            <i className="bi bi-arrow-right"></i>
                                                            <div className="date-item">
                                                                <i className="bi bi-calendar-x"></i>
                                                                <span>{formatDate(course.end_date)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="course-price">
                                                            <span className="price-label">Học phí:</span>
                                                            <span className="price-value">{formatCurrency(course.tuition_fee)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="card-footer">
                                                        <Link
                                                            to={`/admin/courses/${course.course_id}`}
                                                            className="btn-card view"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                            Chi tiết
                                                        </Link>
                                                        <Link
                                                            to={`/admin/courses/${course.course_id}/edit`}
                                                            className="btn-card edit"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                            Sửa
                                                        </Link>
                                                        <button
                                                            className="btn-card delete"
                                                            onClick={() => handleDeleteCourse(course.course_id, course.course_name)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    <div className="pagination-wrapper">
                                        <div className="pagination">
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                disabled={pagination.currentPage === 1}
                                                className="page-button first"
                                            >
                                                <i className="bi bi-chevron-double-left"></i>
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage === 1}
                                                className="page-button prev"
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </button>

                                            <div className="page-info">
                                                <span className="current-page">{pagination.currentPage}</span>
                                                <span className="separator">/</span>
                                                <span className="total-pages">{pagination.totalPages}</span>
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                disabled={pagination.currentPage === pagination.totalPages}
                                                className="page-button next"
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(pagination.totalPages)}
                                                disabled={pagination.currentPage === pagination.totalPages}
                                                className="page-button last"
                                            >
                                                <i className="bi bi-chevron-double-right"></i>
                                            </button>
                                        </div>

                                        <div className="items-per-page">
                                            <label>Hiển thị:</label>
                                            <select
                                                value={pagination.itemsPerPage}
                                                onChange={(e) => setPagination(prev => ({
                                                    ...prev,
                                                    itemsPerPage: parseInt(e.target.value),
                                                    currentPage: 1
                                                }))}
                                            >
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                                <option value="20">20</option>
                                                <option value="50">50</option>
                                            </select>
                                            <span>khóa học/trang</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <i className="bi bi-inbox"></i>
                                    </div>
                                    <h3>Không tìm thấy khóa học nào</h3>
                                    <p>
                                        {hasActiveFilters()
                                            ? 'Không có khóa học nào phù hợp với tiêu chí lọc.'
                                            : 'Chưa có khóa học nào trong hệ thống.'
                                        }
                                    </p>
                                    {hasActiveFilters() && (
                                        <button
                                            className="btn-reset"
                                            onClick={resetFilters}
                                        >
                                            <i className="bi bi-arrow-counterclockwise"></i>
                                            Đặt lại bộ lọc
                                        </button>
                                    )}
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