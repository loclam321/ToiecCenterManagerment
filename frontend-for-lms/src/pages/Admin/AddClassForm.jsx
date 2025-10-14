import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createClass } from '../../services/classService';
import { getCourseById } from '../../services/courseService';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './css/AddClassForm.css';
// Form thêm lớp học mới cho một khóa học cụ thể
function AddClassForm() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [course, setCourse] = useState(null);
    const [formData, setFormData] = useState({
        class_name: '',
        class_startdate: '',
        class_enddate: '',
        class_maxstudents: 30,
        class_status: ''
    });
    const [errors, setErrors] = useState({});

    const { courseId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const courseData = await getCourseById(courseId);
            setCourse(courseData);

            // Đề xuất tên lớp dựa trên mã khóa học
            if (courseData) {
                // Lấy chuỗi trước dấu gạch ngang đầu tiên trong course_code
                const baseCode = courseData.course_code.split('-')[0];

                // Đề xuất tên lớp dựa trên level của khóa học
                let levelText = '';
                switch (courseData.level) {
                    case 'BEGINNER':
                        levelText = '300+';
                        break;
                    case 'INTERMEDIATE':
                        levelText = '500+';
                        break;
                    case 'ADVANCED':
                        levelText = '700+';
                        break;
                    default:
                        levelText = '';
                }

                const suggestedName = `${baseCode.replace(/\d+/g, '')} ${levelText} (Sáng T2-4-6)`;

                // Chuẩn bị ngày bắt đầu và kết thúc theo định dạng YYYY-MM-DD
                const today = new Date();
                const startDate = courseData.start_date || today.toISOString().split('T')[0];

                // Ngày kết thúc mặc định 3 tháng sau ngày bắt đầu
                const endDate = courseData.end_date || (() => {
                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + 3);
                    return endDate.toISOString().split('T')[0];
                })();

                setFormData(prev => ({
                    ...prev,
                    class_name: suggestedName,
                    class_startdate: startDate,
                    class_enddate: endDate,
                    class_maxstudents: courseData.capacity || 20
                }));
            }
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('Không thể tải thông tin khóa học');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Xóa lỗi khi người dùng bắt đầu nhập lại
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.class_name.trim()) {
            newErrors.class_name = 'Vui lòng nhập tên lớp';
        }

        if (!formData.class_startdate) {
            newErrors.class_startdate = 'Vui lòng chọn ngày bắt đầu';
        }

        if (!formData.class_enddate) {
            newErrors.class_enddate = 'Vui lòng chọn ngày kết thúc';
        } else if (new Date(formData.class_enddate) <= new Date(formData.class_startdate)) {
            newErrors.class_enddate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        if (!formData.class_maxstudents || formData.class_maxstudents <= 0) {
            newErrors.class_maxstudents = 'Sĩ số tối đa phải lớn hơn 0';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();

        // Kiểm tra ngày hợp lệ
        const todayDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

        // Kiểm tra ngày bắt đầu > ngày kết thúc
        if (formData.class_startdate > formData.class_enddate) {
            newErrors.class_startdate = 'Ngày bắt đầu không thể sau ngày kết thúc';
        }

        // Kiểm tra ngày bắt đầu < ngày hiện tại
        if (formData.class_startdate < todayDate) {
            newErrors.class_startdate = 'Ngày bắt đầu không thể trước ngày hiện tại';
        }

        // Nếu có lỗi, hiển thị và dừng submit
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Nếu không có lỗi, tiếp tục submit
        setSubmitting(true);

        try {
            // Chuẩn bị dữ liệu theo cấu trúc API yêu cầu
            const classData = {
                course_id: courseId,
                class_name: formData.class_name,
                class_startdate: formData.class_startdate,
                class_enddate: formData.class_enddate,
                class_maxstudents: parseInt(formData.class_maxstudents),
                class_currentenrollment: 0, // Lớp mới bắt đầu với 0 học viên
                class_status: "",
            };

            // Gọi API tạo lớp học mới với cấu trúc đã cập nhật
            const result = await createClass(classData);

            if (result.success) {
                toast.success('Tạo lớp học thành công!');
                navigate(`/admin/courses/${courseId}`);
            } else {
                toast.error(`Không thể tạo lớp học: ${result.message}`);
            }
        } catch (error) {
            console.error('Error creating class:', error);
            toast.error('Không thể tạo lớp học: ' + (error.response?.data?.message || error.message || 'Đã xảy ra lỗi'));
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="THÊM LỚP HỌC MỚI"
                />

                <div className="admin-content">
                    <div className="class-form-container">
                        <div className="form-header">
                            <Link to={`/admin/courses/${courseId}`} className="btn-back">
                                <i className="bi bi-arrow-left"></i>
                                <span>Quay lại</span>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Đang tải...</p>
                            </div>
                        ) : course ? (
                            <>
                                <div className="course-info-banner">
                                    <div className="course-info">
                                        <h3 className="course-title">{course.course_name}</h3>
                                        <p className="course-code">{course.course_code}</p>
                                    </div>
                                    <div className="course-meta">
                                        <span className="course-dates">
                                            <i className="bi bi-calendar-event"></i>
                                            {new Date(course.start_date).toLocaleDateString('vi-VN')} - {new Date(course.end_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                <form className="class-form" onSubmit={handleSubmit}>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label htmlFor="class_name">Tên lớp <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                id="class_name"
                                                name="class_name"
                                                value={formData.class_name}
                                                onChange={handleChange}
                                                className={errors.class_name ? 'error' : ''}
                                                placeholder="Nhập tên lớp"
                                            />
                                            {errors.class_name && <div className="error-message">{errors.class_name}</div>}
                                            <small className="form-text text-muted">
                                                Gợi ý đặt tên: "TOEIC 500+ (Sáng T2-4-6)", "IELTS 6.0 (Tối T3-5-7)"
                                            </small>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="class_startdate">Ngày bắt đầu <span className="required">*</span></label>
                                            <input
                                                type="date"
                                                id="class_startdate"
                                                name="class_startdate"
                                                value={formData.class_startdate}
                                                onChange={handleChange}
                                                className={errors.class_startdate ? 'error' : ''}
                                            />
                                            {errors.class_startdate && <div className="error-message">{errors.class_startdate}</div>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="class_enddate">Ngày kết thúc <span className="required">*</span></label>
                                            <input
                                                type="date"
                                                id="class_enddate"
                                                name="class_enddate"
                                                value={formData.class_enddate}
                                                onChange={handleChange}
                                                min={formData.class_startdate}
                                                className={errors.class_enddate ? 'error' : ''}
                                            />
                                            {errors.class_enddate && <div className="error-message">{errors.class_enddate}</div>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="class_maxstudents">Sĩ số tối đa <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                id="class_maxstudents"
                                                name="class_maxstudents"
                                                min="1"
                                                value={formData.class_maxstudents}
                                                onChange={handleChange}
                                                className={errors.class_maxstudents ? 'error' : ''}
                                            />
                                            {errors.class_maxstudents && <div className="error-message">{errors.class_maxstudents}</div>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="class_status">Trạng thái lớp</label>
                                            <select
                                                id="class_status"
                                                name="class_status"
                                                value={formData.class_status}
                                                onChange={handleChange}
                                            >
                                                <option value="UPCOMING">Sắp khai giảng</option>
                                                <option value="ACTIVE">Đang diễn ra</option>
                                                <option value="COMPLETED">Đã kết thúc</option>
                                                <option value="CANCELLED">Đã hủy</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-footer">
                                        <Link to={`/admin/courses/${courseId}`} className="btn btn-secondary">
                                            Hủy
                                        </Link>
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    <span className="ms-2">Đang xử lý...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-plus-lg"></i>
                                                    <span>Tạo lớp học</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
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

export default AddClassForm;