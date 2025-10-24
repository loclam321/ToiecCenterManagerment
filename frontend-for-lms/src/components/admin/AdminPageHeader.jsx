import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './css/AdminPageHeader.css';
import NotificationsModal from './NotificationsModal'; // added import

function AdminPageHeader({
    title,
    subtitle,
    itemCount,
    itemName = 'item',
    addButtonText,
    addButtonLink,
    addButtonOnClick,
    actions = [],
    onNotificationClick,
}) {
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]); // list for modal
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        let intervalId;
        const adminToken = localStorage.getItem('token');

        const fetchConsultCount = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/api/consult-registrations/count', {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                const data = await res.json();
                setNotificationCount(data.count);
            } catch (e) {
                // Xử lý lỗi nếu cần
            }
        };

        fetchConsultCount();
        intervalId = setInterval(fetchConsultCount, 5000);

        return () => clearInterval(intervalId);
    }, []);

    // fetch notifications list when opening modal (or you can poll separately)
    const fetchNotificationsList = async () => {
        try {
            const adminToken = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:5000/api/consult-registrations/all', {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            const json = await res.json();
            // API trả về { data: [...], success: true, total: N }
            const items = Array.isArray(json.data) ? json.data : [];
            setNotifications(items);
            // cập nhật badge count (dùng total nếu server cung cấp)
            if (typeof json.total === 'number') {
                setNotificationCount(json.total);
            } else {
                setNotificationCount(items.length);
            }
        } catch (e) {
            setNotifications([]);
        }
    };

    const handleOpenNotifications = async () => {
        setShowNotifications(true);
        await fetchNotificationsList();
        if (onNotificationClick) onNotificationClick();
    };

    const handleCloseNotifications = () => {
        setShowNotifications(false);
    };

    const handleMarkRead = async (notif) => {
        try {
            const adminToken = localStorage.getItem('token');
            // example endpoint to mark read; adjust to your API
            await fetch(`http://127.0.0.1:5000/api/consult-registrations/${notif.consult_id || notif.id}/mark-read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            // update local state
            setNotifications(prev => prev.map(n => (n.consult_id === notif.consult_id || n.id === notif.id) ? { ...n, read: true } : n));
            setNotificationCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            // handle error if needed
        }
    };

    return (
        <div className="admin-header">
            <div className="header-content">
                <div className="header-title-section">
                    <h1 className="page-title">{title}</h1>
                    {subtitle && (
                        <p className="page-subtitle">{subtitle}</p>
                    )}
                    {itemCount !== undefined && (
                        <span className="item-count">{itemCount} {itemName}</span>
                    )}
                </div>

                <div className="header-actions">
                    {/* Hỗ trợ addButtonText & addButtonLink (cách cũ) */}
                    {addButtonText && addButtonLink && (
                        <Link to={addButtonLink} className="btn btn-primary add-button">
                            <i className="fas fa-plus"></i> {addButtonText}
                        </Link>
                    )}

                    {/* Hỗ trợ addButtonText & addButtonOnClick */}
                    {addButtonText && addButtonOnClick && !addButtonLink && (
                        <button onClick={addButtonOnClick} className="btn btn-primary add-button">
                            <i className="fas fa-plus"></i> {addButtonText}
                        </button>
                    )}

                    {/* Hỗ trợ mảng actions (cách mới) */}
                    {actions.length > 0 && actions.map((action, index) => {
                        if (action.type === 'button') {
                            return (
                                <button
                                    key={`action-${index}`}
                                    onClick={action.onClick}
                                    className={`btn btn-${action.variant || 'primary'} action-button`}
                                >
                                    {action.icon && <i className={action.icon}></i>}
                                    {action.text}
                                </button>
                            );
                        } else if (action.type === 'link') {
                            return (
                                <Link
                                    key={`action-${index}`}
                                    to={action.to}
                                    className={`btn btn-${action.variant || 'primary'} action-button`}
                                >
                                    {action.icon && <i className={action.icon}></i>}
                                    {action.text}
                                </Link>
                            );
                        }
                        return null;
                    })}

                    {/* Button thông báo */}
                    <button className="btn-icon notification-button" onClick={handleOpenNotifications}>
                        <i className="bi bi-bell"></i>
                        {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
                    </button>
                </div>
            </div>

            {/* Notifications modal */}
            <NotificationsModal
                visible={showNotifications}
                onClose={handleCloseNotifications}
                notifications={notifications}
                onMarkRead={handleMarkRead}
            />
        </div>
    );
}

AdminPageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    itemCount: PropTypes.number,
    itemName: PropTypes.string,
    addButtonText: PropTypes.string,
    addButtonLink: PropTypes.string,
    addButtonOnClick: PropTypes.func,
    notificationCount: PropTypes.number,
    onNotificationClick: PropTypes.func,
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.oneOf(['button', 'link']).isRequired,
            text: PropTypes.string.isRequired,
            icon: PropTypes.string,
            variant: PropTypes.string,
            onClick: PropTypes.func,
            to: PropTypes.string
        })
    ),
};

export default AdminPageHeader;