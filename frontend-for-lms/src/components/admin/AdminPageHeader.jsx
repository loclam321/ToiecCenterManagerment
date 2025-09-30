import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './css/AdminPageHeader.css';

function AdminPageHeader({
    title,
    itemCount,
    itemName = 'item',
    addButtonText,
    addButtonLink,
    notificationCount = 0,
    onNotificationClick
}) {
    return (
        <div className="admin-header">
            <div className="header-content">
                <div className="header-title-section">
                    <h1 className="page-title">{title}</h1>
                    {itemCount !== undefined && (
                        <span className="item-count">{itemCount} {itemName}</span>
                    )}
                </div>

                <div className="header-actions">
                    {addButtonText && addButtonLink && (
                        <Link to={addButtonLink} className="btn btn-primary add-button">
                            <i className="bi bi-plus"></i> {addButtonText}
                        </Link>
                    )}

                    <button className="btn-icon notification-button" onClick={onNotificationClick}>
                        <i className="bi bi-bell"></i>
                        {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}

AdminPageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    itemCount: PropTypes.number,
    itemName: PropTypes.string,
    addButtonText: PropTypes.string,
    addButtonLink: PropTypes.string,
    notificationCount: PropTypes.number,
    onNotificationClick: PropTypes.func
};

export default AdminPageHeader;