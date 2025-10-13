import { useState } from 'react';
import './css/TeacherSchedule.css';

const mockSchedule = [
  {
    id: 'CLS-201',
    course: 'TOEIC 650+',
    date: '14/10/2025',
    start: '08:00',
    end: '10:00',
    room: 'A2-301',
    status: 'Đang mở'
  },
  {
    id: 'CLS-305',
    course: 'TOEIC Speaking Focus',
    date: '15/10/2025',
    start: '14:00',
    end: '16:00',
    room: 'Online',
    status: 'Online'
  },
  {
    id: 'CLS-322',
    course: 'TOEIC Foundation',
    date: '16/10/2025',
    start: '18:30',
    end: '20:30',
    room: 'B1-102',
    status: 'Đang mở'
  }
];

function TeacherSchedule() {
  const [selectedDate, setSelectedDate] = useState('');

  const filteredSchedule = selectedDate
    ? mockSchedule.filter((item) => item.date === selectedDate)
    : mockSchedule;

  return (
    <div className="teacher-schedule">
      <div className="schedule-controls">
        <div className="filter-group">
          <label htmlFor="schedule-date">Chọn ngày</label>
          <input
            id="schedule-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setSelectedDate('')}
        >
          Xóa lọc
        </button>
      </div>

      <div className="schedule-table table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Mã lớp</th>
              <th>Khóa học</th>
              <th>Ngày</th>
              <th>Thời gian</th>
              <th>Phòng</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedule.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.course}</td>
                <td>{item.date}</td>
                <td>{item.start} - {item.end}</td>
                <td>{item.room}</td>
                <td>
                  <span className="badge bg-primary">{item.status}</span>
                </td>
                <td className="text-end">
                  <button type="button" className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-calendar-event"></i> Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherSchedule;
