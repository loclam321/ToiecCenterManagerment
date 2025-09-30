import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/Adminsidebar';
import './css/Dashboard.css';

function AdminDashboard() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        courses: 0,
        classes: 0
    });

    useEffect(() => {
        // Tải dữ liệu thống kê từ API
        // Đây là mock data, thay thế bằng API call thực tế
        setTimeout(() => {
            setStats({
                students: 452,
                teachers: 18,
                courses: 24,
                classes: 32
            });
        }, 1000);
    }, []);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <div className="admin-content">
                    <div className="dashboard-summary">
                        <div className="summary-cards">
                            <div className="summary-card">
                                <div className="card-icon bg-blue">
                                    <i className="bi bi-people"></i>
                                </div>
                                <div className="card-info">
                                    <div className="card-title">Học viên</div>
                                    <div className="card-value">{stats.students}</div>
                                    <div className="card-change positive">+24 tuần này</div>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="card-icon bg-green">
                                    <i className="bi bi-person-workspace"></i>
                                </div>
                                <div className="card-info">
                                    <div className="card-title">Giáo viên</div>
                                    <div className="card-value">{stats.teachers}</div>
                                    <div className="card-change positive">+2 tuần này</div>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="card-icon bg-purple">
                                    <i className="bi bi-journal-text"></i>
                                </div>
                                <div className="card-info">
                                    <div className="card-title">Khóa học</div>
                                    <div className="card-value">{stats.courses}</div>
                                    <div className="card-change">Không thay đổi</div>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="card-icon bg-orange">
                                    <i className="bi bi-calendar3"></i>
                                </div>
                                <div className="card-info">
                                    <div className="card-title">Lớp học</div>
                                    <div className="card-value">{stats.classes}</div>
                                    <div className="card-change positive">+3 tuần này</div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-charts row mt-4 ">
                            <div className="col-lg-8">
                                <div className="chart-card">
                                    <div className="card-header">
                                        <h3>Thống kê đăng ký khóa học</h3>
                                        <div className="card-actions">
                                            <select className="form-select">
                                                <option>30 ngày qua</option>
                                                <option>Quý này</option>
                                                <option>Năm nay</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="chart-area">
                                        {/* Placeholder for chart - would use a library like Chart.js or Recharts */}
                                        <div className="chart-placeholder">
                                            <div className="placeholder-bars">
                                                <div className="bar" style={{ height: '60%' }}></div>
                                                <div className="bar" style={{ height: '80%' }}></div>
                                                <div className="bar" style={{ height: '65%' }}></div>
                                                <div className="bar" style={{ height: '90%' }}></div>
                                                <div className="bar" style={{ height: '75%' }}></div>
                                                <div className="bar" style={{ height: '60%' }}></div>
                                                <div className="bar" style={{ height: '45%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <div className="chart-card">
                                    <div className="card-header">
                                        <h3>Phân bố khóa học</h3>
                                    </div>
                                    <div className="chart-area pie-chart">
                                        {/* Placeholder for pie chart */}
                                        <div className="pie-placeholder">
                                            <div className="pie-segment seg1"></div>
                                            <div className="pie-segment seg2"></div>
                                            <div className="pie-segment seg3"></div>
                                        </div>
                                        <div className="chart-legend">
                                            <div className="legend-item">
                                                <span className="legend-color bg-blue"></span>
                                                <span>Foundation (35%)</span>
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-color bg-green"></span>
                                                <span>Intermediate (45%)</span>
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-color bg-orange"></span>
                                                <span>Advanced (20%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-tables row mt-4">
                            <div className="col-12">
                                <div className="table-card">
                                    <div className="card-header">
                                        <h3>Đăng ký mới gần đây</h3>
                                        <button className="btn btn-primary btn-sm">Xem tất cả</button>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Học viên</th>
                                                    <th>Khóa học</th>
                                                    <th>Ngày đăng ký</th>
                                                    <th>Trạng thái</th>
                                                    <th>Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>EN001</td>
                                                    <td>Nguyễn Văn A</td>
                                                    <td>TOEIC 500+</td>
                                                    <td>24/09/2023</td>
                                                    <td><span className="status-badge success">Đã thanh toán</span></td>
                                                    <td>
                                                        <button className="btn-icon sm">
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>EN002</td>
                                                    <td>Trần Thị B</td>
                                                    <td>TOEIC 650+</td>
                                                    <td>23/09/2023</td>
                                                    <td><span className="status-badge warning">Chờ xác nhận</span></td>
                                                    <td>
                                                        <button className="btn-icon sm">
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>EN003</td>
                                                    <td>Lê Văn C</td>
                                                    <td>TOEIC 500+</td>
                                                    <td>22/09/2023</td>
                                                    <td><span className="status-badge success">Đã thanh toán</span></td>
                                                    <td>
                                                        <button className="btn-icon sm">
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>EN004</td>
                                                    <td>Phạm Thị D</td>
                                                    <td>TOEIC 800+</td>
                                                    <td>21/09/2023</td>
                                                    <td><span className="status-badge danger">Chưa thanh toán</span></td>
                                                    <td>
                                                        <button className="btn-icon sm">
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>EN005</td>
                                                    <td>Hoàng Văn E</td>
                                                    <td>TOEIC 650+</td>
                                                    <td>20/09/2023</td>
                                                    <td><span className="status-badge success">Đã thanh toán</span></td>
                                                    <td>
                                                        <button className="btn-icon sm">
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;