import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';

/**
 * ProtectedRoute
 * - Checks if user is authenticated
 * - Optionally restricts access to specific roles
 * Usage:
 * <ProtectedRoute roles={["student"]}>
 *   <StudentDashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ roles, redirectTo = '/login', children }) {
  const location = useLocation();

  // Not logged in
  if (!isAuthenticated()) {
    // Preserve target location for potential post-login redirect
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Role restriction check
  if (roles && roles.length > 0) {
    const currentRole = localStorage.getItem('role');
    if (!roles.includes(currentRole)) {
      // If role mismatch, try redirecting to a sensible home per role
      if (currentRole === 'teacher') return <Navigate to="/admin" replace />;
      if (currentRole === 'student') return <Navigate to="/student" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
  children: PropTypes.node.isRequired,
};
