import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../services/courseService';
import PropTypes from 'prop-types';

function ClassList({ classes, loading, courseId }) {
    const renderClassStatus = (status) => {
        switch (status) {
            case 'active':
                return <span className="badge-success">Đang diễn ra</span>;
            case 'upcoming':
                return <span className="badge-warning">Sắp khai giảng</span>;
            case 'completed':
                return <span className="badge-secondary">Đã kết thúc</span>;
            case 'cancelled':
                return <span className="badge-danger">Đã hủy</span>;
            default:
                return <span className="badge-secondary">Không xác định</span>;
        }
    };

    return (
        <div className="detail-content">
            <div className="compact-header">
                <div className="header-title">
                    <i className="bi bi-grid-3x3"></i>
                    <span>Danh sách lớp học ({classes.length})</span>
                </div>
                <div className="header-actions">
                  
                    <Link to={`/admin/courses/${courseId}/add-class`} className="btn-sm btn-primary">
                        <i className="bi bi-plus"></i> Thêm lớp
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Đang tải danh sách lớp học...</p>
                </div>
            ) : classes.length > 0 ? (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Mã lớp</th>
                                <th>Tên lớp</th>
                                <th>Thời gian</th>
                                <th>Sĩ số</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(classItem => (
                                <tr key={classItem.id}>
                                    <td>{classItem.id}</td>
                                    <td className="class-name-cell">
                                        <div className="class-name">{classItem.className}</div>
                                        {classItem.schedule && (
                                            <div className="class-schedule">{classItem.schedule}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="date-range">
                                            <div>{formatDate(classItem.startDate)}</div>
                                            <div>→</div>
                                            <div>{formatDate(classItem.endDate)}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="enrollment-count">
                                            {classItem.enrolledCount}/{classItem.capacity}
                                        </span>
                                    </td>
                                    <td>{renderClassStatus(classItem.status)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/admin/classes/${classItem.id}`} className="btn-icon" title="Xem chi tiết">
                                                <i className="bi bi-eye"></i>
                                            </Link>
                                            <Link to={`/admin/classes/${classItem.id}/edit`} className="btn-icon" title="Chỉnh sửa">
                                                <i className="bi bi-pencil"></i>
                                            </Link>
                                            <button
                                                className="btn-icon text-danger"
                                                title="Xóa lớp"
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
                                                        console.log(`Xóa lớp học ${classItem.id}`);
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
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <i className="bi bi-grid-3x3-gap"></i>
                    </div>
                    <h3>Chưa có lớp học nào</h3>
                    <p>Khóa học này chưa có lớp học nào được tạo.</p>
                    <Link to={`/admin/courses/${courseId}/add-class`} className="btn btn-primary">
                        <i className="bi bi-plus"></i> Thêm lớp học mới
                    </Link>
                </div>
            )}
        </div>
    );
}

ClassList.propTypes = {
    classes: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    courseId: PropTypes.string.isRequired
};

export default ClassList;