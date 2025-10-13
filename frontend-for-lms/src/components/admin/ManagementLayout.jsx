import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './Adminsidebar';
import AdminPageHeader from './AdminPageHeader';
import '../../pages/Admin/css/Adminpage.css';

function ManagementLayout({
  menuItems,
  basePath,
  titleResolver,
  defaultTitle = 'Trang quản trị',
  headerProps,
  roleLabel,
  logoText,
  profilePath,
  children
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const headerTitle = useMemo(() => {
    if (typeof titleResolver === 'function') {
      const resolvedTitle = titleResolver(location.pathname, { basePath });
      if (resolvedTitle) {
        return resolvedTitle;
      }
    }
    return defaultTitle;
  }, [location.pathname, titleResolver, defaultTitle, basePath]);

  const { title: _ignoredTitle, ...restHeaderProps } = headerProps || {};

  return (
    <div className="admin-layout">
      <AdminSidebar
        collapsed={collapsed}
        toggleSidebar={() => setCollapsed((prev) => !prev)}
        menuItems={menuItems}
        roleLabel={roleLabel}
        logoText={logoText}
        profilePath={profilePath}
      />
      <div className={`admin-main ${collapsed ? 'expanded' : ''}`}>
        <AdminPageHeader
          title={headerTitle}
          {...restHeaderProps}
        />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

ManagementLayout.propTypes = {
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      icon: PropTypes.string,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  basePath: PropTypes.string,
  titleResolver: PropTypes.func,
  defaultTitle: PropTypes.string,
  headerProps: PropTypes.object,
  roleLabel: PropTypes.string,
  logoText: PropTypes.string,
  profilePath: PropTypes.string,
  children: PropTypes.node
};

export default ManagementLayout;
