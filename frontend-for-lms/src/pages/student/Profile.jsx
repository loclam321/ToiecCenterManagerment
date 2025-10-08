import { getCurrentUser } from '../../services/authService';

export default function StudentProfile() {
  const user = getCurrentUser();
  return (
    <div className="card p-3">
      <h5>Hồ sơ cá nhân</h5>
      {user ? (
        <ul className="list-unstyled">
          <li><strong>ID:</strong> {user.user_id}</li>
          <li><strong>Họ tên:</strong> {user.user_name}</li>
          <li><strong>Email:</strong> {user.user_email}</li>
          <li><strong>Số điện thoại:</strong> {user.user_telephone || '-'}</li>
        </ul>
      ) : (
        <p>Không tìm thấy thông tin người dùng.</p>
      )}
    </div>
  );
}
