import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { createTeacher, updateTeacher, getTeacherById, mapTeacherFromApi, mapTeacherToApi } from '../../services/teacherService';
import { toast } from 'react-toastify';
import './css/TeacherForm.css';
import { uploadTeacherMedia } from '../../services/teacherLessonService';
import { mapStudentToApi } from '../../services/studentService';

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
  // upload avatar states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

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

  const applyPrefill = (data) => {
    // data is the JSON you provided in the prompt
    setTeacher(prev => ({
      ...prev,
      name: data.user_name || prev.name,
      email: data.user_email || prev.email,
      gender: data.user_gender === 'M' ? 'male' : data.user_gender === 'F' ? 'female' : prev.gender,
      birthday: data.user_birthday || prev.birthday,
      phone: data.user_telephone || prev.phone,
      specialization: data.tch_specialization || prev.specialization,
      qualification: data.tch_qualification || prev.qualification,
      hireDate: data.tch_hire_date || prev.hireDate,
      // Only set password if provided (be careful with plain-text passwords)
      password: data.user_password || prev.password,
      confirmPassword: data.user_password || prev.confirmPassword
    }));

    // if API returns an avatar link, use it as preview (no file upload)
    if (data.tch_avtlink) {
      setAvatarPreview(data.tch_avtlink);
      setAvatarFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      // Upload avatar file first only if user selected one.
      let avatarUrl = teacher.tch_avtlink ?? null;
      if (avatarFile) {
        avatarUrl = await uploadAvatarFile(avatarFile);
        if (!avatarUrl) {
          setErrors(prev => ({ ...prev, avatar: 'Upload avatar thất bại' }));
          toast.error('Upload avatar thất bại');
          setSaving(false);
          return;
        }
        // update local state for preview / payload
        setTeacher(prev => ({ ...prev, tch_avtlink: avatarUrl }));
        setAvatarPreview(avatarUrl);
        setAvatarFile(null);
        if (isEditing) {
          await updateTeacher(id, { tch_avtlink: avatarUrl });
          toast.success('Đã cập nhật avatar và lưu vào hệ thống');
        }
      }

      const jsonPayload = {
        user_name: teacher.name,
        user_email: teacher.email,
        user_gender:
          teacher.gender === 'male' ? 'M' :
            teacher.gender === 'female' ? 'F' : undefined,
        user_birthday: teacher.birthday,
        user_telephone: teacher.phone,
        tch_specialization: teacher.specialization,
        tch_qualification: teacher.qualification,
        tch_hire_date: teacher.hireDate,
        tch_avtlink: avatarUrl,
        is_email_verified: true,
      };

      // include password only when creating a new teacher
      if (!isEditing && teacher.password) {
        jsonPayload.user_password = teacher.password;
      }

      console.log('Prepared JSON payload for submission:', jsonPayload);
      console.log('Is Editing:', isEditing);
      // Always send JSON (avatar already uploaded above). Use trailing slash for create to avoid 308.
      const url = isEditing
        ? `http://127.0.0.1:5000/api/teachers/${id}`
        : `http://127.0.0.1:5000/api/teachers/`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(jsonPayload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Lưu giáo viên thất bại');
      const apiTeacher = json?.data?.teacher ?? json?.data ?? json;
      const mapped = mapTeacherFromApi(apiTeacher);
      // ensure controlled inputs stay defined
      setTeacher({ ...mapped, password: '', confirmPassword: '' });

      // update preview if backend returned avatar link
      setAvatarPreview(mapped.tch_avtlink ?? '');

      toast.success('Thêm giáo viên thành công');
      navigate('/admin/teachers');
    } catch (err) {
      console.error('Error saving teacher:', err);
      setErrors(prev => ({ ...prev, submit: err.message || 'Có lỗi xảy ra' }));
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };


  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Hàm upload file avatar, trả về đường dẫn ảnh hoặc null nếu lỗi
  const uploadAvatarFile = async (file) => {
    try {
      // Gọi API uploadTeacherMedia để lấy đường dẫn file
      const result = await uploadTeacherMedia('avatar', file);
      // Nếu upload thành công, trả về đường dẫn file
      if (result && result.path) {
        console.log('Uploaded avatar path:', result.path);
        return result.path;
      }
      return null;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      return null;
    }
  };

  // handle file selection + preview
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setErrors(prev => ({ ...prev, avatar: '' }));

    // Hiển thị preview ngay
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Thêm: xóa avatar hiện tại (clear)
  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setTeacher(prev => ({ ...prev, tch_avtlink: null }));
  };

  useEffect(() => {
    // if editing and teacher data has avatar url, set preview
    if (isEditing && teacher?.avatar_url) {
      setAvatarPreview(teacher.avatar_url);
    }
  }, [isEditing, teacher?.avatar_url]);

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
                        value={teacher.name ?? ''}
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
                        value={teacher.email ?? ''}
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
                        value={teacher.phone ?? ''}
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
                          value={teacher.birthday ?? ''}
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
                          value={teacher.gender ?? 'male'}
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
                        value={teacher.specialization ?? ''}
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
                        value={teacher.qualification ?? ''}
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
                        value={teacher.hireDate ?? ''}
                        onChange={handleInputChange}
                        className={errors.hireDate ? 'error' : ''}
                      />
                      {errors.hireDate && <span className="error-message">{errors.hireDate}</span>}
                    </div>

                    {!isEditing && (
                      <div className="form-section account-section">
                        <h3 className="section-title">Thông tin tài khoản</h3>
                        <div className="account-grid">
                          <div className="form-group">
                            <label htmlFor="password">Mật khẩu <span className="required">*</span></label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={teacher.password ?? ''}
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
                              value={teacher.confirmPassword ?? ''}
                              onChange={handleInputChange}
                              className={errors.confirmPassword ? 'error' : ''}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar upload UI */}
                <div className="form-group">
                  <label>Ảnh đại diện</label>
                  <div className="avatar-upload modern-avatar-upload">
                    <div
                      className="avatar-wrapper"
                      onClick={() => document.getElementById('avatarInput')?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('avatarInput')?.click(); }}
                      aria-label="Chọn ảnh đại diện"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="preview" className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">
                          <i className="bi bi-person" style={{ fontSize: 28 }}></i>
                        </div>
                      )}
                      <div className="avatar-overlay">
                        <button type="button" className="avatar-edit-btn" title="Thay ảnh">
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    </div>

                    <input
                      id="avatarInput"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />

                    <div className="avatar-actions">
                      <button
                        type="button"
                        className="btn btn-outline-secondary avatar-remove-btn"
                        onClick={handleAvatarRemove}
                        disabled={!avatarPreview && !avatarFile}
                      >
                        <i className="bi bi-trash"></i> Xóa
                      </button>
                    </div>
                  </div>
                  <small className="muted">Định dạng: JPG, PNG. Kích thước tối đa: 2MB.</small>
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