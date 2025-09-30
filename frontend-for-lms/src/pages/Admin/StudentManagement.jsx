import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Adminsidebar';
import StudentTable from '../../components/admin/StudentTable';
import StudentFilters from '../../components/admin/StudentFilters';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { getStudents, mapStudentFromApi } from '../../services/studentService';
import './css/StudentManagement.css';

function StudentManagement() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        sortBy: 'newest'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 10,
        totalItems: 0
    });

    useEffect(() => {
        fetchStudents();
    }, [filters, pagination.currentPage]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Map filters to API options
            const sortOptions = getSortOptions(filters.sortBy);

            const options = {
                page: pagination.currentPage,
                perPage: pagination.itemsPerPage,
                search: filters.search,
                sortBy: sortOptions.field,
                sortOrder: sortOptions.order,
                status: filters.status !== 'all' ? filters.status : ''
            };

            const result = await getStudents(options);

            // Map API data to frontend format
            const mappedStudents = result.students.map(student => mapStudentFromApi(student));

            setStudents(mappedStudents);
            setPagination({
                currentPage: result.pagination.page,
                totalPages: result.pagination.pages,
                itemsPerPage: result.pagination.per_page,
                totalItems: result.pagination.total
            });
        } catch (error) {
            console.error('Error fetching students:', error);
            // Handle error - show notification or error message
        } finally {
            setLoading(false);
        }
    };

    // Helper to convert frontend sort options to API parameters
    const getSortOptions = (sortBy) => {
        switch (sortBy) {
            case 'newest':
                return { field: 'created_at', order: 'desc' };
            case 'oldest':
                return { field: 'created_at', order: 'asc' };
            case 'name_asc':
                return { field: 'user_name', order: 'asc' };
            case 'name_desc':
                return { field: 'user_name', order: 'desc' };
            default:
                return { field: '', order: '' };
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        // Reset to first page when changing filters
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            currentPage: newPage
        }));
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="Quản lý học viên"
                    notificationCount={3}
                    onNotificationClick={() => console.log('Notifications')}
                />

                <div className="admin-content">
                    <div className="student-management">
                       

                        <div className="content-filters">
                            <StudentFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                            />
                        </div>

                        <div className="content-table">
                            <StudentTable
                                students={students}
                                loading={loading}
                                pagination={pagination}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentManagement;