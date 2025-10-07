import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/Adminsidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CalendarView from '../../components/admin/CalendarView';
import { getSchedules } from '../../services/scheduleService';
import { roomService } from '../../services/roomService';
import { toast } from 'react-toastify';
import './css/Schedule.css';

function Schedule() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filter, setFilter] = useState({
        classId: '',
        teacherId: '',
        roomId: ''
    });
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);

    // Danh sách các ngày trong tuần
    const getWeekDates = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // Tính khoảng cách đến thứ 2

        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            weekDates.push({
                date: date,
                dayName: getDayName(date.getDay()),
                dateStr: formatDateShort(date),
                isToday: date.toDateString() === today.toDateString()
            });
        }

        return weekDates;
    };

    const getDayName = (dayIndex) => {
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[dayIndex];
    };

    const formatDateShort = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    const formatDateFull = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const weekDates = getWeekDates();

    useEffect(() => {
        fetchScheduleData();
        fetchFilterOptions();
    }, [filter.classId, filter.teacherId, filter.roomId, selectedDate]);

    const fetchScheduleData = async () => {
        setLoading(true);
        try {
            const data = await getSchedules({
                class_id: filter.classId,
                teacher_id: filter.teacherId,
                room_id: filter.roomId,
                date: selectedDate.toISOString().split('T')[0]
            });
            setSchedules(data);
        } catch (error) {
            console.error("Error fetching schedule data:", error);
            toast.error("Không thể tải dữ liệu lịch học");
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            // Fetch rooms từ API
            const roomsResponse = await roomService.getAllRooms();
            if (roomsResponse.success && roomsResponse.data) {
                const formattedRooms = roomsResponse.data.map(room => ({
                    id: room.room_id,
                    name: room.room_name,
                    location: room.room_location,
                    type: room.room_type
                }));
                setRooms(formattedRooms);
            }

            // Mock data cho classes và teachers (sẽ thay bằng API sau)
            setClasses([
                { id: '1', name: 'TOEIC 500+ (Sáng T2-4-6)' },
                { id: '2', name: 'TOEIC 300+ (Sáng T2-4-6)' },
                { id: '3', name: 'TOEIC 750+ (Tối T3-5-7)' }
            ]);

            setTeachers([
                { id: 'T001', name: 'Nguyễn Văn A' },
                { id: 'T002', name: 'Trần Thị B' },
                { id: 'T003', name: 'Lê Văn C' }
            ]);
        } catch (error) {
            console.error("Error fetching filter options:", error);
            toast.error("Không thể tải dữ liệu bộ lọc");
            setRooms([]);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (e) => {
        const selectedDateStr = e.target.value;
        const newDate = weekDates.find(d => d.date.toISOString().split('T')[0] === selectedDateStr);
        if (newDate) {
            setSelectedDate(newDate.date);
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const goToPrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminPageHeader
                    title="THỜI KHÓA BIỂU"
                    subtitle="Xem lịch học theo ngày và phòng học"
                    actions={[
                        {
                            type: 'button',
                            text: 'Thêm buổi học',
                            icon: 'fas fa-plus',
                            variant: 'primary',
                            onClick: () => alert('Chức năng thêm buổi học')
                        }
                    ]}
                />

                <div className="admin-content">
                    <div className="schedule-container">
                        {/* Date Navigation */}
                        <div className="date-navigation-panel">
                            <div className="date-selector-group">
                                <button
                                    className="nav-arrow-btn"
                                    onClick={goToPrevDay}
                                    title="Ngày trước"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>

                                <div className="date-dropdown-wrapper">
                                    <select
                                        className="date-dropdown"
                                        value={selectedDate.toISOString().split('T')[0]}
                                        onChange={handleDateChange}
                                    >
                                        {weekDates.map(dateInfo => (
                                            <option
                                                key={dateInfo.date.toISOString()}
                                                value={dateInfo.date.toISOString().split('T')[0]}
                                            >
                                                {dateInfo.dayName} - {dateInfo.dateStr}
                                                {dateInfo.isToday ? ' (Hôm nay)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <i className="fas fa-calendar-day dropdown-icon"></i>
                                </div>

                                <button
                                    className="nav-arrow-btn"
                                    onClick={goToNextDay}
                                    title="Ngày tiếp theo"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>

                                <button
                                    className="today-btn"
                                    onClick={goToToday}
                                    disabled={selectedDate.toDateString() === new Date().toDateString()}
                                >
                                    <i className="fas fa-calendar-check"></i> Hôm nay
                                </button>
                            </div>

                            <div className="selected-date-display">
                                <i className="fas fa-calendar"></i>
                                <span className="date-text">{formatDateFull(selectedDate)}</span>
                                <span className="day-badge">
                                    {getDayName(selectedDate.getDay())}
                                </span>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        <div className="filter-panel">
                            <div className="filter-row">
                                <div className="filter-item">
                                    <label htmlFor="classId">
                                        <i className="fas fa-chalkboard"></i> Lớp học
                                    </label>
                                    <select
                                        id="classId"
                                        name="classId"
                                        value={filter.classId}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tất cả lớp học</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-item">
                                    <label htmlFor="teacherId">
                                        <i className="fas fa-chalkboard-teacher"></i> Giáo viên
                                    </label>
                                    <select
                                        id="teacherId"
                                        name="teacherId"
                                        value={filter.teacherId}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tất cả giáo viên</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-item">
                                    <label htmlFor="roomId">
                                        <i className="fas fa-door-open"></i> Phòng học
                                    </label>
                                    <select
                                        id="roomId"
                                        name="roomId"
                                        value={filter.roomId}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tất cả phòng học</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.name} - {room.location}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Đang tải dữ liệu lịch học...</p>
                            </div>
                        ) : (
                            <CalendarView
                                selectedDate={selectedDate}
                                schedules={schedules}
                                onEventClick={(event) => {
                                    console.log('Chi tiết buổi học:', event);
                                    // Có thể mở modal hoặc navigate đến trang chi tiết
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Schedule;