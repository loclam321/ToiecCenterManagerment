import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import './css/StudentDetail.css';

function StudentDetail() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    // Fetch student data
    fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      setTimeout(() => {
        const mockStudent = {
          id: id,
          name: "Nguyễn Văn A",
          email: "student@example.com",
          phone: "0987654321",
          address: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
          birthday: "2000-01-15",
          gender: "Nam",
          status: "active",
          avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=random",
          enrolledCourses: [
            {
              id: "C001",
              name: "TOEIC 500+",
              startDate: "2023-01-10",
              endDate: "2023-04-10",
              progress: 75,
              status: "in-progress"
            },
            {
              id: "C002",
              name: "TOEIC 650+",
              startDate: "2023-05-15",
              endDate: "2023-08-15",
              progress: 30,
              status: "in-progress"
            }
          ],
          activities: [
            {
              date: "2023-09-20T08:30:00",
              type: "login",
              description: "Đăng nhập vào hệ thống"
            },
            {
              date: "2023-09-20T09:15:00",
              type: "course",
              description: "Hoàn thành bài học: TOEIC Listening Part 1"
            },
            {
              date: "2023-09-19T14:20:00",
              type: "quiz",
              description: "Hoàn thành bài kiểm tra: TOEIC Reading Practice Test 03"
            }
          ],
          registrationDate: "2023-01-05T10:30:00",
          lastActive: "2023-09-20T09:15:00"
        };

        setStudent(mockStudent);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching student details:', error);
      setLoading(false);
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return 'bi-box-arrow-in-right';
      case 'course': return 'bi-book';
      case 'quiz': return 'bi-check-square';
      case 'homework': return 'bi-file-earmark-text';
      case 'payment': return 'bi-credit-card';
      default: return 'bi-activity';
    }
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
        <div className="admin-header">
          <div className="header-content">
            <h1 className="page-title">Chi tiết học viên</h1>
            <div className="header-actions">
              <button className="btn-icon">
                <i className="bi bi-bell"></i>
                <span className="notification-badge">3</span>
              </button>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <div className="page-actions">
            <Link to="/admin/students" className="btn btn-light">
              <i className="bi bi-arrow-left"></i> Quay lại
            </Link>
            <div>
              <Link to={`/admin/students/${id}/edit`} className="btn btn-primary me-2">
                <i className="bi bi-pencil"></i> Chỉnh sửa
              </Link>
              <button className="btn btn-outline-danger">
                <i className="bi bi-trash"></i> Xóa
              </button>
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
                      <div className="profile-image">
                        <img src={student.avatar} alt={student.name} />
                      </div>
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
                        <li>
                          <i className="bi bi-geo-alt"></i>
                          <div className="info-content">
                            <span className="info-label">Địa chỉ</span>
                            <span className="info-value">{student.address}</span>
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
                    <h3 className="card-title">Khóa học đang học</h3>

                    {student.enrolledCourses.length === 0 ? (
                      <div className="empty-state">
                        <p>Học viên chưa đăng ký khóa học nào.</p>
                      </div>
                    ) : (
                      <div className="enrolled-courses">
                        {student.enrolledCourses.map(course => (
                          <div className="course-item" key={course.id}>
                            <div className="course-header">
                              <h4>{course.name}</h4>
                              <span className={getStatusClass(course.status)}>
                                {getStatusText(course.status)}
                              </span>
                            </div>

                            <div className="course-dates">
                              <div>
                                <span className="date-label">Ngày bắt đầu:</span>
                                <span className="date-value">{formatDate(course.startDate)}</span>
                              </div>
                              <div>
                                <span className="date-label">Ngày kết thúc:</span>
                                <span className="date-value">{formatDate(course.endDate)}</span>
                              </div>
                            </div>

                            <div className="progress-wrapper">
                              <div className="progress-info">
                                <span>Tiến độ</span>
                                <span>{course.progress}%</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="course-actions">
                              <Link to={`/admin/courses/${course.id}`} className="btn btn-sm btn-outline-primary">
                                Chi tiết khóa học
                              </Link>
                              <button className="btn btn-sm btn-outline-secondary">
                                Xem lịch học
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="detail-card mt-4">
                    <h3 className="card-title">Hoạt động gần đây</h3>

                    <div className="timeline">
                      {student.activities.map((activity, index) => (
                        <div className="timeline-item" key={index}>
                          <div className="timeline-icon">
                            <i className={`bi ${getActivityIcon(activity.type)}`}></i>
                          </div>
                          <div className="timeline-content">
                            <p className="activity-description">{activity.description}</p>
                            <p className="activity-time">{formatDate(activity.date, true)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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