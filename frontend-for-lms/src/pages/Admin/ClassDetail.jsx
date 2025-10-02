import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/Adminsidebar';
import PageDetailHeader from '../../components/common/PageDetailHeader';
import { 
  getClassById, 
  deleteClass, 
  getClassStatusBadgeClass, 
  getClassStatusText,
  getClassEnrollments,
  removeStudentFromClass // Thêm import
} from '../../services/classService';
import { formatDate } from '../../services/courseService';
import './css/ClassDetail.css';

function ClassDetail() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false); // Thêm state loading cho danh sách học viên
    const [classData, setClassData] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [students, setStudents] = useState([]);
    const [studentsPagination, setStudentsPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });
    const [attendance, setAttendance] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchClassDetails();
    }, [id]);

    // Fetch students khi chuyển sang tab students hoặc thay đổi trang
    useEffect(() => {
        if (activeTab === 'students' && classData) {
            fetchEnrolledStudents();
        }
    }, [activeTab, studentsPagination.page, classData]);

    const fetchClassDetails = async () => {
        setLoading(true);
        try {
            const response = await getClassById(id);
            setClassData(response);
            console.log("Dữ liệu lớp học:", response);
            
            // Mock data cho điểm danh - giữ lại vì chưa có API
            setAttendance([
                {
                    sessionId: 1,
                    sessionDate: '2025-01-15',
                    sessionTopic: 'Introduction to TOEIC',
                    totalStudents: 2,
                    presentStudents: 2,
                    absentStudents: 0
                },
                {
                    sessionId: 2,
                    sessionDate: '2025-01-17',
                    sessionTopic: 'Listening Section Part 1',
                    totalStudents: 2,
                    presentStudents: 1,
                    absentStudents: 1
                }
            ]);
        } catch (error) {
            console.error('Error fetching class details:', error);
            toast.error('Không thể tải thông tin lớp học');
        } finally {
            setLoading(false);
        }
    };

    // Thêm hàm mới để fetch danh sách học viên đã đăng ký
    const fetchEnrolledStudents = async () => {
        setStudentsLoading(true);
        try {
            const { enrollments, pagination } = await getClassEnrollments(
                id, 
                studentsPagination.page
            );
            setStudents(enrollments);
            setStudentsPagination(pagination);
        } catch (error) {
            console.error('Error fetching enrolled students:', error);
            toast.error('Không thể tải danh sách học viên đã đăng ký');
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
            try {
                await deleteClass(id);
                toast.success('Đã xóa lớp học thành công');
                navigate('/admin/courses');
            } catch (error) {
                console.error('Error deleting class:', error);
                toast.error('Không thể xóa lớp học');
            }
        }
    };

    // Thêm hàm xử lý xóa học viên
    const handleRemoveStudent = async (studentId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa học viên này khỏi lớp học?')) {
            try {
                await removeStudentFromClass(id, studentId);
                toast.success('Đã xóa học viên khỏi lớp thành công');
                fetchEnrolledStudents(); // Cập nhật lại danh sách
            } catch (error) {
                console.error('Error removing student:', error);
                toast.error('Không thể xóa học viên khỏi lớp');
            }
        }
    };

    const handleChangePage = (newPage) => {
        setStudentsPagination(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const renderStudentStatus = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="badge-success">Đang học</span>;
            case 'INACTIVE':
                return <span className="badge-danger">Đã nghỉ</span>;
            case 'COMPLETED':
                return <span className="badge-secondary">Hoàn thành</span>;
            default:
                return <span className="badge-secondary">Không xác định</span>;
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <PageDetailHeader
                    entityCode={`Mã lớp: ${classData?.class_id}`}
                    title={classData?.class_name}
                    subtitle={classData?.course_name}
                    subtitleLink={{
                        url: `/admin/courses/${classData?.course_id}`,
                        text: classData?.course_name
                    }}
                    status={classData?.class_status}
                    statusBadgeClass={getClassStatusBadgeClass(classData?.class_status)}
                    statusText={getClassStatusText(classData?.class_status)}
                    type="class"
                />

                <div className="admin-content">
                    <div className="class-detail">
                        <div className="content-header">
                            <Link to={`/admin/courses/${classData?.course_id}`} className="btn btn-light">
                                <i className="bi bi-arrow-left"></i> Quay lại khóa học
                            </Link>

                            <div className="action-buttons">
                                <Link to={`/admin/classes/${id}/edit`} className="btn btn-primary">
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
                                <p>Đang tải thông tin lớp học...</p>
                            </div>
                        ) : classData ? (
                            <>
                                {/* Giữ nguyên các tab */}
                                <div className="detail-tabs">
                                    <button
                                        className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('info')}
                                    >
                                        <i className="bi bi-info-circle"></i> Thông tin chung
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('students')}
                                    >
                                        <i className="bi bi-people"></i> Danh sách học viên
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('attendance')}
                                    >
                                        <i className="bi bi-calendar-check"></i> Điểm danh
                                    </button>
                                </div>

                                {/* Tab thông tin chung giữ nguyên */}
                                {activeTab === 'info' && (
                                    <div className="detail-content">
                                        {/* Giữ nguyên nội dung tab info */}
                                        <div className="detail-cards">
                                            {/* Các thẻ thông tin giữ nguyên */}
                                        </div>
                                    </div>
                                )}

                                {/* Cập nhật tab danh sách học viên */}
                                {activeTab === 'students' && (
                                    <div className="detail-content">
                                        <div className="content-header">
                                            <h3 className="section-title">
                                                Danh sách học viên ({studentsPagination.total || 0})
                                            </h3>
                                            <div className="actions">
                                                <button className="btn btn-outline-primary">
                                                    <i className="bi bi-file-earmark-excel"></i> Xuất Excel
                                                </button>
                                                <Link to={`/admin/classes/${id}/add-students`} className="btn btn-primary">
                                                    <i className="bi bi-plus"></i> Thêm học viên
                                                </Link>
                                            </div>
                                        </div>

                                        {studentsLoading ? (
                                            <div className="loading-container">
                                                <div className="spinner"></div>
                                                <p>Đang tải danh sách học viên...</p>
                                            </div>
                                        ) : students.length > 0 ? (
                                            <>
                                                <div className="table-responsive">
                                                    <table className="data-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Mã học viên</th>
                                                                <th>Họ tên</th>
                                                                <th>Email</th>
                                                                <th>Số điện thoại</th>
                                                                <th>Ngày đăng ký</th>
                                                                <th>Trạng thái</th>
                                                                <th>Thao tác</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {students.map(enrollment => (
                                                                <tr key={enrollment.user_id}>
                                                                    <td>{enrollment.user_id}</td>
                                                                    <td>{enrollment.student_name}</td>
                                                                    <td>{enrollment.student?.user_email}</td>
                                                                    <td>{enrollment.student?.user_telephone}</td>
                                                                    <td>{formatDate(enrollment.enrolled_date)}</td>
                                                                    <td>{renderStudentStatus(enrollment.status)}</td>
                                                                    <td>
                                                                        <div className="action-buttons">
                                                                            <Link 
                                                                                to={`/admin/students/${enrollment.user_id}`} 
                                                                                className="btn-icon" 
                                                                                title="Xem chi tiết"
                                                                            >
                                                                                <i className="bi bi-eye"></i>
                                                                            </Link>
                                                                            <button 
                                                                                className="btn-icon text-danger" 
                                                                                title="Xóa khỏi lớp"
                                                                                onClick={() => handleRemoveStudent(enrollment.user_id)}
                                                                            >
                                                                                <i className="bi bi-person-dash"></i>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                
                                                {/* Thêm phân trang */}
                                                {studentsPagination.pages > 1 && (
                                                    <div className="pagination-container">
                                                        <button 
                                                            className="pagination-button"
                                                            disabled={!studentsPagination.has_prev}
                                                            onClick={() => handleChangePage(studentsPagination.page - 1)}
                                                        >
                                                            <i className="bi bi-chevron-left"></i>
                                                        </button>
                                                        <span className="pagination-info">
                                                            Trang {studentsPagination.page} / {studentsPagination.pages}
                                                        </span>
                                                        <button 
                                                            className="pagination-button"
                                                            disabled={!studentsPagination.has_next}
                                                            onClick={() => handleChangePage(studentsPagination.page + 1)}
                                                        >
                                                            <i className="bi bi-chevron-right"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="empty-state">
                                                <div className="empty-icon">
                                                    <i className="bi bi-people"></i>
                                                </div>
                                                <h3>Chưa có học viên nào</h3>
                                                <p>Lớp học này chưa có học viên nào đăng ký.</p>
                                                <Link to={`/admin/classes/${id}/add-students`} className="btn btn-primary">
                                                    <i className="bi bi-plus"></i> Thêm học viên
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Giữ nguyên tab attendance */}
                                {activeTab === 'attendance' && (
                                    <div className="detail-content">
                                        {/* Giữ nguyên nội dung tab attendance */}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <i className="bi bi-exclamation-circle"></i>
                                </div>
                                <h3>Không tìm thấy lớp học</h3>
                                <p>Lớp học này không tồn tại hoặc đã bị xóa.</p>
                                <Link to="/admin/courses" className="btn btn-primary">
                                    <i className="bi bi-arrow-left"></i> Quay lại danh sách
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClassDetail;