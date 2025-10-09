import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './css/CalendarView.css';
import { roomService } from '../../services/roomService';

function CalendarView({ selectedDate, schedules, onEventClick }) {
    const [timeSlots, setTimeSlots] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tạo các khung giờ từ 7:00 đến 21:00
    useEffect(() => {
        const slots = [];
        for (let i = 7; i <= 21; i++) {
            slots.push({
                startTime: `${String(i).padStart(2, '0')}:00`,
                endTime: `${String(i + 1).padStart(2, '0')}:00`,
                label: `${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`
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

        // Format selectedDate to YYYY-MM-DD
        const dateString = selectedDate.toISOString().split('T')[0];

        return schedules.filter(schedule => {
            return schedule.schedule_date === dateString;
        });
    };

    // Lấy lớp học cho khung giờ và phòng cụ thể
    const getClassForTimeAndRoom = (timeSlot, roomId) => {
        const schedulesForDate = getSchedulesForDate();
        const slotStart = parseInt(timeSlot.startTime.split(':')[0]);
        
        // Convert roomId to number if needed
        const roomIdNum = typeof roomId === 'string' ? parseInt(roomId, 10) : roomId;

        return schedulesForDate.filter(schedule => {
            // Xác định thời gian bắt đầu và kết thúc của lịch học
            const startTimeStr = schedule.schedule_startime;
            const endTimeStr = schedule.schedule_endtime;
            
            if (!startTimeStr || !endTimeStr) return false;
            
            const startHour = parseInt(startTimeStr.split(':')[0]);
            const startMin = parseInt(startTimeStr.split(':')[1] || '0');
            
            const endHour = parseInt(endTimeStr.split(':')[0]);
            const endMin = parseInt(endTimeStr.split(':')[1] || '0');
            
            // Cộng thêm 1 giờ nếu phút > 0 (để hiển thị chính xác)
            const adjustedEndHour = endHour + (endMin > 0 ? 1 : 0);

            // Kiểm tra xem time slot có nằm trong khoảng thời gian của lịch học không
            const isInTimeSlot = (startHour <= slotStart && adjustedEndHour > slotStart);
            
            // Kiểm tra đúng phòng học
            const scheduleRoomId = typeof schedule.room_id === 'string' 
                ? parseInt(schedule.room_id, 10) 
                : schedule.room_id;
                
            const isInRoom = scheduleRoomId === roomIdNum;

            return isInTimeSlot && isInRoom;
        });
    };

    // Tính số ô (row) cần chiếm cho một lịch học dựa trên thời lượng
    const getRowSpan = (startTime, endTime) => {
        if (!startTime || !endTime) return 1;
        
        const startParts = startTime.split(':');
        const endParts = endTime.split(':');
        
        if (startParts.length < 2 || endParts.length < 2) return 1;
        
        const startHour = parseInt(startParts[0]);
        const startMin = parseInt(startParts[1]);
        
        const endHour = parseInt(endParts[0]);
        const endMin = parseInt(endParts[1]);

        // Tính tổng số phút của lịch học
        const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        
        // Tính số giờ (làm tròn lên)
        const rowSpan = Math.ceil(totalMinutes / 60);

        return Math.max(1, rowSpan);
    };

    // Kiểm tra xem ô đã bị merge bởi lịch học ở time slot trước đó chưa
    const isPreviouslyMerged = (timeSlotIndex, roomId) => {
        if (timeSlotIndex === 0) return false;

        const previousTimeSlot = timeSlots[timeSlotIndex - 1];
        const previousClasses = getClassForTimeAndRoom(previousTimeSlot, roomId);

        return previousClasses.some(schedule => {
            const endTimeField = schedule.schedule_endtime;
            const scheduleEndHour = parseInt(endTimeField.split(':')[0] || '0');
            const scheduleEndMin = parseInt(endTimeField.split(':')[1] || '0');
            
            const currentHour = parseInt(timeSlots[timeSlotIndex].startTime.split(':')[0]);
            
            // Nếu có phút > 0, cần xét thêm giờ kế tiếp
            const adjustedEndHour = scheduleEndHour + (scheduleEndMin > 0 ? 1 : 0);
            
            return adjustedEndHour > currentHour;
        });
    };

    // Xác định class CSS dựa trên trạng thái lịch học
    const getStatusClass = (schedule) => {
        const status = schedule.status || 'SCHEDULED';
        switch (status) {
            case 'CONFIRMED': return 'status-confirmed';
            case 'CANCELLED': return 'status-cancelled';
            case 'COMPLETED': return 'status-completed';
            default: return 'status-scheduled';
        }
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
                            <th className="time-header">Thời gian</th>
                            {rooms.map(room => (
                                <th key={room.room_id} className="room-header">
                                    <i className="bi bi-door-open"></i>
                                    <span>{room.room_name}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((timeSlot, timeIndex) => (
                            <tr key={timeSlot.startTime} className="time-row">
                                <td className="time-cell">{timeSlot.label}</td>
                                {rooms.map(room => {
                                    const classes = getClassForTimeAndRoom(timeSlot, room.room_id);
                                    const isMerged = isPreviouslyMerged(timeIndex, room.room_id);

                                    // Nếu ô đã bị merge từ ô trước, không render
                                    if (isMerged) {
                                        return null;
                                    }

                                    const hasClass = classes.length > 0;
                                    
                                    // Tính số row span dựa vào thời gian bắt đầu và kết thúc
                                    const rowSpan = hasClass 
                                        ? getRowSpan(
                                            classes[0].schedule_startime, 
                                            classes[0].schedule_endtime
                                        ) : 1;

                                    return (
                                        <td
                                            key={`${room.room_id}-${timeSlot.startTime}`}
                                            className={`schedule-cell ${hasClass ? 'has-class' : ''}`}
                                            rowSpan={rowSpan}
                                        >
                                            {hasClass && classes.map(schedule => (
                                                <div
                                                    key={schedule.schedule_id}
                                                    className={`class-card`}
                                                    onClick={() => onEventClick && onEventClick(schedule)}
                                                >
                                                    <div className="class-header">
                                                        <div className="class-name">
                                                            {schedule.class_name || "Lớp học"}
                                                        </div>
                                                        <div className="class-time">
                                                            <i className="bi bi-clock"></i>
                                                            <span>
                                                                {formatTimeDisplay(schedule.schedule_startime)} - 
                                                                {formatTimeDisplay(schedule.schedule_endtime)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="class-info">
                                                        <div className="class-teacher">
                                                            <i className="bi bi-person"></i>
                                                            <span>{schedule.teacher_name || 'Chưa có giáo viên'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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