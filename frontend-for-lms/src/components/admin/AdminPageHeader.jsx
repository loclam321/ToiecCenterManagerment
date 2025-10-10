import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './css/AdminPageHeader.css';

function AdminPageHeader({
    title,
    subtitle,
    itemCount,
    itemName = 'item',
    addButtonText,
    addButtonLink,
    addButtonOnClick,
    notificationCount = 0,
    onNotificationClick,
    actions = []
}) {
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
                    {onNotificationClick && (
                        <button className="btn-icon notification-button" onClick={onNotificationClick}>
                            <i className="bi bi-bell"></i>
                            {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
                        </button>
                    )}
                </div>
            </div>
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
    )
};

export default AdminPageHeader;