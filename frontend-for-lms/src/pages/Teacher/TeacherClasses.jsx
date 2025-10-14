import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTeacherClasses } from '../../services/teacherClassService';
import StudentTestResults from '../../components/teacher/StudentTestResults';
import './css/TeacherClasses.css';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('vi-VN');
};

const formatTime = (value) => {
  if (!value) return '';
  const parts = value.split(':');
  if (!parts.length) return value;
  const [hour = '00', minute = '00'] = parts;
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const buildNextSessionLabel = (session) => {
  if (!session) return 'Chưa có lịch tiếp theo';
  const dateLabel = formatDate(session.date);
  const timeLabel = formatTime(session.start_time);
  const endLabel = formatTime(session.end_time);
  const roomLabel = session.room_name ? ` · Phòng ${session.room_name}` : '';
  const timeRange = timeLabel && endLabel ? `${timeLabel} - ${endLabel}` : timeLabel;
  return [dateLabel, timeRange].filter(Boolean).join(' · ') + roomLabel;
};

function TeacherClasses() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const loadTeacherClasses = useCallback(
    async (options = {}) => {
      const { ignoreUpdates, showSpinner = true } = options;
      if (showSpinner) {
        setLoading(true);
      }
      if (!ignoreUpdates?.current) {
        setError('');
      }
      try {
        const data = await fetchTeacherClasses();
        if (ignoreUpdates?.current) {
          return;
        }
        const nextClasses = Array.isArray(data) ? data : [];
        setClasses(nextClasses);
        setExpanded((prev) =>
          prev.filter((id) => nextClasses.some((cls) => cls.class_id === id))
        );
      } catch (err) {
        if (!ignoreUpdates?.current) {
          setError(err.message || 'Không thể tải danh sách lớp học');
        }
      } finally {
        if (!ignoreUpdates?.current && showSpinner) {
          setLoading(false);
        }
      }
    },
    [setExpanded]
  );

  useEffect(() => {
    const ignore = { current: false };
    loadTeacherClasses({ ignoreUpdates: ignore });
    return () => {
      ignore.current = true;
    };
  }, [loadTeacherClasses]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0),
    [classes]
  );

  const toggleExpanded = (classId) => {
    setExpanded((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleViewStudentResults = (student, classId) => {
    setSelectedStudent(student);
    setSelectedClassId(classId);
  };

  const closeStudentResults = () => {
    setSelectedStudent(null);
    setSelectedClassId(null);
  };

  if (loading) {
    return (
      <div className="teacher-classes card p-4 text-center">
        Đang tải danh sách lớp học...
      </div>
    );
  }

  return (
    <div className="teacher-classes">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="mb-1">Lớp học phụ trách</h3>
          <p className="text-muted mb-0">
            {classes.length ? `${classes.length} lớp · ${totalStudents} học viên` : 'Chưa có lớp nào được gán'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm align-self-md-end"
          onClick={loadTeacherClasses}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Làm mới
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!classes.length && !error ? (
        <div className="card p-4 text-center text-muted">Chưa có lớp học nào được phân công.</div>
      ) : (
        <div className="classes-grid">
          {classes.map((cls) => {
            const classId = cls.class_id;
            const isExpanded = expanded.includes(classId);
            const studentCount = cls.student_count ?? cls.class_currentenrollment ?? 0;
            const maxStudents = cls.class_maxstudents || null;
            const progressPercent = cls.progress_percent ?? 0;
            const students = Array.isArray(cls.students) ? cls.students : [];
            const displayedStudents = isExpanded ? students : students.slice(0, 4);
            const classCode = cls.course?.course_code || `CLS-${classId}`;

            return (
              <div key={classId} className="class-card">
                <div className="class-header">
                  <span className="badge bg-primary">{classCode}</span>
                  <h3>{cls.class_name || `Lớp ${classId}`}</h3>
                </div>
                <div className="class-body">
                  <div className="class-meta">
                    <div>
                      <span className="meta-label">Sĩ số</span>
                      <p className="meta-value">
                        {studentCount} học viên{maxStudents ? ` / ${maxStudents}` : ''}
                      </p>
                    </div>
                    <div>
                      <span className="meta-label">Buổi tiếp theo</span>
                      <p className="meta-value">{buildNextSessionLabel(cls.next_session)}</p>
                    </div>
                  </div>
                  <div className="progress-wrapper">
                    <div className="progress-label">
                      Tiến độ khóa học ({progressPercent}%)
                    </div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
                      >
                        <span className="visually-hidden">{progressPercent}% complete</span>
                      </div>
                    </div>
                  </div>
                  <div className="student-summary mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="meta-label text-uppercase">Học viên tham gia</span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => toggleExpanded(classId)}
                      >
                        {isExpanded ? 'Thu gọn danh sách' : 'Xem tất cả'}
                      </button>
                    </div>
                    {students.length === 0 ? (
                      <p className="text-muted small mb-0">Chưa có học viên tham gia.</p>
                    ) : (
                      <ul className="student-list mb-0 mt-2">
                        {displayedStudents.map((student) => (
                          <li 
                            key={student.user_id} 
                            className="student-item clickable"
                            onClick={() => handleViewStudentResults(student, classId)}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleViewStudentResults(student, classId);
                              }
                            }}
                            title="Click để xem kết quả bài kiểm tra"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <div className="fw-semibold">{student.name || student.user_id}</div>
                                <div className="text-muted small">
                                  {[student.email, student.telephone]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              </div>
                              <i className="bi bi-chevron-right text-muted" aria-hidden="true" />
                            </div>
                          </li>
                        ))}
                        {!isExpanded && students.length > displayedStudents.length && (
                          <li className="student-item text-muted small">
                            +{students.length - displayedStudents.length} học viên khác
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedStudent && selectedClassId && (
        <StudentTestResults 
          student={selectedStudent}
          classId={selectedClassId}
          onClose={closeStudentResults}
        />
      )}
    </div>
  );
}

export default TeacherClasses;
