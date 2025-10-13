import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './css/TeacherDashboard.css';

const upcomingSessionsMock = [
  {
    id: 'CLS-201',
    course: 'TOEIC 650+',
    startTime: '08:00',
    date: '14/10/2025',
    room: 'A2-301'
  },
  {
    id: 'CLS-305',
    course: 'TOEIC Speaking Focus',
    startTime: '14:00',
    date: '15/10/2025',
    room: 'Online'
  }
];

const feedbackHighlightsMock = [
  {
    student: 'Nguyễn Văn A',
    comment: 'Bài chữa chi tiết và dễ hiểu, em thấy tiến bộ rõ rệt.',
    score: 4.8
  },
  {
    student: 'Trần Thị B',
    comment: 'Giải thích chiến thuật part 3 rất hiệu quả.',
    score: 4.9
  }
];

function TeacherDashboard() {
  const summary = useMemo(() => ({
    totalClasses: 6,
    activeStudents: 128,
    pendingAssignments: 12,
    upcomingSessions: upcomingSessionsMock.length
  }), []);

  return (
    <div className="teacher-dashboard">
      <section className="dashboard-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon bg-blue">
              <i className="bi bi-people"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Học viên đang theo học</div>
              <div className="card-value">{summary.activeStudents}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon bg-green">
              <i className="bi bi-journal-check"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Bài tập cần chấm</div>
              <div className="card-value">{summary.pendingAssignments}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon bg-orange">
              <i className="bi bi-calendar3"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Buổi dạy sắp tới</div>
              <div className="card-value">{summary.upcomingSessions}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon bg-purple">
              <i className="bi bi-easel"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Lớp đang phụ trách</div>
              <div className="card-value">{summary.totalClasses}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-widgets row g-4 mt-1">
        <div className="col-lg-7">
          <div className="widget-card">
            <div className="card-header">
              <h3>Lịch dạy sắp tới</h3>
              <Link className="btn btn-sm btn-outline-primary" to="/teachers/schedule">Xem đầy đủ</Link>
            </div>
            <ul className="schedule-list">
              {upcomingSessionsMock.map((session) => (
                <li key={session.id} className="schedule-item">
                  <div className="session-meta">
                    <div className="session-time">
                      <span className="time">{session.startTime}</span>
                      <span className="date">{session.date}</span>
                    </div>
                    <div className="session-info">
                      <h4>{session.course}</h4>
                      <p>{session.id} • {session.room}</p>
                    </div>
                  </div>
                  <i className="bi bi-chevron-right"></i>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="widget-card">
            <div className="card-header">
              <h3>Phản hồi nổi bật</h3>
            </div>
            <ul className="feedback-list">
              {feedbackHighlightsMock.map((item, index) => (
                <li key={`${item.student}-${index}`} className="feedback-item">
                  <div>
                    <strong>{item.student}</strong>
                    <p>{item.comment}</p>
                  </div>
                  <span className="badge bg-success">{item.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TeacherDashboard;
