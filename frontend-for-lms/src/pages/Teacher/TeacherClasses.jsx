import './css/TeacherClasses.css';

const managedClassesMock = [
  {
    id: 'CLS-201',
    name: 'TOEIC 650+ - Buổi tối',
    students: 24,
    progress: 65,
    nextSession: '14/10/2025'
  },
  {
    id: 'CLS-305',
    name: 'TOEIC Speaking Focus - Online',
    students: 18,
    progress: 40,
    nextSession: '15/10/2025'
  },
  {
    id: 'CLS-322',
    name: 'TOEIC Foundation - Cuối tuần',
    students: 30,
    progress: 85,
    nextSession: '16/10/2025'
  }
];

function TeacherClasses() {
  return (
    <div className="teacher-classes">
      <div className="classes-grid">
        {managedClassesMock.map((item) => (
          <div key={item.id} className="class-card">
            <div className="class-header">
              <span className="badge bg-primary">{item.id}</span>
              <h3>{item.name}</h3>
            </div>
            <div className="class-body">
              <div className="class-meta">
                <div>
                  <span className="meta-label">Sĩ số</span>
                  <p className="meta-value">{item.students} học viên</p>
                </div>
                <div>
                  <span className="meta-label">Buổi tiếp theo</span>
                  <p className="meta-value">{item.nextSession}</p>
                </div>
              </div>
              <div className="progress-wrapper">
                <div className="progress-label">
                  Tiến độ khóa học ({item.progress}%)
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${item.progress}%` }}>
                    <span className="visually-hidden">{item.progress}% complete</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="class-actions">
              <button type="button" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-people"></i> Danh sách học viên
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm">
                <i className="bi bi-clipboard-check"></i> Chấm bài
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeacherClasses;
