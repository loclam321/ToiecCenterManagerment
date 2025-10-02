import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/Adminsidebar';
import PageDetailHeader from '../../components/common/PageDetailHeader';
import ClassList from '../../components/admin/ClassList'; // Import component mới
import { getCourseById, deleteCourse, getStatusBadgeClass, getStatusText, getLevelText, formatCurrency, formatDate } from '../../services/courseService';
import { getClassesByCourseId } from '../../services/classService'; // Import service
import './css/CourseDetail.css';

function CourseDetail() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [classesLoading, setClassesLoading] = useState(false);
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [classes, setClasses] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    // Khi chuyển sang tab classes, chúng ta sẽ fetch dữ liệu lớp học nếu chưa có
    useEffect(() => {
        if (activeTab === 'classes' && classes.length === 0 && !classesLoading && course) {
            fetchClassesForCourse();
        }
    }, [activeTab, course]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const response = await getCourseById(id);
            setCourse(response);
            console.log("Dữ liệu khóa học:", response);
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('Không thể tải thông tin khóa học');
        } finally {
            setLoading(false);
        }
    };

    // Thay thế hàm fetchClassesForCourse hiện tại
    const fetchClassesForCourse = async () => {
        setClassesLoading(true);
        try {
            // Gọi API thực tế
            const classesData = await getClassesByCourseId(id);
            console.log('Dữ liệu lớp học nhận được từ API:', classesData);
            // Map dữ liệu API sang cấu trúc mà component ClassList đang sử dụng
            const formattedClasses = classesData.classes.map(cls => ({
                id: cls.class_id,
                className: cls.class_name,
                courseId: cls.course_id,
                courseName: cls.course_name,
                startDate: cls.class_startdate,
                endDate: cls.class_enddate,
                capacity: cls.class_maxstudents,
                enrolledCount: cls.class_currentenrollment,
                status: cls.class_status.toLowerCase(),
                createdAt: cls.created_at,
                updatedAt: cls.updated_at,
                // Các trường có thể không có trong API, sử dụng giá trị mặc định
                teacher: 'Chưa phân công',
                teacherId: null,
                location: 'Đang cập nhật',
                schedule: 'Đang cập nhật'
            }));

            setClasses(formattedClasses);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Không thể tải danh sách lớp học');
        } finally {
            setClassesLoading(false);
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

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <PageDetailHeader
                    entityCode={course?.course_code}
                    title={course?.course_name}
                    description={course?.course_description}
                    status={course?.course_status}
                    statusBadgeClass={getStatusBadgeClass(course?.course_status)}
                    statusText={getStatusText(course?.course_status)}
                    type="course"
                />

                <div className="admin-content">
                    <div className="course-detail">

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Đang tải thông tin khóa học...</p>
                            </div>
                        ) : course ? (
                            <>
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
                                        {/* Tab thông tin chung không thay đổi */}
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
                                    // Sử dụng component ClassList mới
                                    <ClassList
                                        classes={classes}
                                        loading={classesLoading}
                                        courseId={id}
                                    />
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="detail-content">
                                        {/* Tab lịch học không thay đổi */}
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