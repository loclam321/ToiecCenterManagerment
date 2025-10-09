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
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
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

  const calculateExperience = (hireDate) => {
    if (!hireDate) return 0;

    try {
      const hire = new Date(hireDate);
      const now = new Date();
      const years = Math.floor((now - hire) / (365.25 * 24 * 60 * 60 * 1000));
      return Math.max(0, years);
    } catch (error) {
      return 0;
    }
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case 'M':
        return 'Nam';
      case 'F':
        return 'Nữ';
      default:
        return 'Không xác định';
    }
  };

  const getStatusClass = (hireDate) => {
    // Giáo viên đang hoạt động nếu có ngày thuê
    return hireDate ? 'status-badge success' : 'status-badge warning';
  };

  const getStatusText = (hireDate) => {
    return hireDate ? 'Đang dạy' : 'Chưa xác định';
  };

  const getPageNumbers = () => {
    // Chuẩn hóa pagination data
    const totalPages = pagination.total_pages || pagination.totalPages || 1;
    const currentPage = pagination.page || pagination.currentPage || 1;
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

  // Chuẩn hóa pagination data
  const normalizedPagination = {
    currentPage: pagination.page || pagination.currentPage || 1,
    totalPages: pagination.total_pages || pagination.totalPages || 1,
    totalItems: pagination.total || pagination.totalItems || 0,
    itemsPerPage: pagination.per_page || pagination.itemsPerPage || 10
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
                  <th>Mã GV</th>
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
                  <tr key={teacher.user_id}>
                    <td>
                      <span className="teacher-id">{teacher.user_id}</span>
                    </td>
                    <td>
                      <div className="teacher-info">
                        <div className="teacher-name">{teacher.user_name}</div>
                        <div className="teacher-meta">
                          <div className="teacher-email">
                            <i className="bi bi-envelope"></i>
                            <span>{teacher.user_email}</span>
                          </div>
                          {teacher.user_telephone && (
                            <div className="teacher-phone">
                              <i className="bi bi-telephone"></i>
                              <span>{teacher.user_telephone}</span>
                            </div>
                          )}
                          {teacher.user_gender && (
                            <div className="teacher-gender">
                              <i className="bi bi-person"></i>
                              <span>{getGenderText(teacher.user_gender)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="specialization-info">
                        <div className="specialization-main">
                          {teacher.tch_specialization || 'Chưa cập nhật'}
                        </div>
                        <div className="qualification">
                          <i className="bi bi-award"></i>
                          <span>{teacher.tch_qualification || 'Chưa có'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="experience-info">
                        <span className="experience-years">
                          {calculateExperience(teacher.tch_hire_date)} năm
                        </span>
                        <div className="hire-date">
                          <small>Từ: {formatDate(teacher.tch_hire_date)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusClass(teacher.tch_hire_date)}>
                        {getStatusText(teacher.tch_hire_date)}
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        <div className="created-date">
                          {formatDateTime(teacher.created_at)}
                        </div>
                        {teacher.updated_at && (
                          <div className="last-active">
                            <small>Cập nhật: {formatDateTime(teacher.updated_at)}</small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/teachers/${teacher.user_id}`}
                          className="btn-icon sm view"
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link
                          to={`/admin/teachers/${teacher.user_id}/edit`}
                          className="btn-icon sm edit"
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          className="btn-icon sm delete"
                          title="Xóa giáo viên"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
                              console.log('Delete teacher:', teacher.user_id);
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <div className="pagination-info">
              Hiển thị {(normalizedPagination.currentPage - 1) * normalizedPagination.itemsPerPage + 1} - {Math.min(normalizedPagination.currentPage * normalizedPagination.itemsPerPage, normalizedPagination.totalItems)} trong số {normalizedPagination.totalItems} giáo viên
            </div>
            <div className="pagination-controls">
              <button
                className="btn-page"
                disabled={normalizedPagination.currentPage === 1}
                onClick={() => onPageChange(1)}
              >
                <i className="bi bi-chevron-double-left"></i>
              </button>
              <button
                className="btn-page"
                disabled={normalizedPagination.currentPage === 1}
                onClick={() => onPageChange(normalizedPagination.currentPage - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return <span key={`ellipsis-${index}`} className="ellipsis">...</span>;
                }
                return (
                  <button
                    key={`page-${page}-${index}`}
                    className={`btn-page ${normalizedPagination.currentPage === page ? 'active' : ''}`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className="btn-page"
                disabled={normalizedPagination.currentPage === normalizedPagination.totalPages}
                onClick={() => onPageChange(normalizedPagination.currentPage + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <button
                className="btn-page"
                disabled={normalizedPagination.currentPage === normalizedPagination.totalPages}
                onClick={() => onPageChange(normalizedPagination.totalPages)}
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