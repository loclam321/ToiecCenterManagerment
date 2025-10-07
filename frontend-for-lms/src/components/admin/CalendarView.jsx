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

    // Chuyển đổi ngày thành số thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
    const getDayOfWeek = (date) => {
        return date.getDay();
    };

    // Lọc lịch học theo ngày được chọn
    const getSchedulesForDate = () => {
        if (!schedules || schedules.length === 0) return [];

        const dayOfWeek = getDayOfWeek(selectedDate);

        return schedules.filter(schedule => {
            // Kiểm tra xem lịch học có trong ngày được chọn không
            if (schedule.days && Array.isArray(schedule.days)) {
                return schedule.days.includes(dayOfWeek);
            }

            // Nếu có schedule_date, so sánh trực tiếp
            if (schedule.schedule_date) {
                const scheduleDate = new Date(schedule.schedule_date);
                return scheduleDate.toDateString() === selectedDate.toDateString();
            }

            return false;
        });
    };

    // Lấy lớp học cho khung giờ và phòng cụ thể
    const getClassForTimeAndRoom = (timeSlot, roomId) => {
        const schedulesForDate = getSchedulesForDate();
        const slotStart = parseInt(timeSlot.startTime.split(':')[0]);

        return schedulesForDate.filter(schedule => {
            const scheduleStartHour = parseInt(schedule.start_time?.split(':')[0] || '0');
            const scheduleEndHour = parseInt(schedule.end_time?.split(':')[0] || '0');
            const isInTimeSlot = scheduleStartHour <= slotStart && scheduleEndHour > slotStart;
            const isInRoom = schedule.room_id === roomId;

            return isInTimeSlot && isInRoom;
        });
    };

    // Tính số hàng cần merge cho class (dựa trên thời lượng)
    const getRowSpan = (startTime, endTime) => {
        const startHour = parseInt(startTime.split(':')[0]);
        const startMinute = parseInt(startTime.split(':')[1] || '0');
        const endHour = parseInt(endTime.split(':')[0]);
        const endMinute = parseInt(endTime.split(':')[1] || '0');

        let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        let rowSpan = Math.ceil(totalMinutes / 60);

        return Math.max(1, rowSpan);
    };

    // Kiểm tra xem ô có bị merge bởi lớp trước không
    const isPreviouslyMerged = (timeSlotIndex, roomId) => {
        if (timeSlotIndex === 0) return false;

        const previousTimeSlot = timeSlots[timeSlotIndex - 1];
        const previousClasses = getClassForTimeAndRoom(previousTimeSlot, roomId);

        return previousClasses.some(schedule => {
            const scheduleEndHour = parseInt(schedule.end_time?.split(':')[0] || '0');
            const currentHour = parseInt(timeSlots[timeSlotIndex].startTime.split(':')[0]);
            return scheduleEndHour > currentHour;
        });
    };

    if (loading) {
        return (
            <div className="calendar-loading">
                <div className="spinner"></div>
                <p>Đang tải lịch học...</p>
            </div>
        );
    }

    if (rooms.length === 0) {
        return (
            <div className="calendar-empty">
                <i className="bi bi-calendar-x"></i>
                <p>Không có phòng học nào</p>
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

                                    if (isMerged) {
                                        return null;
                                    }

                                    const hasClass = classes.length > 0;
                                    const rowSpan = hasClass ? getRowSpan(classes[0].start_time, classes[0].end_time) : 1;

                                    return (
                                        <td
                                            key={`${room.room_id}-${timeSlot.startTime}`}
                                            className={`schedule-cell ${hasClass ? 'has-class' : ''}`}
                                            rowSpan={rowSpan}
                                        >
                                            {hasClass && classes.map(schedule => (
                                                <div
                                                    key={schedule.schedule_id || schedule.id}
                                                    className="class-card"
                                                    onClick={() => onEventClick && onEventClick(schedule)}
                                                >
                                                    <div className="class-header">
                                                        <div className="class-name">
                                                            {schedule.class_name || schedule.title}
                                                        </div>
                                                        <div className="class-time">
                                                            <i className="bi bi-clock"></i>
                                                            <span>{schedule.start_time} - {schedule.end_time}</span>
                                                        </div>
                                                    </div>
                                                    <div className="class-info">
                                                        <div className="class-teacher">
                                                            <i className="bi bi-person"></i>
                                                            <span>{schedule.teacher_name || 'Chưa có giáo viên'}</span>
                                                        </div>
                                                        <div className="class-course">
                                                            <i className="bi bi-book"></i>
                                                            <span>{schedule.course_name || 'Chưa có khóa học'}</span>
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