import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { createTeacher, updateTeacher, getTeacherById, mapTeacherFromApi, mapTeacherToApi } from '../../services/teacherService';
import { toast } from 'react-toastify';
import './css/TeacherForm.css';

function TeacherForm() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'male',
    specialization: '',
    qualification: '',
    hireDate: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchTeacherData();
    }
  }, [id]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const result = await getTeacherById(id);
      const mappedTeacher = mapTeacherFromApi(result);
      setTeacher({
        ...mappedTeacher,
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching teacher:', error);
      toast.error('Không thể tải thông tin giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTeacher(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!teacher.name.trim()) {
      newErrors.name = 'Tên giáo viên không được để trống';
    }
    
    if (!teacher.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(teacher.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!teacher.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(teacher.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!teacher.birthday) {
      newErrors.birthday = 'Ngày sinh không được để trống';
    }
    
    if (!teacher.specialization.trim()) {
      newErrors.specialization = 'Chuyên môn không được để trống';
    }
    
    if (!teacher.qualification.trim()) {
      newErrors.qualification = 'Trình độ không được để trống';
    }
    
    if (!teacher.hireDate) {
      newErrors.hireDate = 'Ngày bắt đầu làm việc không được để trống';
    }
    
    // Validate password only for new teacher creation
    if (!isEditing) {
      if (!teacher.password) {
        newErrors.password = 'Mật khẩu không được để trống';
      } else if (teacher.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      
      if (!teacher.confirmPassword) {
        newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
      } else if (teacher.password !== teacher.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const teacherData = mapTeacherToApi(teacher);
      
      let result;
      if (isEditing) {
        result = await updateTeacher(id, teacherData);
        toast.success('Cập nhật thông tin giáo viên thành công!');
      } else {
        result = await createTeacher(teacherData);
        toast.success('Thêm giáo viên mới thành công!');
      }
      
      navigate('/admin/teachers');
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast.error(isEditing 
        ? 'Cập nhật thông tin giáo viên thất bại' 
        : 'Thêm giáo viên mới thất bại'
      );
      setErrors({ submit: 'Có lỗi xảy ra khi lưu thông tin giáo viên' });
    } finally {
      setSaving(false);
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
          title={isEditing ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'}
          notificationCount={3}
          onNotificationClick={() => console.log('Notifications')}
        />

        <div className="admin-content">
          <div className="page-actions">
            <Link to="/admin/teachers" className="btn btn-light">
              <i className="bi bi-arrow-left"></i> Quay lại
            </Link>
          </div>

          <div className="teacher-form-container">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="teacher-form">
                <div className="form-header">
                  <h2 className="form-title">
                    {isEditing ? 'Chỉnh sửa thông tin giáo viên' : 'Thêm giáo viên mới'}
                  </h2>
                  <p className="form-description">
                    {isEditing 
                      ? 'Cập nhật thông tin chi tiết của giáo viên' 
                      : 'Điền đầy đủ thông tin để tạo tài khoản giáo viên mới'
                    }
                  </p>
                </div>

                {errors.submit && (
                  <div className="alert alert-error">
                    <i className="bi bi-exclamation-triangle"></i>
                    {errors.submit}
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-section">
                    <h3 className="section-title">Thông tin cá nhân</h3>
                    
                    <div className="form-group">
                      <label htmlFor="name">Họ và tên <span className="required">*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={teacher.name}
                        onChange={handleInputChange}
                        className={errors.name ? 'error' : ''}
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email <span className="required">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={teacher.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'error' : ''}
                        placeholder="example@email.com"
                        readOnly={isEditing} // Không cho phép sửa email nếu đang edit
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Số điện thoại <span className="required">*</span></label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={teacher.phone}
                        onChange={handleInputChange}
                        className={errors.phone ? 'error' : ''}
                        placeholder="0912345678"
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="birthday">Ngày sinh <span className="required">*</span></label>
                        <input
                          type="date"
                          id="birthday"
                          name="birthday"
                          value={teacher.birthday}
                          onChange={handleInputChange}
                          className={errors.birthday ? 'error' : ''}
                        />
                        {errors.birthday && <span className="error-message">{errors.birthday}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="gender">Giới tính <span className="required">*</span></label>
                        <select
                          id="gender"
                          name="gender"
                          value={teacher.gender}
                          onChange={handleInputChange}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Thông tin chuyên môn</h3>

                    <div className="form-group">
                      <label htmlFor="specialization">Chuyên môn <span className="required">*</span></label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={teacher.specialization}
                        onChange={handleInputChange}
                        className={errors.specialization ? 'error' : ''}
                      >
                        <option value="">Chọn chuyên môn</option>
                        <option value="TOEIC">TOEIC</option>
                        <option value="IELTS">IELTS</option>
                        <option value="TOEIC Speaking">TOEIC Speaking</option>
                        <option value="Business English">Business English</option>
                        <option value="General English">General English</option>
                        <option value="Academic English">Academic English</option>
                      </select>
                      {errors.specialization && <span className="error-message">{errors.specialization}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="qualification">Trình độ chuyên môn <span className="required">*</span></label>
                      <input
                        type="text"
                        id="qualification"
                        name="qualification"
                        value={teacher.qualification}
                        onChange={handleInputChange}
                        className={errors.qualification ? 'error' : ''}
                        placeholder="Cử nhân, Thạc sĩ..."
                      />
                      {errors.qualification && <span className="error-message">{errors.qualification}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="hireDate">Ngày bắt đầu làm việc <span className="required">*</span></label>
                      <input
                        type="date"
                        id="hireDate"
                        name="hireDate"
                        value={teacher.hireDate}
                        onChange={handleInputChange}
                        className={errors.hireDate ? 'error' : ''}
                      />
                      {errors.hireDate && <span className="error-message">{errors.hireDate}</span>}
                    </div>

                    {!isEditing && (
                      <div className="form-section">
                        <h3 className="section-title">Thông tin tài khoản</h3>
                        
                        <div className="form-group">
                          <label htmlFor="password">Mật khẩu <span className="required">*</span></label>
                          <input
                            type="password"
                            id="password"
                            name="password"
                            value={teacher.password}
                            onChange={handleInputChange}
                            className={errors.password ? 'error' : ''}
                          />
                          {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="required">*</span></label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={teacher.confirmPassword}
                            onChange={handleInputChange}
                            className={errors.confirmPassword ? 'error' : ''}
                          />
                          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <Link to="/admin/teachers" className="btn btn-outline-secondary">
                    Hủy bỏ
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="spinner-sm"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check"></i>
                        {isEditing ? 'Cập nhật' : 'Thêm giáo viên'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherForm;