import React from 'react';
import { Link } from 'react-router-dom';
// Đã xóa import formatDate
import './css/ClassList.css';

function ClassList({ classes, loading, courseId }) {
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Đang tải danh sách lớp học...</p>
            </div>
        );
    }

    if (!classes || classes.length === 0) {
        return (
            <div className="empty-classes">
                <div className="empty-icon">
                    <i className="bi bi-layers"></i>
                </div>
                <h3>Chưa có lớp học nào</h3>
                <p>Khóa học này chưa có lớp học nào được tạo.</p>
                <Link to={`/admin/courses/${courseId}/classes/add`} className="btn btn-primary">
                    <i className="bi bi-plus-circle"></i> Tạo lớp học mới
                </Link>
            </div>
        );
    }

    return (
        <div className="class-list-container">
            <div className="content-header">
                <h3 className="section-title">Danh sách lớp học</h3>
                <Link to={`/admin/courses/${courseId}/classes/add`} className="btn btn-primary">
                    <i className="bi bi-plus-circle"></i> Tạo lớp học mới
                </Link>
            </div>

            <div className="table-responsive">
                <table className="table table-striped class-table">
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
                        {classes.map((cls) => (
                            <tr key={cls.id}>
                                <td>{cls.id}</td>
                                <td>
                                    <Link to={`/admin/classes/${cls.id}`} className="class-name-link">
                                        {cls.className}
                                    </Link>
                                </td>
                                <td>
                                    <div className="date-range">
                                        {/* Hiển thị ngày trực tiếp thay vì dùng formatDate */}
                                        <div>{cls.startDate}</div>
                                        <div className="date-separator">đến</div>
                                        <div>{cls.endDate}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="enrollment">
                                        <span className="enrolled-count">{cls.enrolledCount}</span>
                                        <span className="capacity-separator">/</span>
                                        <span className="max-capacity">{cls.capacity}</span>
                                    </div>
                                    <div className="progress enrollment-progress">
                                        <div
                                            className="progress-bar"
                                            role="progressbar"
                                            style={{ width: `${(cls.enrolledCount / cls.capacity) * 100}%` }}
                                            aria-valuenow={cls.enrolledCount}
                                            aria-valuemin="0"
                                            aria-valuemax={cls.capacity}
                                        ></div>
                                    </div>
                                </td>
                                <td>
                                    {/* Cập nhật hiển thị trạng thái sử dụng displayStatus và statusBadgeClass */}
                                    <span className={`badge ${cls.statusBadgeClass}`}>
                                        {cls.displayStatus}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/classes/${cls.id}`} className="btn-icon" title="Xem chi tiết">
                                            <i className="bi bi-eye"></i>
                                        </Link>
                                        <Link to={`/admin/classes/${cls.id}/edit`} className="btn-icon" title="Chỉnh sửa">
                                            <i className="bi bi-pencil"></i>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ClassList;