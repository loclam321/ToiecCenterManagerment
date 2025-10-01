import React from 'react';
import PropTypes from 'prop-types';
import './PageDetailHeader.css';

function PageDetailHeader({ 
  entityCode, 
  title, 
  description, 
  status, 
  statusBadgeClass, 
  statusText,
  subtitle,
  subtitleLink,
  type = 'course' // 'course' or 'class' or any other entity type
}) {
  return (
    <div className={`detail-header ${type}-header`}>
      <div className="title-section">
        {entityCode && (
          <div className={`entity-code ${type}-code`}>{entityCode}</div>
        )}
        <h1 className={`entity-title ${type}-title`}>{title}</h1>
        {description && (
          <p className={`entity-description ${type}-description`}>{description}</p>
        )}
        {subtitle && (
          <p className="entity-subtitle">
            {subtitleLink ? (
              <>
                {type === 'class' ? 'Khóa học: ' : ''}
                <a href={subtitleLink.url} className="link-text">
                  {subtitle}
                </a>
              </>
            ) : (
              subtitle
            )}
          </p>
        )}
      </div>

      {status && (
        <div className={`entity-status ${type}-status`}>
          <span className={`status-badge ${statusBadgeClass}`}>
            {statusText}
          </span>
        </div>
      )}
    </div>
  );
}

PageDetailHeader.propTypes = {
  entityCode: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  status: PropTypes.string,
  statusBadgeClass: PropTypes.string,
  statusText: PropTypes.string,
  subtitle: PropTypes.string,
  subtitleLink: PropTypes.shape({
    url: PropTypes.string.isRequired,
    text: PropTypes.string
  }),
  type: PropTypes.string // 'course' hoặc 'class' hoặc loại entity khác
};

export default PageDetailHeader;