import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './css/CalendarView.css';
import { roomService } from '../../services/roomService';

function CalendarView({ selectedDate, schedules, onEventClick }) {
    const [timeSlots, setTimeSlots] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tạo các khung giờ với độ chi tiết 1 giờ
    useEffect(() => {
        const slots = [];
        for (let i = 7; i <= 21; i++) {
            slots.push({
                startTime: `${String(i).padStart(2, '0')}:00`,
                endTime: `${String(i + 1).padStart(2, '0')}:00`,
                label: `${String(i).padStart(2, '0')}:00`
            });
        }
        setTimeSlots(slots);
    }, []);

    // Lấy danh sách phòng từ API
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                const response = await roomService.getAllRooms();

                if (response.success && response.data) {
                    setRooms(response.data);
                }
            } catch (error) {
                console.error('Error loading rooms:', error);
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    // Format thời gian để hiển thị (bỏ phần giây)
    const formatTimeDisplay = (timeStr) => {
        if (!timeStr) return '';
        const timeParts = timeStr.split(':');
        return `${timeParts[0]}:${timeParts[1]}`;
    };

    // Lọc lịch học theo ngày được chọn
    const getSchedulesForDate = () => {
        if (!schedules || !Array.isArray(schedules)) return [];
        const dateString = selectedDate.toISOString().split('T')[0];
        return schedules.filter(schedule => schedule.schedule_date === dateString);
    };

    // Kiểm tra xem một khung giờ có chứa lịch học nào không
    const getClassForTimeSlot = (timeSlot, roomId) => {
        const schedulesForDate = getSchedulesForDate();

        const slotStartHour = parseInt(timeSlot.startTime.split(':')[0]);
        const slotStartMinute = parseInt(timeSlot.startTime.split(':')[1] || '0');
        const slotStartTimeInMinutes = slotStartHour * 60 + slotStartMinute;

        const slotEndHour = parseInt(timeSlot.endTime.split(':')[0]);
        const slotEndMinute = parseInt(timeSlot.endTime.split(':')[1] || '0');
        const slotEndTimeInMinutes = slotEndHour * 60 + slotEndMinute;

        const roomIdNum = typeof roomId === 'string' ? parseInt(roomId, 10) : roomId;

        return schedulesForDate.filter(schedule => {
            const startTimeStr = schedule.schedule_startime;
            const endTimeStr = schedule.schedule_endtime;

            if (!startTimeStr || !endTimeStr) return false;

            const startHour = parseInt(startTimeStr.split(':')[0]);
            const startMin = parseInt(startTimeStr.split(':')[1] || '0');
            const startTimeInMinutes = startHour * 60 + startMin;

            const endHour = parseInt(endTimeStr.split(':')[0]);
            const endMin = parseInt(endTimeStr.split(':')[1] || '0');
            const endTimeInMinutes = endHour * 60 + endMin;

            const hasOverlap = (
                (startTimeInMinutes >= slotStartTimeInMinutes && startTimeInMinutes < slotEndTimeInMinutes) ||
                (endTimeInMinutes > slotStartTimeInMinutes && endTimeInMinutes <= slotEndTimeInMinutes) ||
                (startTimeInMinutes <= slotStartTimeInMinutes && endTimeInMinutes >= slotEndTimeInMinutes)
            );

            const scheduleRoomId = typeof schedule.room_id === 'string'
                ? parseInt(schedule.room_id, 10)
                : schedule.room_id;

            return hasOverlap && scheduleRoomId === roomIdNum;
        });
    };

    // Xác định class CSS dựa trên trạng thái
    const getStatusClass = (schedule) => {
        // Nếu không có status, mặc định dùng gradient tím
        if (!schedule.status) return ''; // Class mặc định (gradient tím)

        if (schedule.is_makeup_class) return 'status-makeup';

        const status = schedule.status.toUpperCase();

        switch (status) {
            case 'CONFIRMED': return 'status-confirmed';
            case 'CANCELLED': return 'status-cancelled';
            case 'COMPLETED': return 'status-completed';
            case 'SCHEDULED': return 'status-scheduled';
            default: return ''; // Gradient tím mặc định
        }
    };

    // Lấy icon cho status
    const getStatusIcon = (schedule) => {
        if (schedule.is_makeup_class) return 'bi-arrow-repeat';

        const status = schedule.status || 'SCHEDULED';
        switch (status) {
            case 'CONFIRMED': return 'bi-check-circle-fill';
            case 'CANCELLED': return 'bi-x-circle-fill';
            case 'COMPLETED': return 'bi-check-all';
            default: return 'bi-circle-fill';
        }
    };

    // Tính toán thời gian hiển thị của sự kiện
    const getEventDisplayTiming = (schedule, timeSlot) => {
        const slotStartHour = parseInt(timeSlot.startTime.split(':')[0]);
        const slotStartMinute = parseInt(timeSlot.startTime.split(':')[1] || '0');
        const slotStartTimeInMinutes = slotStartHour * 60 + slotStartMinute;

        const slotEndHour = parseInt(timeSlot.endTime.split(':')[0]);
        const slotEndMinute = parseInt(timeSlot.endTime.split(':')[1] || '0');
        const slotEndTimeInMinutes = slotEndHour * 60 + slotEndMinute;

        const startTimeStr = schedule.schedule_startime;
        const endTimeStr = schedule.schedule_endtime;

        const startHour = parseInt(startTimeStr.split(':')[0]);
        const startMin = parseInt(startTimeStr.split(':')[1] || '0');
        const startTimeInMinutes = startHour * 60 + startMin;

        const endHour = parseInt(endTimeStr.split(':')[0]);
        const endMin = parseInt(endTimeStr.split(':')[1] || '0');
        const endTimeInMinutes = endHour * 60 + endMin;

        const startPositionPercent = Math.max(0, (startTimeInMinutes - slotStartTimeInMinutes) / (slotEndTimeInMinutes - slotStartTimeInMinutes) * 100);
        const endPositionPercent = Math.min(100, (endTimeInMinutes - slotStartTimeInMinutes) / (slotEndTimeInMinutes - slotStartTimeInMinutes) * 100);

        return {
            start: startPositionPercent,
            end: endPositionPercent,
            height: endPositionPercent - startPositionPercent
        };
    };

    if (loading) {
        return (
            <div className="calendar-loading">
                <div className="spinner"></div>
                <p>Đang tải lịch học...</p>
            </div>
        );
    }

    return (
        <div className="calendar-view">
            <div className="calendar-wrapper">
                <table className="calendar-table">
                    <thead>
                        <tr>
                            <th className="time-header">Giờ</th>
                            {rooms.map(room => (
                                <th key={room.room_id} className="room-header">
                                    <i className="bi bi-door-open"></i>
                                    <span>{room.room_name}</span>
                                    {room.room_capacity && (
                                        <small className="room-capacity">
                                            <i className="bi bi-people"></i> {room.room_capacity}
                                        </small>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((timeSlot) => (
                            <tr key={timeSlot.startTime} className="time-row">
                                <td className="time-cell">
                                    {timeSlot.label}
                                </td>
                                {rooms.map(room => {
                                    const classes = getClassForTimeSlot(timeSlot, room.room_id);
                                    const hasClass = classes.length > 0;

                                    return (
                                        <td
                                            key={`${room.room_id}-${timeSlot.startTime}`}
                                            className={`schedule-cell ${hasClass ? 'has-class' : ''}`}
                                        >
                                            {hasClass && classes.map(schedule => {
                                                const timing = getEventDisplayTiming(schedule, timeSlot);

                                                // DEBUG: Xem status của schedule
                                                console.log('Schedule:', {
                                                    id: schedule.schedule_id,
                                                    name: schedule.class_name,
                                                    status: schedule.status,
                                                    statusClass: getStatusClass(schedule)
                                                });

                                                if (timing.height < 10) return null;

                                                return (
                                                    <div
                                                        key={schedule.schedule_id}
                                                        className={`class-card ${getStatusClass(schedule)}`}
                                                        style={{
                                                            position: 'absolute',
                                                            top: `${timing.start}%`,
                                                            height: `${timing.height}%`,
                                                            left: '2px',
                                                            right: '2px'
                                                        }}
                                                        onClick={() => onEventClick && onEventClick(schedule)}
                                                        title={`${schedule.class_name}\n${formatTimeDisplay(schedule.schedule_startime)} - ${formatTimeDisplay(schedule.schedule_endtime)}\nTrạng thái: ${schedule.status || 'SCHEDULED'}\nGiáo viên: ${schedule.teacher_name || 'Chưa có'}`}
                                                    >
                                                        {/* Status icon */}
                                                        <i className={`class-status-icon bi ${getStatusIcon(schedule)}`}></i>

                                                        {/* Nội dung */}
                                                        <div className="class-content">
                                                            <div className="class-name">
                                                                {schedule.class_name || "Lớp học"}
                                                            </div>
                                                            <div className="class-time">
                                                                {formatTimeDisplay(schedule.schedule_startime)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {schedules && schedules.length > 0 && getSchedulesForDate().length === 0 && (
                <div className="no-schedules-message">
                    <i className="bi bi-calendar2-x"></i>
                    <p>Không có lịch học nào vào ngày {selectedDate.toLocaleDateString('vi-VN')}</p>
                </div>
            )}
        </div>
    );
}

CalendarView.propTypes = {
    selectedDate: PropTypes.instanceOf(Date).isRequired,
    schedules: PropTypes.array,
    onEventClick: PropTypes.func
};

CalendarView.defaultProps = {
    schedules: [],
    onEventClick: () => { }
};

export default CalendarView;