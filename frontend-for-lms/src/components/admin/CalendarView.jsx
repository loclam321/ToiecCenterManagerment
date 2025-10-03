import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './css/CalendarView.css';

function CalendarView({ selectedDate, schedules, onEventClick }) {
    const [timeSlots, setTimeSlots] = useState([]);
    const [resources, setResources] = useState([]);
    
    useEffect(() => {
        // Tạo các khung giờ từ 7:00 đến 21:00
        const slots = [];
        for (let i = 7; i <= 21; i++) {
            slots.push({
                startTime: `${i}:00`,
                endTime: `${i+1}:00`,
                label: `${i}:00 - ${i+1}:00`
            });
        }
        setTimeSlots(slots);
        
        // Lấy danh sách phòng học
        const roomResources = [
            { id: 'R001', name: 'Phòng 101' },
            { id: 'R002', name: 'Phòng 102' },
            { id: 'R003', name: 'Phòng 201' },
            { id: 'R004', name: 'Phòng 202' }
        ];
        setResources(roomResources);
    }, []);
    
    // Lấy dữ liệu lịch học cho ngày được chọn
    const getClassesForDate = () => {
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ...
        
        // Mock data
        const allClasses = [
            {
                id: 'class-1',
                title: 'TOEIC 500+',
                class_name: 'TOEIC 500+ (Sáng)',
                teacher_name: 'Nguyễn Văn A',
                room_id: 'R001',
                days: [1, 3, 5], // Thứ 2, 4, 6
                startTime: '08:00',
                endTime: '10:00',
                color: '#4CAF50'
            },
            {
                id: 'class-2',
                title: 'TOEIC 750+',
                class_name: 'TOEIC 750+ (Tối)',
                teacher_name: 'Lê Văn C',
                room_id: 'R003',
                days: [2, 4, 6], // Thứ 3, 5, 7
                startTime: '18:00',
                endTime: '20:30',
                color: '#2196F3'
            },
            {
                id: 'class-3',
                title: 'IELTS 5.0+',
                class_name: 'IELTS Cơ bản',
                teacher_name: 'Trần Thị B',
                room_id: 'R002',
                days: [1, 5, 0], // Thứ 2, 6, CN
                startTime: '13:00',
                endTime: '15:30',
                color: '#FF9800'
            },
            {
                id: 'class-4',
                title: 'IELTS 6.5+',
                class_name: 'IELTS 6.5+',
                teacher_name: 'Phạm Văn D',
                room_id: 'R004',
                days: [2, 4], // Thứ 3, 5
                startTime: '19:00',
                endTime: '21:00',
                color: '#673AB7'
            },
            {
                id: 'class-5',
                title: 'TOEIC 600+',
                class_name: 'TOEIC 600+ (Chiều)',
                teacher_name: 'Nguyễn Văn A',
                room_id: 'R001',
                days: [2, 4, 6], // Thứ 3, 5, 7
                startTime: '14:00',
                endTime: '16:00',
                color: '#009688'
            }
        ];
        
        // Lọc các lớp học theo ngày được chọn
        return allClasses.filter(cls => cls.days.includes(dayOfWeek));
    };
    
    const getClassForTimeAndRoom = (timeSlot, roomId) => {
        const classesForDate = getClassesForDate();
        const slotStart = parseInt(timeSlot.startTime.split(':')[0]);
        
        return classesForDate.filter(cls => {
            const classStartHour = parseInt(cls.startTime.split(':')[0]);
            const classEndHour = parseInt(cls.endTime.split(':')[0]);
            const isInTimeSlot = classStartHour <= slotStart && classEndHour > slotStart;
            const isInRoom = cls.room_id === roomId;
            
            return isInTimeSlot && isInRoom;
        });
    };
    
    // Tính số hàng cần thiết cho class (dựa trên thời lượng)
    const getRowSpan = (startTime, endTime) => {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const endMinute = parseInt(endTime.split(':')[1]);
        
        let rowSpan = endHour - startHour;
        if (endMinute > 0) rowSpan += 1;
        
        return rowSpan;
    };
    
    return (
        <div className="timetable-day-view">
            <div className="timetable-wrapper">
                <table className="timetable">
                    <thead>
                        <tr>
                            <th className="time-header">Thời gian</th>
                            {resources.map(room => (
                                <th key={room.id} className="room-header">
                                    <i className="fas fa-door-open"></i> {room.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((timeSlot, index) => (
                            <tr key={timeSlot.startTime} className="time-row">
                                <td className="time-cell">{timeSlot.label}</td>
                                {resources.map(room => {
                                    const classes = getClassForTimeAndRoom(timeSlot, room.id);
                                    
                                    // Kiểm tra xem ô này có bị merge bởi class trước không
                                    const isPreviouslyMerged = index > 0 && 
                                        getClassForTimeAndRoom(timeSlots[index - 1], room.id)
                                            .some(cls => {
                                                const classEndHour = parseInt(cls.endTime.split(':')[0]);
                                                const currentHour = parseInt(timeSlot.startTime.split(':')[0]);
                                                return classEndHour > currentHour;
                                            });
                                    
                                    if (isPreviouslyMerged) {
                                        return null; // Ô này đã được merge
                                    }
                                    
                                    return (
                                        <td 
                                            key={`${room.id}-${timeSlot.startTime}`} 
                                            className="schedule-cell"
                                            rowSpan={classes.length > 0 ? getRowSpan(classes[0].startTime, classes[0].endTime) : 1}
                                        >
                                            {classes.map(cls => (
                                                <div 
                                                    key={cls.id} 
                                                    className="class-item" 
                                                    style={{ backgroundColor: cls.color }}
                                                    onClick={() => onEventClick(cls)}
                                                >
                                                    <div className="class-header">
                                                        <div className="class-title">{cls.title}</div>
                                                        <div className="class-time">
                                                            <i className="fas fa-clock"></i>
                                                            {cls.startTime} - {cls.endTime}
                                                        </div>
                                                    </div>
                                                    <div className="class-details">
                                                        <div className="class-teacher">
                                                            <i className="fas fa-user"></i>
                                                            {cls.teacher_name}
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
    schedules: PropTypes.array.isRequired,
    onEventClick: PropTypes.func.isRequired
};

export default CalendarView;