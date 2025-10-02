import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/Adminsidebar';
import PageDetailHeader from '../../components/common/PageDetailHeader';
import { getClassById } from '../../services/classService';
import { getStudents, enrollStudentsToClass } from '../../services/studentService';
import EnrollmentResultModal from '../../components/common/EnrollmentResultModal';
import './css/AddStudentToClass.css';

function AddStudentToClass() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        status: ''
    });
    const [showResultModal, setShowResultModal] = useState(false);
    const [enrollmentResults, setEnrollmentResults] = useState({
        success: [],
        alreadyEnrolled: [],
        failed: []
    });
    const { id: classId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchClassDetails();
    }, [classId]);

    useEffect(() => {
        fetchStudents();
    }, [page, filters]);

    const fetchClassDetails = async () => {
        try {
            const response = await getClassById(classId);
            setClassData(response);
        } catch (error) {
            console.error('Error fetching class details:', error);
            toast.error('Không thể tải thông tin lớp học');
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Sử dụng hàm getStudents có sẵn với options phù hợp
            const options = {
                page: page,
                perPage: 10,
                search: filters.name || filters.email,
                status: filters.status
            };
            
            const { students: studentsData, pagination } = await getStudents(options);
            
            setStudents(studentsData);
            setTotalPages(pagination.pages || 1);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Không thể tải danh sách học viên');
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(student => student.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (e, studentId) => {
        if (e.target.checked) {
            setSelectedStudents(prev => [...prev, studentId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1);
    };

    // Cập nhật hàm handleSubmit để xử lý lỗi đúng cách

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedStudents.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một học viên');
            return;
        }

        setSubmitting(true);
        try {
            const result = await enrollStudentsToClass(classId, selectedStudents);
            
            // Lưu kết quả và hiển thị modal
            setEnrollmentResults(result.results);
            setShowResultModal(true);
            
            // Nếu có ít nhất một học viên được thêm thành công
            if (result.results.success.length > 0) {
                // Không cần toast.success vì sẽ hiển thị chi tiết trong modal
            } else {
                // Không có học viên nào được thêm thành công
                toast.warning(result.message);
            }
        } catch (error) {
            console.error('Error adding students to class:', error);
            
            // Hiển thị thông báo lỗi cụ thể
            if (error.message && error.message.includes("đã đăng ký")) {
                toast.warning(error.message);
                
                // Tạo dữ liệu kết quả cho modal hiển thị thông tin chi tiết
                setEnrollmentResults({
                    success: [],
                    alreadyEnrolled: selectedStudents,
                    failed: []
                });
                setShowResultModal(true);
            } else {
                toast.error(error.message || 'Không thể thêm học viên vào lớp: Đã xảy ra lỗi');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowResultModal(false);
        if (enrollmentResults.success.length > 0) {
            navigate(`/admin/classes/${classId}`);
        }
    };

    const renderPagination = () => {
        return (
            <div className="pagination">
                <button 
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="pagination-button"
                >
                    <i className="bi bi-chevron-left"></i>
                </button>
                <span className="pagination-info">Trang {page} / {totalPages}</span>
                <button 
                    onClick={() => setPage(prev => prev < totalPages ? prev + 1 : prev)}
                    disabled={page === totalPages}
                    className="pagination-button"
                >
                    <i className="bi bi-chevron-right"></i>
                </button>
            </div>
        );
    };

    // Điều chỉnh để sử dụng cấu trúc dữ liệu học viên từ API thực tế
    const getStudentName = (student) => {
        return student.user_name || student.name || 'Chưa có tên';
    };
    
    const getStudentEmail = (student) => {
        return student.user_email || student.email || '';
    };
    
    const getStudentPhone = (student) => {
        return student.user_telephone || student.phone || '';
    };
    
    const getStudentId = (student) => {
        return student.user_id || student.id;
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <PageDetailHeader
                    entityCode={`Mã lớp: ${classData?.class_id}`}
                    title="Thêm học viên vào lớp"
                    subtitle={classData?.class_name}
                    subtitleLink={{
                        url: `/admin/classes/${classId}`,
                        text: classData?.class_name
                    }}
                    type="class"
                />

                <div className="admin-content">
                    <div className="add-student-container">
                        <div className="content-header">
                            <Link to={`/admin/classes/${classId}`} className="btn btn-light">
                                <i className="bi bi-arrow-left"></i> Quay lại lớp học
                            </Link>
                        </div>

                        {loading && students.length === 0 ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Đang tải danh sách học viên...</p>
                            </div>
                        ) : (
                            <>
                                <div className="filter-section">
                                    <div className="filter-header">
                                        <h3>Tìm kiếm học viên</h3>
                                    </div>
                                    <div className="filter-form">
                                        <div className="filter-row">
                                            <div className="filter-group">
                                                <label htmlFor="name">Tên học viên</label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={filters.name}
                                                    onChange={handleFilterChange}
                                                    placeholder="Nhập tên học viên"
                                                />
                                            </div>
                                            <div className="filter-group">
                                                <label htmlFor="email">Email</label>
                                                <input
                                                    type="text"
                                                    id="email"
                                                    name="email"
                                                    value={filters.email}
                                                    onChange={handleFilterChange}
                                                    placeholder="Nhập email"
                                                />
                                            </div>
                                            <div className="filter-group">
                                                <label htmlFor="status">Trạng thái</label>
                                                <select
                                                    id="status"
                                                    name="status"
                                                    value={filters.status}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="">Tất cả</option>
                                                    <option value="active">Đang học</option>
                                                    <option value="inactive">Đã nghỉ</option>
                                                    <option value="completed">Hoàn thành</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="student-list-section">
                                    <div className="section-header">
                                        <div className="selection-info">
                                            <div className="checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    id="select-all"
                                                    checked={selectedStudents.length === students.length && students.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                                <label htmlFor="select-all">Chọn tất cả</label>
                                            </div>
                                            <span className="selected-count">
                                                Đã chọn {selectedStudents.length} học viên
                                            </span>
                                        </div>
                                        {students.length > 0 && renderPagination()}
                                    </div>
                                    
                                    {loading ? (
                                        <div className="loading-overlay">
                                            <div className="spinner"></div>
                                            <p>Đang tải...</p>
                                        </div>
                                    ) : students.length > 0 ? (
                                        <div className="student-grid">
                                            {students.map(student => {
                                                const studentId = getStudentId(student);
                                                const studentName = getStudentName(student);
                                                const studentEmail = getStudentEmail(student);
                                                const studentPhone = getStudentPhone(student);
                                                
                                                return (
                                                    <div 
                                                        className={`student-card ${selectedStudents.includes(studentId) ? 'selected' : ''}`} 
                                                        key={studentId}
                                                        onClick={() => handleSelectStudent({ target: { checked: !selectedStudents.includes(studentId) } }, studentId)}
                                                    >
                                                        <div className="checkbox-wrapper">
                                                            <input
                                                                type="checkbox"
                                                                id={`student-${studentId}`}
                                                                checked={selectedStudents.includes(studentId)}
                                                                onChange={(e) => handleSelectStudent(e, studentId)}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                        </div>
                                                        <div className="student-avatar">
                                                            {student.avatar ? (
                                                                <img src={student.avatar} alt={studentName} />
                                                            ) : (
                                                                <div className="avatar-placeholder">
                                                                    {studentName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="student-info">
                                                            <h4 className="student-name">{studentName}</h4>
                                                            <p className="student-email">{studentEmail}</p>
                                                            <p className="student-phone">{studentPhone}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">
                                                <i className="bi bi-search"></i>
                                            </div>
                                            <h3>Không tìm thấy học viên</h3>
                                            <p>Không có học viên nào phù hợp với tiêu chí tìm kiếm.</p>
                                            <button 
                                                className="btn btn-outline-primary"
                                                onClick={() => {
                                                    setFilters({ name: '', email: '', status: '' });
                                                    setPage(1);
                                                }}
                                            >
                                                Xóa bộ lọc
                                            </button>
                                        </div>
                                    )}
                                    
                                    {students.length > 0 && renderPagination()}
                                </div>

                                <div className="form-footer">
                                    <Link to={`/admin/classes/${classId}`} className="btn btn-secondary">
                                        Hủy
                                    </Link>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary"
                                        disabled={selectedStudents.length === 0 || submitting}
                                        onClick={handleSubmit}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <span className="ms-2">Đang xử lý...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-circle"></i>
                                                <span>Thêm {selectedStudents.length} học viên vào lớp</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <EnrollmentResultModal
                isOpen={showResultModal}
                onClose={handleCloseModal}
                results={enrollmentResults}
                studentData={students}
            />
        </div>
    );
}

export default AddStudentToClass;