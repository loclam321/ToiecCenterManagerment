export default function StudentDashboard() {
  return (
    <div className="student-dashboard">
      <div className="alert alert-info">Chào mừng bạn đến khu vực học viên.</div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Tiến độ học tập</h5>
            <p>Đang học 0 khóa, hoàn thành 0 bài.</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Lịch học sắp tới</h5>
            <p>Chưa có buổi học được lên lịch.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
