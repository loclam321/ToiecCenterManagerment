import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';
import { getTeacherById, updateTeacher } from '../../services/teacherService';
import { uploadTeacherMedia } from '../../services/teacherLessonService';
import './css/TeacherProfileEditor.css';

function TeacherProfileEditor() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
  const response = await getTeacherById(currentUser?.user_id);
  const teacher = response.data?.teacher;
  setProfile(teacher);
  setForm({ ...teacher });
      } catch (err) {
        setError('Không thể tải thông tin giáo viên');
      } finally {
        setLoading(false);
      }
    }
    if (currentUser?.user_id) fetchProfile();
  }, [currentUser?.user_id]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
  await updateTeacher(currentUser?.user_id, form);
      setSuccess('Đã cập nhật thông tin thành công');
      setEditing(false);
      setProfile({ ...form });
    } catch (err) {
      setError('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="teacher-profile-editor card p-4">Đang tải...</div>;
  if (error) return <div className="teacher-profile-editor card p-4 text-danger">{error}</div>;
  if (!profile) return null;

  return (
    <div className="teacher-profile-editor card p-4">
      <h3 className="mb-3">Quản lý thông tin</h3>
      {success && <div className="alert alert-success">{success}</div>}
      {editing ? (
        <div className="profile-form">
          <div className="row g-3">
            <div className="col-md-6">
              <label>Tên giáo viên</label>
              <input type="text" className="form-control" value={form.user_name || ''} onChange={e => handleChange('user_name', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label>Giới tính</label>
              <select className="form-select" value={form.user_gender || ''} onChange={e => handleChange('user_gender', e.target.value)}>
                <option value="">Chọn</option>
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
                <option value="O">Khác</option>
              </select>
            </div>
            <div className="col-md-3">
              <label>Ngày sinh</label>
              <input type="date" className="form-control" value={form.user_birthday || ''} onChange={e => handleChange('user_birthday', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label>Email</label>
              <input type="email" className="form-control" value={form.user_email || ''} disabled />
            </div>
            <div className="col-md-6">
              <label>Điện thoại</label>
              <input type="text" className="form-control" value={form.user_telephone || ''} onChange={e => handleChange('user_telephone', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label>Chuyên môn</label>
              <input type="text" className="form-control" value={form.tch_specialization || ''} onChange={e => handleChange('tch_specialization', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label>Bằng cấp/Chứng chỉ</label>
              <input type="text" className="form-control" value={form.tch_qualification || ''} onChange={e => handleChange('tch_qualification', e.target.value)} disabled />
            </div>
            <div className="col-md-6">
              <label>Ngày tuyển dụng</label>
              <input type="date" className="form-control" value={form.tch_hire_date || ''} onChange={e => handleChange('tch_hire_date', e.target.value)} disabled />
            </div>
            <div className="col-md-6">
              <label>Avatar</label>
              {form.tch_avtlink && (
                <img
                  src={form.tch_avtlink}
                  alt="Avatar giáo viên"
                  className="img-thumbnail mb-2"
                  style={{ maxWidth: 120 }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLoading(true);
                  setError('');
                  try {
                    // Giả sử có hàm uploadTeacherMedia(mediaType, file) trả về { path }
                      const result = await uploadTeacherMedia('avatar', file);
                      // Đường dẫn sẽ là /avatar1/tenfile.png
                      const newPath = result.path;
                      setForm((prev) => ({ ...prev, tch_avtlink: newPath }));
                      // Persist to backend immediately
                      try {
                        await updateTeacher(currentUser?.user_id, { tch_avtlink: newPath });
                        setSuccess('Đã cập nhật avatar và lưu vào hệ thống');
                      } catch (uErr) {
                        setError('Upload xong nhưng lưu avatar vào hệ thống thất bại');
                      }
                  } catch (err) {
                    setError('Upload avatar thất bại');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
              <small className="text-muted">Ảnh sẽ được lưu tại /avatar1/ và phục vụ từ public/avatar1</small>
            </div>
          </div>
          <div className="mt-4 d-flex gap-2">
            <button className="btn btn-primary" onClick={handleSave}>Lưu thay đổi</button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Huỷ</button>
          </div>
        </div>
      ) : (
        <div className="profile-view">
          <div className="row g-3">
            <div className="col-md-6"><strong>Tên giáo viên:</strong> {profile.user_name}</div>
            <div className="col-md-3"><strong>Giới tính:</strong> {profile.user_gender}</div>
            <div className="col-md-6"><strong>Ngày sinh:</strong> {profile.user_birthday}</div>
            <div className="col-md-6"><strong>Email:</strong> {profile.user_email}</div>
            <div className="col-md-6"><strong>Điện thoại:</strong> {profile.user_telephone}</div>
            <div className="col-md-6"><strong>Chuyên môn:</strong> {profile.tch_specialization}</div>
            <div className="col-md-6"><strong>Bằng cấp/Chứng chỉ:</strong> {profile.tch_qualification}</div>
            <div className="col-md-6"><strong>Ngày tuyển dụng:</strong> {profile.tch_hire_date}</div>
          </div>
          <div className="mt-4">
            <button className="btn btn-warning" onClick={() => setEditing(true)}>Chỉnh sửa thông tin</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherProfileEditor;
