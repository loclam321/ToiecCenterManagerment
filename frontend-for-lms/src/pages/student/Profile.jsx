import { getCurrentUser } from '../../services/authService';

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
                    <div className="text-muted small mb-1">Họ và tên</div>
                    <div className="fw-semibold">{name}</div>
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
                    <div className="fw-semibold">{phone}</div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Giới tính</div>
                    <div className="fw-semibold">{gender}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded-3">
                    <div className="text-muted small mb-1">Ngày sinh</div>
                    <div className="fw-semibold">{birthday}</div>
                  </div>
                </div>
              </div>
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
