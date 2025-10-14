import { useEffect, useState } from 'react';
import { getStudentTestResults } from '../../services/testService';
import './StudentTestResults.css';

function StudentTestResults({ student, classId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!student?.user_id || !classId) return;
      try {
        setLoading(true);
        setError('');
        const result = await getStudentTestResults(classId, student.user_id);
        if (!mounted) return;
        setData(result);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải kết quả bài kiểm tra');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [student?.user_id, classId]);

  const formatScore10 = (score) => {
    if (score === null || score === undefined) return '-';
    return Number.isFinite(score) ? score.toFixed(score % 1 === 0 ? 0 : 2) : '-';
  };

  const getScoreColor = (percentage) => {
    if (percentage === null || percentage === undefined) return 'text-muted';
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-primary';
    if (percentage >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="student-test-results-backdrop" onClick={onClose}>
      <div className="student-test-results-modal card shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Kết quả bài kiểm tra</h5>
            <small className="text-muted">
              Học viên: <strong>{student?.name || student?.user_id}</strong>
              {data?.student_info?.class_name && (
                <> · Lớp: <strong>{data.student_info.class_name}</strong></>
              )}
            </small>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Đóng" />
        </div>

        <div className="card-body">
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="text-muted mt-2">Đang tải dữ liệu...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {data.tests.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem' }} />
                  <p className="mt-2">Chưa có bài kiểm tra nào trong hệ thống.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Danh sách bài kiểm tra ({data.total_tests})</h6>
                      <small className="text-muted">
                        Đã làm: <strong>{data.tests.filter(t => t.has_attempted).length}</strong> bài
                      </small>
                    </div>
                  </div>

                  <div className="test-results-list">
                    {data.tests.map((test) => (
                      <div key={test.test_id} className={`test-result-card ${test.has_attempted ? 'completed' : 'pending'}`}>
                        <div className="test-header">
                          <div className="d-flex align-items-start justify-content-between">
                            <div className="flex-grow-1">
                              <h6 className="test-name mb-1">{test.test_name || `Test ${test.test_id}`}</h6>
                              {test.test_description && (
                                <p className="test-description text-muted small mb-2">{test.test_description}</p>
                              )}
                            </div>
                            {test.has_attempted ? (
                              <span className="badge bg-success ms-2">Đã làm</span>
                            ) : (
                              <span className="badge bg-secondary ms-2">Chưa làm</span>
                            )}
                          </div>
                        </div>

                        <div className="test-body">
                          {test.has_attempted ? (
                            <div className="row g-3">
                              <div className="col-md-4">
                                <div className="score-box">
                                  <div className="score-label">Điểm cao nhất</div>
                                  <div className={`score-value ${getScoreColor(test.student_percentage)}`}>
                                    {formatScore10(test.student_score_10)}
                                  </div>
                                  <div className="score-detail">
                                    {test.student_best_score ?? 0} câu đúng · {test.student_percentage?.toFixed(1) ?? 0}%
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="stat-box">
                                  <div className="stat-label">Số lần làm</div>
                                  <div className="stat-value">{test.student_attempt_count}</div>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="stat-box">
                                  <div className="stat-label">Người đã làm trong lớp</div>
                                  <div className="stat-value">{test.class_total_participants}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3 text-muted">
                              <small>
                                Học viên chưa làm bài kiểm tra này.
                                {test.class_total_participants > 0 && (
                                  <> ({test.class_total_participants} người khác đã làm)</>
                                )}
                              </small>
                            </div>
                          )}
                        </div>

                        {test.test_duration_min && (
                          <div className="test-footer">
                            <small className="text-muted">
                              <i className="bi bi-clock me-1" />
                              Thời gian: {test.test_duration_min} phút
                            </small>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="card-footer d-flex justify-content-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentTestResults;
