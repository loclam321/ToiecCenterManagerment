import { Link } from 'react-router-dom';
import './css/TeacherTable.css';

function TeacherTable({ teachers, loading, pagination, onPageChange }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);

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
        return 'Đang dạy';
      case 'inactive':
        return 'Ngừng dạy';
      case 'pending':
        return 'Chờ xác nhận';
      default:
        return 'Không xác định';
    }
  };

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    const delta = 1;

    let pages = [];

    pages.push(1);

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    pages = [...new Set(pages)].sort((a, b) => a - b);

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
        <p>Đang tải danh sách giáo viên...</p>
      </div>
    );
  }

  return (
    <div className="teacher-table-container">
      {teachers.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-search"></i>
          <p>Không tìm thấy giáo viên nào phù hợp với điều kiện tìm kiếm.</p>
          <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
            Làm mới trang
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table teacher-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Giáo viên</th>
                  <th>Chuyên môn</th>
                  <th>Kinh nghiệm</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>{teacher.id}</td>
                    <td>
                      <div className="teacher-info">
                        <span className="teacher-name">{teacher.name}</span>
                        <div className="teacher-meta">
                          <span>{teacher.email}</span>                        </div>
                      </div>
                    </td>
                    <td>{teacher.specialization || 'Chưa cập nhật'}</td>
                    <td>{teacher.experience} năm</td>
                    <td>
                      <span className={getStatusClass(teacher.status)}>
                        {getStatusText(teacher.status)}
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        <div>{formatDate(teacher.createdAt)}</div>
                        <div className="last-active">
                          <small>Cập nhật: {formatDate(teacher.updatedAt)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/admin/teachers/${teacher.id}`} className="btn-icon sm" title="Xem chi tiết">
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link to={`/admin/teachers/${teacher.id}/edit`} className="btn-icon sm" title="Chỉnh sửa">
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
              Hiển thị {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong số {pagination.totalItems} giáo viên
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

export default TeacherTable;