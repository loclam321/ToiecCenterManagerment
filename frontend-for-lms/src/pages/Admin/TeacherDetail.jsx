import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getTeacherById, mapTeacherFromApi } from '../../services/teacherService';
import './css/TeacherDetail.css';

function TeacherDetail() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    fetchTeacherDetails();
  }, [id]);

  const fetchTeacherDetails = async () => {
    setLoading(true);
    try {
      const result = await getTeacherById(id);
      const mappedTeacher = mapTeacherFromApi(result);
      setTeacher(mappedTeacher);
    } catch (error) {
      console.error('Error fetching teacher details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge success';
      case 'inactive': return 'status-badge danger';
      case 'pending': return 'status-badge warning';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang dạy';
      case 'inactive': return 'Ngừng dạy';
      case 'pending': return 'Chờ xác nhận';
      default: return 'Không xác định';
    }
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        <AdminPageHeader
          title="Chi tiết giáo viên"
          notificationCount={3}
          onNotificationClick={() => console.log('Notifications')}
        />

        <div className="admin-content">
          <div className="page-actions">
            <Link to="/admin/teachers" className="btn btn-light">
              <i className="bi bi-arrow-left"></i> Quay lại
            </Link>
            <div>
              <Link to={`/admin/teachers/${id}/edit`} className="btn btn-primary me-2">
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
              <p>Đang tải thông tin giáo viên...</p>
            </div>
          ) : teacher ? (
            <div className="teacher-detail">
              <div className="row">
                <div className="col-lg-4">
                  <div className="detail-card">
                    <div className="teacher-profile">
                      <div className="profile-image">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`} 
                          alt={teacher.name} 
                        />
                      </div>
                      <div className="profile-info">
                        <h2>{teacher.name}</h2>
                        <p className="teacher-id">{teacher.id}</p>
                        <span className={getStatusClass(teacher.status)}>
                          {getStatusText(teacher.status)}
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
                            <span className="info-value">{teacher.email}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-telephone"></i>
                          <div className="info-content">
                            <span className="info-label">Số điện thoại</span>
                            <span className="info-value">{teacher.phone}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-calendar3"></i>
                          <div className="info-content">
                            <span className="info-label">Ngày sinh</span>
                            <span className="info-value">{formatDate(teacher.birthday)}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-gender-ambiguous"></i>
                          <div className="info-content">
                            <span className="info-label">Giới tính</span>
                            <span className="info-value">{getGenderText(teacher.gender)}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="info-section">
                      <h3 className="section-heading">Thông tin chuyên môn</h3>
                      <ul className="info-list">
                        <li>
                          <i className="bi bi-mortarboard"></i>
                          <div className="info-content">
                            <span className="info-label">Chuyên môn</span>
                            <span className="info-value">{teacher.specialization || 'Chưa cập nhật'}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-clock-history"></i>
                          <div className="info-content">
                            <span className="info-label">Kinh nghiệm</span>
                            <span className="info-value">{teacher.experience} năm</span>
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
                            <span className="info-label">Ngày tham gia</span>
                            <span className="info-value">{formatDate(teacher.createdAt, true)}</span>
                          </div>
                        </li>
                        <li>
                          <i className="bi bi-clock-history"></i>
                          <div className="info-content">
                            <span className="info-label">Cập nhật cuối</span>
                            <span className="info-value">{formatDate(teacher.updatedAt, true)}</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-8">
                  <div className="detail-card">
                    <h3 className="card-title">Lớp học đang dạy</h3>
                    
                    <div className="classes-list">
                      {/* Mock data - thay thế bằng API thực tế */}
                      <div className="class-item">
                        <div className="class-header">
                          <h4>TOEIC 500+ - Lớp A1</h4>
                          <span className="status-badge success">Đang học</span>
                        </div>
                        <div className="class-details">
                          <div className="detail-row">
                            <span className="label">Thời gian:</span>
                            <span className="value">Thứ 2, 4, 6 - 18:00 - 20:00</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Sĩ số:</span>
                            <span className="value">25/30 học viên</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Thời hạn:</span>
                            <span className="value">01/09/2024 - 31/12/2024</span>
                          </div>
                        </div>
                        <div className="class-actions">
                          <Link to="/admin/classes/1" className="btn btn-sm btn-outline-primary">
                            Chi tiết lớp học
                          </Link>
                          <button className="btn btn-sm btn-outline-secondary">
                            Danh sách học viên
                          </button>
                        </div>
                      </div>
                      
                      <div className="class-item">
                        <div className="class-header">
                          <h4>TOEIC Speaking - Lớp B2</h4>
                          <span className="status-badge success">Đang học</span>
                        </div>
                        <div className="class-details">
                          <div className="detail-row">
                            <span className="label">Thời gian:</span>
                            <span className="value">Thứ 3, 5 - 19:00 - 21:00</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Sĩ số:</span>
                            <span className="value">15/20 học viên</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Thời hạn:</span>
                            <span className="value">15/09/2024 - 15/12/2024</span>
                          </div>
                        </div>
                        <div className="class-actions">
                          <Link to="/admin/classes/2" className="btn btn-sm btn-outline-primary">
                            Chi tiết lớp học
                          </Link>
                          <button className="btn btn-sm btn-outline-secondary">
                            Danh sách học viên
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-card mt-4">
                    <h3 className="card-title">Lịch sử giảng dạy</h3>
                    
                    <div className="teaching-history">
                      <div className="history-item">
                        <div className="history-icon">
                          <i className="bi bi-calendar-check"></i>
                        </div>
                        <div className="history-content">
                          <p className="history-description">Hoàn thành khóa TOEIC 450+ - Lớp C1</p>
                          <p className="history-time">01/2024 - 06/2024</p>
                        </div>
                      </div>
                      
                      <div className="history-item">
                        <div className="history-icon">
                          <i className="bi bi-calendar-check"></i>
                        </div>
                        <div className="history-content">
                          <p className="history-description">Hoàn thành khóa IELTS Speaking - Lớp A3</p>
                          <p className="history-time">09/2023 - 12/2023</p>
                        </div>
                      </div>
                      
                      <div className="history-item">
                        <div className="history-icon">
                          <i className="bi bi-calendar-check"></i>
                        </div>
                        <div className="history-content">
                          <p className="history-description">Hoàn thành khóa Business English - Lớp B1</p>
                          <p className="history-time">03/2023 - 08/2023</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-exclamation-circle"></i>
              <p>Không tìm thấy thông tin giáo viên.</p>
              <Link to="/admin/teachers" className="btn btn-primary">
                Quay lại danh sách giáo viên
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDetail;