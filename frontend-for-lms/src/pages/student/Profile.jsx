import { useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import { updateOwnProfile } from '../../services/studentService';

export default function StudentProfile() {
  const user = getCurrentUser();
  const role = (localStorage.getItem('role') || 'student').toString().trim().toLowerCase();

  if (!user) {
    return (
      <div className="card p-4">
        <h5 className="mb-2">Hồ sơ cá nhân</h5>
        <p className="text-muted mb-0">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  const name = user.user_name || 'Học viên';
  const email = user.user_email || '-';
  const phone = user.user_telephone || '-';
  const userId = user.user_id ?? '-';
  const gender = user.user_gender === 'M' ? 'Nam' : user.user_gender === 'F' ? 'Nữ' : (user.user_gender ? 'Khác' : '-');
  const birthday = user.user_birthday ? new Date(user.user_birthday).toLocaleDateString() : '-';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    user_name: user.user_name || '',
    user_telephone: user.user_telephone || '',
    user_gender: user.user_gender || '',
    user_birthday: user.user_birthday || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Note: Avatar/summary is shown in the StudentSidebar user-section, so we omit it here to avoid duplication

  return (
    <div className="container-fluid p-0">
      <div className="row g-3">
        {/* Details */}
        <div className="col-12">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Thông tin cá nhân</h5>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Mã học viên</div>
                    <div className="fw-semibold">{userId}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1 d-flex justify-content-between">
                      <span>Họ và tên</span>
                      {!editing && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(true)}>Chỉnh sửa</button>
                      )}
                    </div>
                    {editing ? (
                      <input className="form-control" value={form.user_name} onChange={(e) => setForm(f => ({...f, user_name: e.target.value}))} />
                    ) : (
                      <div className="fw-semibold">{name}</div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Email</div>
                    <div className="fw-semibold">{email}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Số điện thoại</div>
                    {editing ? (
                      <input className="form-control" value={form.user_telephone} onChange={(e) => setForm(f => ({...f, user_telephone: e.target.value}))} />
                    ) : (
                      <div className="fw-semibold">{phone}</div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Giới tính</div>
                    {editing ? (
                      <select className="form-select" value={form.user_gender} onChange={(e) => setForm(f => ({...f, user_gender: e.target.value}))}>
                        <option value="">Chọn</option>
                        <option value="M">Nam</option>
                        <option value="F">Nữ</option>
                        <option value="O">Khác</option>
                      </select>
                    ) : (
                      <div className="fw-semibold">{gender}</div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Ngày sinh</div>
                    {editing ? (
                      <input type="date" className="form-control" value={form.user_birthday || ''} onChange={(e) => setForm(f => ({...f, user_birthday: e.target.value}))} />
                    ) : (
                      <div className="fw-semibold">{birthday}</div>
                    )}
                  </div>
                </div>
              </div>
              {editing && (
                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-primary" disabled={loading} onClick={async () => {
                    setError(''); setSuccess('');
                    // simple validation
                    if (!form.user_name || form.user_name.trim().length < 2) {
                      setError('Tên phải có ít nhất 2 ký tự'); return;
                    }
                    if (form.user_telephone && form.user_telephone.length > 20) { setError('Số điện thoại không hợp lệ'); return; }
                    setLoading(true);
                    try {
                      const updated = await updateOwnProfile({
                        user_name: form.user_name,
                        user_telephone: form.user_telephone,
                        user_gender: form.user_gender,
                        user_birthday: form.user_birthday || null
                      });
                      if (updated) {
                        // reload page data briefly by replacing window user (simple approach)
                        const stored = JSON.parse(localStorage.getItem('user') || '{}');
                        const newUser = { ...stored, ...updated };
                        localStorage.setItem('user', JSON.stringify(newUser));
                        setSuccess('Cập nhật thành công');
                        setEditing(false);
                        setTimeout(()=>setSuccess(''), 2500);
                      }
                    } catch (e) {
                      setError(e.message || 'Lưu thất bại');
                    } finally { setLoading(false); }
                  }}>Lưu</button>
                  <button className="btn btn-secondary" disabled={loading} onClick={() => { setEditing(false); setError(''); setForm({ user_name: user.user_name || '', user_telephone: user.user_telephone || '', user_gender: user.user_gender || '', user_birthday: user.user_birthday || '' }); }}>Hủy</button>
                </div>
              )}
              {error && <div className="text-danger mt-2">{error}</div>}
              {success && <div className="text-success mt-2">{success}</div>}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Tài khoản</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item px-0 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-semibold">Vai trò</div>
                    <div className="text-muted small">Quyền truy cập hiện tại</div>
                  </div>
                  <span className="badge text-bg-secondary text-uppercase">{role}</span>
                </li>
                <li className="list-group-item px-0 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-semibold">Trạng thái email</div>
                    <div className="text-muted small">Liên hệ quản trị để thay đổi</div>
                  </div>
                  <span className="badge text-bg-success">Đang sử dụng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
