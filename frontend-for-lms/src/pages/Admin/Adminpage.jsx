import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/admin/Adminsidebar";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import "./css/Adminpage.css";

function AdminPage() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    // Xác định tiêu đề dựa vào URL hiện tại
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/admin") return "Dashboard";
        if (path === "/admin/teachers") return "Quản lý giáo viên";
        if (path.includes("/admin/teachers/add")) return "Thêm giáo viên mới";
        if (path.includes("/admin/teachers/") && path.includes("/edit")) return "Chỉnh sửa giáo viên";
        if (path === "/admin/students") return "Quản lý học viên";
        if (path === "/admin/courses") return "Quản lý khóa học";
        if (path === "/admin/classes") return "Quản lý lớp học";
        return "Trang quản trị";
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title={getPageTitle()}
                    notificationCount={3}
                    onNotificationClick={() => console.log('Notifications clicked')}
                />
                <div className="admin-content">
                    <Outlet /> {/* Đây là nơi các trang con được render */}
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
