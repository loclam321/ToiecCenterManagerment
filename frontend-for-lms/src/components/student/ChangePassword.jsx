import React, { useState } from "react";
import { resetPassword } from "../../services/authService";

export default function ChangePasswordModal({ show, onClose, onSuccess, user }) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const role = localStorage.getItem('role')

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Xác nhận mật khẩu không khớp.");
            return;
        }

        setSaving(true);
        try {
            // Gọi API đổi mật khẩu thực tế

            await resetPassword({
                user_id: user?.user_id,
                role: role,
                old_password: oldPassword,
                new_password: newPassword
            })
            setSaving(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setSaving(false);
            setError(err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content change-password-modal">
                <div className="modal-header">
                    <h5>Đổi mật khẩu</h5>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="form-group">
                        <label>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.18); z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .modal-content.change-password-modal {
          background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(60,72,88,0.18); min-width: 260px; max-width: 340px; width: 100%; padding: 0;
        }
        .modal-header {
          padding: 14px 18px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;
        }
        .modal-header h5 { margin: 0; font-size: 0.92rem; font-weight: 600; }
        .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #888; }
        .modal-body { padding: 14px; }
        .form-group { margin-bottom: 10px; }
        .form-group label { font-weight: 500; margin-bottom: 3px; display: block; font-size: 0.89rem; }
        .form-group input { width: 100%; padding: 6px 9px; border-radius: 7px; border: 1px solid #cbd5e1; font-size: 0.89rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 7px; }
        .btn { padding: 6px 12px; border-radius: 7px; font-size: 0.89rem; font-weight: 500; border: none; cursor: pointer; }
        .btn-primary { background: linear-gradient(90deg,#6366f1 0,#38bdf8 100%); color: #fff; }
        .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
        .alert-danger { background: #fee2e2; color: #dc2626; padding: 6px 9px; border-radius: 7px; margin-bottom: 7px; font-size: 0.89rem; }
      `}</style>
        </div>
    );
}