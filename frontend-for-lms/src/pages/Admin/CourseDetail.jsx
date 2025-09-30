import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getCourseById, deleteCourse, getStatusBadgeClass, getStatusText, getLevelText, formatCurrency, formatDate } from '../../services/courseService';
import './css/CourseDetail.css';

function CourseDetail() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [classes, setClasses] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const response = await getCourseById(id);
            setCourse(response);
            console.log("Dữ liệu khóa học:", response);

            // Mock data cho các lớp học thuộc khóa học này
            setClasses([
                {
                    id: 'L001',
                    className: 'TOEIC300-01-SG',
                    teacher: 'Nguyễn Văn Giảng',
                    teacherId: 'GV001',
                    schedule: 'T2-4-6 18:00-20:00',
                    location: 'Cơ sở 1 - Phòng 305',
                    startDate: '2025-02-15',
                    endDate: '2025-05-15',
                    enrolledCount: 25,
                    capacity: 30,
                    status: 'active'
                },
                {
                    id: 'L002',
                    className: 'TOEIC300-02-HN',
                    teacher: 'Trần Thị Hướng',
                    teacherId: 'GV005',
                    schedule: 'T3-5-7 19:00-21:00',
                    location: 'Cơ sở 2 - Phòng 210',
                    startDate: '2025-02-20',
                    endDate: '2025-05-20',
                    enrolledCount: 18,
                    capacity: 30,
                    status: 'active'
                },
                {
                    id: 'L003',
                    className: 'TOEIC300-03-ONLINE',
                    teacher: 'Phạm Văn Dạy',
                    teacherId: 'GV008',
                    schedule: 'CN 9:00-11:30',
                    location: 'Online (Zoom)',
                    startDate: '2025-03-01',
                    endDate: '2025-06-01',
                    enrolledCount: 0,
                    capacity: 40,
                    status: 'upcoming'
                },
            ]);
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('Không thể tải thông tin khóa học');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
            try {
                await deleteCourse(id);
                toast.success('Đã xóa khóa học thành công');
                navigate('/admin/courses');
            } catch (error) {
                console.error('Error deleting course:', error);
                toast.error('Không thể xóa khóa học');
            }
        }
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const renderClassStatus = (status) => {
        switch (status) {
            case 'active':
                return <span className="badge-success">Đang diễn ra</span>;
            case 'upcoming':
                return <span className="badge-warning">Sắp khai giảng</span>;
            case 'completed':
                return <span className="badge-secondary">Đã kết thúc</span>;
            case 'cancelled':
                return <span className="badge-danger">Đã hủy</span>;
            default:
                return <span className="badge-secondary">Không xác định</span>;
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="CHI TIẾT KHÓA HỌC"
                    notificationCount={3}
                />

                <div className="admin-content">
                    <div className="course-detail">
                        <div className="content-header">
                            <Link to="/admin/courses" className="btn btn-light">
                                <i className="bi bi-arrow-left"></i> Quay lại
                            </Link>

                            <div className="action-buttons">
                                <Link to={`/admin/courses/${id}/edit`} className="btn btn-primary">
                                    <i className="bi bi-pencil"></i> Chỉnh sửa
                                </Link>
                                <button onClick={handleDelete} className="btn btn-danger">
                                    <i className="bi bi-trash"></i> Xóa
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Đang tải thông tin khóa học...</p>
                            </div>
                        ) : course ? (
                            <>
                                <div className="course-header">
                                    <div className="course-title-section">
                                        <div className="course-code">{course.course_code}</div>
                                        <h1 className="course-title">{course.course_name}</h1>
                                        <p className="course-description">{course.course_description}</p>
                                    </div>

                                    <div className="course-status">
                                        <span className={`status-badge ${getStatusBadgeClass(course.course_status)}`}>
                                            {getStatusText(course.course_status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-tabs">
                                    <button
                                        className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('info')}
                                    >
                                        <i className="bi bi-info-circle"></i> Thông tin chung
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('classes')}
                                    >
                                        <i className="bi bi-grid-3x3"></i> Danh sách lớp học
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('schedule')}
                                    >
                                        <i className="bi bi-calendar-week"></i> Lịch học
                                    </button>
                                </div>

                                {activeTab === 'info' && (
                                    <div className="detail-content">
                                        {/* Giữ nguyên nội dung tab info */}
                                        <div className="detail-cards">
                                            <div className="detail-card">
                                                <h3 className="card-title">
                                                    <i className="bi bi-journal-text"></i> Thông tin cơ bản
                                                </h3>
                                                <div className="card-body">
                                                    <div className="detail-row">
                                                        <div className="detail-label">Mã khóa học:</div>
                                                        <div className="detail-value">{course.course_id}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Mã lớp:</div>
                                                        <div className="detail-value">{course.course_code}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Trình độ:</div>
                                                        <div className="detail-value">{getLevelText(course.level)}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Hình thức học:</div>
                                                        <div className="detail-value">{course.mode}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Điểm mục tiêu:</div>
                                                        <div className="detail-value">{course.target_score}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Cơ sở:</div>
                                                        <div className="detail-value">{course.campus_id || 'Online'}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Lộ trình học:</div>
                                                        <div className="detail-value">{course.learning_path_id || 'Chưa có'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="detail-card">
                                                <h3 className="card-title">
                                                    <i className="bi bi-calendar-check"></i> Thời gian & Lịch học
                                                </h3>
                                                <div className="card-body">
                                                    <div className="detail-row">
                                                        <div className="detail-label">Ngày bắt đầu:</div>
                                                        <div className="detail-value highlight">{formatDate(course.start_date)}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Ngày kết thúc:</div>
                                                        <div className="detail-value highlight">{formatDate(course.end_date)}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Lịch học:</div>
                                                        <div className="detail-value highlight">{course.schedule_text}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Số buổi học:</div>
                                                        <div className="detail-value">{course.session_count} buổi</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Tổng số giờ:</div>
                                                        <div className="detail-value">{course.total_hours} giờ</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Số lớp học:</div>
                                                        <div className="detail-value">
                                                            <span className="highlight">{classes.length}</span> lớp
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="detail-card">
                                                <h3 className="card-title">
                                                    <i className="bi bi-cash-coin"></i> Học phí & Sĩ số
                                                </h3>
                                                <div className="card-body">
                                                    <div className="detail-row">
                                                        <div className="detail-label">Học phí:</div>
                                                        <div className="detail-value highlight price">{formatCurrency(course.tuition_fee)}</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Sĩ số tối đa/lớp:</div>
                                                        <div className="detail-value">{course.capacity} học viên</div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Tổng số học viên:</div>
                                                        <div className="detail-value highlight">
                                                            {classes.reduce((total, cls) => total + cls.enrolledCount, 0)} học viên
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Tình trạng:</div>
                                                        <div className="detail-value">
                                                            {course.course_status === 'OPEN' ? (
                                                                <span className="badge-success">Đang mở đăng ký</span>
                                                            ) : course.course_status === 'CLOSED' ? (
                                                                <span className="badge-danger">Đã đóng đăng ký</span>
                                                            ) : (
                                                                <span className="badge-warning">Sắp mở đăng ký</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="detail-meta">
                                            <div className="meta-item">
                                                <span className="meta-label">Ngày tạo:</span>
                                                <span className="meta-value">{formatDate(course.created_at)}</span>
                                            </div>
                                            {course.updated_at && (
                                                <div className="meta-item">
                                                    <span className="meta-label">Cập nhật lần cuối:</span>
                                                    <span className="meta-value">{formatDate(course.updated_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'classes' && (
                                    <div className="detail-content">
                                        <div className="content-header">
                                            <h3 className="section-title">Danh sách lớp học thuộc khóa học</h3>
                                            <div className="actions">
                                                <button className="btn btn-outline-primary">
                                                    <i className="bi bi-file-earmark-excel"></i> Xuất Excel
                                                </button>
                                                <button className="btn btn-primary">
                                                    <i className="bi bi-plus"></i> Thêm lớp học mới
                                                </button>
                                            </div>
                                        </div>

                                        {classes.length > 0 ? (
                                            <div className="table-responsive">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Mã lớp</th>
                                                            <th>Tên lớp</th>
                                                            <th>Giáo viên</th>
                                                            <th>Lịch học</th>
                                                            <th>Địa điểm</th>
                                                            <th>Thời gian</th>
                                                            <th>Sĩ số</th>
                                                            <th>Trạng thái</th>
                                                            <th>Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {classes.map(classItem => (
                                                            <tr key={classItem.id}>
                                                                <td>{classItem.id}</td>
                                                                <td>{classItem.className}</td>
                                                                <td>
                                                                    <Link to={`/admin/teachers/${classItem.teacherId}`} className="link-text">
                                                                        {classItem.teacher}
                                                                    </Link>
                                                                </td>
                                                                <td>{classItem.schedule}</td>
                                                                <td>{classItem.location}</td>
                                                                <td>
                                                                    <div className="date-range">
                                                                        <div>{formatDate(classItem.startDate)}</div>
                                                                        <div>→</div>
                                                                        <div>{formatDate(classItem.endDate)}</div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="enrollment-count">
                                                                        {classItem.enrolledCount}/{classItem.capacity}
                                                                    </span>
                                                                </td>
                                                                <td>{renderClassStatus(classItem.status)}</td>
                                                                <td>
                                                                    <div className="action-buttons">
                                                                        <Link to={`/admin/classes/${classItem.id}`} className="btn-icon" title="Xem chi tiết">
                                                                            <i className="bi bi-eye"></i>
                                                                        </Link>
                                                                        <Link to={`/admin/classes/${classItem.id}/edit`} className="btn-icon" title="Chỉnh sửa">
                                                                            <i className="bi bi-pencil"></i>
                                                                        </Link>
                                                                        <button className="btn-icon text-danger" title="Xóa lớp">
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <div className="empty-icon">
                                                    <i className="bi bi-grid-3x3-gap"></i>
                                                </div>
                                                <h3>Chưa có lớp học nào</h3>
                                                <p>Khóa học này chưa có lớp học nào được tạo.</p>
                                                <button className="btn btn-primary">
                                                    <i className="bi bi-plus"></i> Thêm lớp học mới
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="detail-content">
                                        {/* Giữ nguyên nội dung tab schedule */}
                                        <div className="content-header">
                                            <h3 className="section-title">Lịch học chi tiết</h3>
                                        </div>

                                        <div className="schedule-info">
                                            <div className="schedule-summary">
                                                <div className="summary-item">
                                                    <i className="bi bi-calendar-week"></i>
                                                    <div>
                                                        <strong>Lịch học:</strong> {course.schedule_text}
                                                    </div>
                                                </div>
                                                <div className="summary-item">
                                                    <i className="bi bi-clock"></i>
                                                    <div>
                                                        <strong>Tổng số buổi:</strong> {course.session_count} buổi
                                                    </div>
                                                </div>
                                                <div className="summary-item">
                                                    <i className="bi bi-hourglass-split"></i>
                                                    <div>
                                                        <strong>Thời lượng:</strong> {course.total_hours} giờ
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="schedule-note">
                                                Khóa học bắt đầu từ ngày <strong>{formatDate(course.start_date)}</strong>
                                                và kết thúc vào ngày <strong>{formatDate(course.end_date)}</strong>
                                            </p>

                                            {course.mode === 'ONLINE' ? (
                                                <div className="online-info">
                                                    <h4><i className="bi bi-laptop"></i> Thông tin học trực tuyến</h4>
                                                    <div className="online-details">
                                                        <p>Link học Zoom sẽ được gửi qua email trước buổi học.</p>
                                                        <div className="link-box">
                                                            <div className="link-label">Link học:</div>
                                                            <div className="link-value">
                                                                <a href="#" className="zoom-link">https://zoom.us/j/1234567890</a>
                                                                <button className="btn-icon" title="Copy link">
                                                                    <i className="bi bi-clipboard"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="link-box">
                                                            <div className="link-label">Mật khẩu:</div>
                                                            <div className="link-value">
                                                                <span>123456</span>
                                                                <button className="btn-icon" title="Copy mật khẩu">
                                                                    <i className="bi bi-clipboard"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="campus-info">
                                                    <h4><i className="bi bi-building"></i> Địa điểm học</h4>
                                                    <p className="campus-address">
                                                        <strong>Cơ sở {course.campus_id || 1}:</strong> 285 Đội Cấn, Ba Đình, Hà Nội
                                                    </p>
                                                    <p className="campus-note">
                                                        <i className="bi bi-info-circle"></i> Học viên vui lòng có mặt trước giờ học 15 phút.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <i className="bi bi-exclamation-circle"></i>
                                </div>
                                <h3>Không tìm thấy khóa học</h3>
                                <p>Khóa học này không tồn tại hoặc đã bị xóa.</p>
                                <Link to="/admin/courses" className="btn btn-primary">
                                    <i className="bi bi-arrow-left"></i> Quay lại danh sách khóa học
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseDetail;