import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import './css/StudentForm.css';

function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    gender: 'male',
    status: 'active',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    try {
      // Mock data for demonstration
      setTimeout(() => {
        setFormData({
          name: 'Nguyễn Văn A',
          email: 'student@example.com',
          phone: '0987654321',
          address: '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
          birthday: '2000-01-15',
          gender: 'male',
          status: 'active',
          password: '',
          confirmPassword: ''
        });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Vui lòng chọn ngày sinh';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }

    // Only validate passwords in create mode or if provided in edit mode
    if (!isEditMode || formData.password) {
      if (!isEditMode && !formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
      } else if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }

      if (!isEditMode && !formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstError = document.querySelector('.form-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect after successful save
      navigate('/admin/students');

    } catch (error) {
      console.error('Error saving student:', error);
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
        <div className="admin-header">
          <div className="header-content">
            <h1 className="page-title">
              {isEditMode ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'}
            </h1>
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
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải thông tin học viên...</p>
            </div>
          ) : (
            <div className="student-form-container">
              <div className="form-card">
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <h3 className="section-title">Thông tin cá nhân</h3>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="name" className="form-label">Họ và tên <span className="required">*</span></label>
                          <input
                            type="text"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                          />
                          {errors.name && <div className="form-error">{errors.name}</div>}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
                          <input
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                          />
                          {errors.email && <div className="form-error">{errors.email}</div>}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="phone" className="form-label">Số điện thoại <span className="required">*</span></label>
                          <input
                            type="tel"
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                          {errors.phone && <div className="form-error">{errors.phone}</div>}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="birthday" className="form-label">Ngày sinh <span className="required">*</span></label>
                          <input
                            type="date"
                            className={`form-control ${errors.birthday ? 'is-invalid' : ''}`}
                            id="birthday"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleChange}
                          />
                          {errors.birthday && <div className="form-error">{errors.birthday}</div>}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="gender" className="form-label">Giới tính</label>
                          <select
                            className="form-select"
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="status" className="form-label">Trạng thái</label>
                          <select
                            className="form-select"
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                          >
                            <option value="active">Đang học</option>
                            <option value="inactive">Ngừng học</option>
                            <option value="pending">Chờ xác nhận</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-12 mb-3">
                        <div className="form-group">
                          <label htmlFor="address" className="form-label">Địa chỉ <span className="required">*</span></label>
                          <input
                            type="text"
                            className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                          />
                          {errors.address && <div className="form-error">{errors.address}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Thông tin tài khoản</h3>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="password" className="form-label">
                            {isEditMode ? 'Mật khẩu mới (để trống nếu không thay đổi)' : 'Mật khẩu'}
                            {!isEditMode && <span className="required">*</span>}
                          </label>
                          <input
                            type="password"
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                          />
                          {errors.password && <div className="form-error">{errors.password}</div>}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <label htmlFor="confirmPassword" className="form-label">
                            Xác nhận mật khẩu
                            {!isEditMode && <span className="required">*</span>}
                          </label>
                          <input
                            type="password"
                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                          />
                          {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-light" onClick={() => navigate('/admin/students')}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang lưu...
                        </>
                      ) : (
                        <>Lưu</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentForm;