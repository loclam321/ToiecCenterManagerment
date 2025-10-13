import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentLessons } from '../../services/studentLessonService';
import '../student/css/lesson.css';

function LessonList() {
  const [lessons, setLessons] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (value) => {
    if (!value) return 'Không xác định';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Không xác định';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchStudentLessons();
        if (!mounted) return;
        setLessons(data.lessons || []);
        setClasses(data.classes || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải danh sách bài học');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="card p-4 text-center">Đang tải danh sách bài học...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!lessons.length) {
    return (
      <div className="card p-4">
        <h5 className="mb-3">Bài học hàng tuần</h5>
        <p className="mb-0 text-muted">Chưa có bài học được kích hoạt cho tài khoản của bạn.</p>
      </div>
    );
  }

  const classInfo = classes.length ? classes[0] : null;

  return (
    <div className="lesson-list-wrapper">
      <div className="card p-4 mb-3 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <h5 className="mb-1">Lộ trình học theo tuần</h5>
            {classInfo ? (
              <p className="mb-0 text-muted">
                Lớp <strong>{classInfo.class_name || classInfo.class_id}</strong> · Khóa{' '}
                <strong>{classInfo.course_name || classInfo.course_id}</strong>
              </p>
            ) : (
              <p className="mb-0 text-muted">Tổng hợp các bài học theo lộ trình đã đăng ký.</p>
            )}
          </div>
          <div className="text-md-end">
            <span className="badge bg-primary">{lessons.filter((x) => x.is_unlocked).length} / {lessons.length} bài học đã mở</span>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {lessons.map((lesson) => {
          const availableDate = formatDate(lesson.available_from);
          return (
            <div className="col-md-6 col-xl-4" key={lesson.lesson_id}>
              <div className={`lesson-card card h-100 ${lesson.is_unlocked ? '' : 'locked'}`}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <div className="badge bg-secondary mb-2">Tuần {lesson.week_index}</div>
                      <h6 className="mb-1">{lesson.lesson_name}</h6>
                    </div>
                    {lesson.part?.part_code && (
                      <span className="badge bg-light text-dark border">{lesson.part.part_section} · {lesson.part.part_code}</span>
                    )}
                  </div>
                  <p className="text-muted small mb-2">Mở từ: <strong>{availableDate}</strong></p>
                  <p className="text-muted small mb-3">Số câu luyện tập: {lesson.question_count || 0}</p>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className={`status-pill ${lesson.is_unlocked ? 'unlocked' : 'locked'}`}>
                      {lesson.is_unlocked ? 'Đã mở khóa' : 'Chưa mở khóa'}
                    </span>
                    {lesson.is_unlocked ? (
                      <Link to={`/student/lessons/${lesson.lesson_id}`} className="btn btn-primary btn-sm">
                        Vào học
                      </Link>
                    ) : (
                      <button type="button" className="btn btn-outline-secondary btn-sm" disabled>
                        Chờ mở khóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LessonList;
