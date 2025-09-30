import { Link } from 'react-router-dom';
import './css/StudentTable.css';

function StudentTable({ students, loading, pagination, onPageChange }) {
  // Sửa hàm formatDate để xử lý các trường hợp giá trị không hợp lệ
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) return 'N/A';
      
      return new Intl.DateTimeFormat('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge success';
      case 'inactive':
        return 'status-badge danger';
      case 'pending':
        return 'status-badge warning';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Đang học';
      case 'inactive':
        return 'Ngừng học';
      case 'pending':
        return 'Chờ xác nhận';
      default:
        return 'Không xác định';
    }
  };

  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    const delta = 1; // Number of pages before and after current page
    
    let pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    // Sort and deduplicate
    pages = [...new Set(pages)].sort((a, b) => a - b);
    
    // Add ellipses
    let result = [];
    let prevPage = null;
    
    pages.forEach(page => {
      if (prevPage && page - prevPage > 1) {
        result.push('...');
      }
      result.push(page);
      prevPage = page;
    });
    
    return result;
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách học viên...</p>
      </div>
    );
  }

  const mappedStudents = students.map(student => ({
    ...student,
    // Thêm các trường cần thiết cho StudentTable
    registrationDate: student.created_at,
    lastActive: student.updated_at
  }));

  return (
    <div className="student-table-container">
      {mappedStudents.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-search"></i>
          <p>Không tìm thấy học viên nào phù hợp với điều kiện tìm kiếm.</p>
          <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
            Làm mới trang
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table student-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Học viên</th>
                  <th>Trạng thái</th>
                  <th>Khóa học</th>
                  <th>Ngày đăng ký</th>
                  <th>Tiến độ</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {mappedStudents.map(student => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                        <div className="student-email">{student.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusClass(student.status)}>
                        {getStatusText(student.status)}
                      </span>
                    </td>
                    <td>{student.enrolledCourses} khóa học</td>
                    <td>
                      <div className="date-info">
                        <div>{formatDate(student.createdAt || student.registrationDate)}</div>
                        <div className="last-active">
                          <small>Cập nhật: {formatDate(student.updatedAt || student.lastActive)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="progress-wrapper">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{student.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/admin/students/${student.id}`} className="btn-icon sm" title="Xem chi tiết">
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link to={`/admin/students/${student.id}/edit`} className="btn-icon sm" title="Chỉnh sửa">
                          <i className="bi bi-pencil"></i>
                        </Link>
                 
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="table-pagination">
            <div className="pagination-info">
              Hiển thị {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong số {pagination.totalItems} học viên
            </div>
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                disabled={pagination.currentPage === 1}
                onClick={() => onPageChange(1)}
              >
                <i className="bi bi-chevron-double-left"></i>
              </button>
              <button 
                className="btn-page" 
                disabled={pagination.currentPage === 1}
                onClick={() => onPageChange(pagination.currentPage - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="ellipsis">...</span>
                ) : (
                  <button 
                    key={page}
                    className={`btn-page ${pagination.currentPage === page ? 'active' : ''}`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button 
                className="btn-page" 
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => onPageChange(pagination.currentPage + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <button 
                className="btn-page" 
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => onPageChange(pagination.totalPages)}
              >
                <i className="bi bi-chevron-double-right"></i>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentTable;