import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './css/StudentDetail.css';
import { getStudentById } from '../../services/studentService';
import { getClassesByStudentId } from '../../services/classService';

function StudentDetail() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    fetchStudentDetails();
    fetchEnrolledClasses();
  }, [id]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      setTimeout(async () => {
        const studentData = await getStudentById(id);
        const mappedStudent = {
          id: studentData.user_id,
          name: studentData.user_name,
          email: studentData.user_email,
          phone: studentData.user_telephone,
          birthday: studentData.user_birthday,
          gender: studentData.user_gender === "M" ? "Nam" : studentData.user_gender === "F" ? "Nữ" : "Khác",
          status: studentData.sd_status || "active",
          address: "",
          registrationDate: studentData.created_at,
          lastActive: studentData.updated_at,
        };
        setStudent(mappedStudent);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching student details:', error);
      setLoading(false);
    }
  };

  const fetchEnrolledClasses = async () => {
    try {
      const classes = await getClassesByStudentId(id);
      setEnrolledClasses(classes);
    } catch (error) {
      setEnrolledClasses([]);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (includeTime) {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge success';
      case 'inactive': return 'status-badge danger';
      case 'pending': return 'status-badge warning';
      case 'in-progress': return 'status-badge info';
      case 'completed': return 'status-badge success';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'inactive': return 'Ngừng học';
      case 'pending': return 'Chờ xác nhận';
      case 'in-progress': return 'Đang học';
      case 'completed': return 'Đã hoàn thành';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Sử dụng AdminPageHeader */}
        <AdminPageHeader
          title="Chi tiết học viên"
          subtitle="Thông tin chi tiết và học phần đang học"
          onNotificationClick={() => { }}
        />
        <div className="admin-content">
          <div className="page-actions">
            <Link to="/admin/students" className="btn btn-light">
              <i className="bi bi-arrow-left"></i> Quay lại
            </Link>
            <div>
              <Link to={`/admin/students/${id}/edit`} className="btn btn-primary me-2">
                <i className="bi bi-pencil"></i> Chỉnh sửa
              </Link>
              {/* Bỏ nút xóa nếu không cần */}
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải thông tin học viên...</p>
            </div>
          ) : student ? (
            <div className="student-detail">
              <div className="row">
                <div className="col-lg-4">
                  <div className="detail-card">
                    <div className="student-profile">
                      <div className="profile-info">
                        <h2>{student.name}</h2>
                        <p className="student-id">{student.id}</p>
                        <span className={getStatusClass(student.status)}>
                          {getStatusText(student.status)}
                        </span>
                      </div>
                    </div>
                    <div className="info-section">
                      <h3 className="section-heading">Thông tin cá nhân</h3>
                      <ul className="info-list">
                        <li>
                          <i className="bi bi-envelope"></i>
                          <div className="info-content">
                            <span className="info-label">Email</span>
                            <span className="info-value">{student.email}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-telephone"></i>
                          <div className="info-content">
                            <span className="info-label">Số điện thoại</span>
                            <span className="info-value">{student.phone}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-calendar3"></i>
                          <div className="info-content">
                            <span className="info-label">Ngày sinh</span>
                            <span className="info-value">{formatDate(student.birthday)}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-gender-ambiguous"></i>
                          <div className="info-content">
                            <span className="info-label">Giới tính</span>
                            <span className="info-value">{student.gender}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div className="info-section">
                      <h3 className="section-heading">Tài khoản</h3>
                      <ul className="info-list">
                        <li>
                          <i className="bi bi-calendar-check"></i>
                          <div className="info-content">
                            <span className="info-label">Ngày đăng ký</span>
                            <span className="info-value">{formatDate(student.registrationDate, true)}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-clock-history"></i>
                          <div className="info-content">
                            <span className="info-label">Hoạt động cuối</span>
                            <span className="info-value">{formatDate(student.lastActive, true)}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="detail-card">
                    <h3 className="card-title">Học phần đang học</h3>
                    {enrolledClasses.length === 0 ? (
                      <div className="empty-state">
                        <p>Học viên chưa đăng ký học phần nào.</p>
                      </div>
                    ) : (
                      <div className="enrolled-classes">
                        {enrolledClasses.map((item, idx) => (
                          <div className="class-item" key={item.class_id || idx}>
                            <div className="class-header">
                              <h4>{item.class?.class_name || "Chưa có tên lớp"}</h4>
                              <span className={getStatusClass(item.status?.toLowerCase())}>
                                {getStatusText(item.status?.toLowerCase())}
                              </span>
                            </div>
                            <div className="course-info">
                              <span className="course-label">Khóa học:</span>
                              <span className="course-value">{item.course?.course_name || ""}</span>
                              <span className="course-label ms-3">Mã khóa:</span>
                              <span className="course-value">{item.course?.course_code || ""}</span>
                              <span className="course-label ms-3">Level:</span>
                              <span className="course-value">{item.course?.level || ""}</span>
                            </div>
                            <div className="class-actions mt-2">
                              <Link to={`/admin/classes/${item.class_id}`} className="btn btn-sm btn-outline-primary">
                                Chi tiết lớp học
                              </Link>
                              <Link to={`/admin/courses/${item.course?.course_id}`} className="btn btn-sm btn-outline-secondary ms-2">
                                Chi tiết khóa học
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-exclamation-circle"></i>
              <p>Không tìm thấy thông tin học viên.</p>
              <Link to="/admin/students" className="btn btn-primary">
                Quay lại danh sách học viên
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDetail;