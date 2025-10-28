import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './css/NotificationsModal.css';

const NotificationsModal = ({ visible, onClose, notifications = [], onMarkRead }) => {
    const navigate = useNavigate();

    if (!visible) return null;

    const handleOpenStudentForm = (n) => {
        console.log('Opening Student Form with notification:', n);  
        const prefill = {
            notifications_id: n.cr_id,
            start_level: n.cr_startlv || '',
            name: n.cr_fullname || '',
            email: n.cr_email || '',
            phone: n.cr_phone || '',
            birthday: n.cr_birthday || '',
            gender: n.cr_gender === 'M' ? 'male' : n.cr_gender === 'F' ? 'female' : 'other',
            course: n.course ? `${n.course.course_name}` : ''
        };
        onClose();
        // navigate to create student route and pass prefill in location.state
        navigate('/admin/students/add', { state: { prefill } });
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-container notifications-modal">
                <div className="modal-header">
                    <h3>Thông báo</h3>
                    <button className="btn-close-modal" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {notifications.length === 0 ? (
                        <div className="empty-notifications">Không có thông báo mới.</div>
                    ) : (
                        <ul className="notifications-list">
                            {notifications.map((n) => (
                                // clicking the list item opens StudentForm with prefill
                                <li
                                    key={n.cr_id}
                                    className={`notification-item ${n.read ? 'read' : 'unread'}`}
                                    onClick={() => handleOpenStudentForm(n)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleOpenStudentForm(n); }}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {n.course?.course_name || `Đăng ký tư vấn #${n.cr_id}`}
                                        </div>
                                        <div className="notification-body">
                                            <div><strong>Họ và tên:</strong> {n.cr_fullname}</div>
                                            <div><strong>SĐT:</strong> {n.cr_phone}</div>
                                            <div><strong>Email:</strong> {n.cr_email}</div>
                                            <div><strong>Khóa:</strong> {n.course?.course_code} (Level: {n.course?.level})</div>
                                        </div>
                                        <div className="notification-meta">
                                            {n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : ''}
                                        </div>
                                    </div>
                                    <div className="notification-actions">
                                        {!n.read && (
                                            <button
                                                className="btn btn-link mark-read"
                                                onClick={(e) => { e.stopPropagation(); onMarkRead && onMarkRead(n); }}
                                            >
                                                Đánh dấu đã đọc
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

NotificationsModal.propTypes = {
    visible: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    notifications: PropTypes.array,
    onMarkRead: PropTypes.func
};

export default NotificationsModal;