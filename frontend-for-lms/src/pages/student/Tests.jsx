import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTests, getTestAttempts, checkTestEligibility } from '../../services/testService';
import { getCurrentUser } from '../../services/authService';

export default function StudentTests() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const [attemptSummaries, setAttemptSummaries] = useState({}); // { [test_id]: {count, best_score, last_submitted_at, can_attempt, remaining} }
  const user = getCurrentUser();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listTests();
        if (!mounted) return;
        setTests(data);
        // fetch attempts summary per test if logged in
        if (user?.user_id) {
          const summaries = {};
          await Promise.all(
            (data || []).map(async (t) => {
              try {
                const [attemptsData, eligibilityData] = await Promise.all([
                  getTestAttempts(t.test_id, user.user_id),
                  checkTestEligibility(t.test_id, user.user_id)
                ]);
                summaries[t.test_id] = {
                  count: attemptsData.count || (Array.isArray(attemptsData.attempts) ? attemptsData.attempts.length : 0),
                  best_score: attemptsData.best_score ?? null,  // Raw score (backward compatible)
                  best_score_10: attemptsData.best_score_10 ?? null,  // Điểm thang 10
                  last_submitted_at: attemptsData.last_submitted_at || null,
                  can_attempt: eligibilityData.can_attempt ?? true,
                  remaining_attempts: eligibilityData.remaining_attempts ?? 2,
                  max_attempts: eligibilityData.max_attempts ?? 2,
                };
              } catch (_) {
                // ignore per-test errors
              }
            })
          );
          if (mounted) setAttemptSummaries(summaries);
        }
      } catch (e) {
        setError(e.message || 'Không thể tải bài kiểm tra');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card p-3">
      <div className="d-flex align-items-center justify-content-between">
        <h5 className="mb-0">Bài kiểm tra</h5>
      </div>
      <hr />
      {loading && <p>Đang tải...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <div className="list-group">
          {tests.length === 0 && <div className="text-muted">Chưa có bài kiểm tra nào.</div>}
          {tests.map((t) => (
            <div key={t.test_id} className="list-group-item d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-semibold">{t.test_name || `Bài kiểm tra #${t.test_id}`}</div>
                {t.test_description && <div className="text-muted small">{t.test_description}</div>}
                <div className="text-muted small">
                  Thời lượng: {t.test_duration_min ?? '—'} phút • Tổng câu: {t.test_total_questions ?? '—'}
                </div>
                {attemptSummaries[t.test_id] && (
                  <div className="mt-1">
                    <span className="badge text-bg-light me-2">
                      Đã làm: {attemptSummaries[t.test_id].count}/{attemptSummaries[t.test_id].max_attempts}
                    </span>
                    {typeof attemptSummaries[t.test_id].best_score_10 === 'number' ? (
                      <span className="badge bg-success me-2">
                        Điểm cao nhất: {attemptSummaries[t.test_id].best_score_10.toFixed(attemptSummaries[t.test_id].best_score_10 % 1 === 0 ? 0 : 2)}/10
                      </span>
                    ) : typeof attemptSummaries[t.test_id].best_score === 'number' ? (
                      <span className="badge bg-success me-2">Số câu đúng: {attemptSummaries[t.test_id].best_score}</span>
                    ) : null}
                    {attemptSummaries[t.test_id].last_submitted_at && (
                      <span className="text-muted small">Lần gần nhất: {new Date(attemptSummaries[t.test_id].last_submitted_at).toLocaleString()}</span>
                    )}
                    {!attemptSummaries[t.test_id].can_attempt && (
                      <div className="mt-2">
                        <span className="badge bg-danger">
                          ⚠️ Đã hết lượt làm bài (tối đa {attemptSummaries[t.test_id].max_attempts} lần)
                        </span>
                      </div>
                    )}
                    {attemptSummaries[t.test_id].can_attempt && attemptSummaries[t.test_id].remaining_attempts > 0 && (
                      <div className="mt-1">
                        <span className="badge bg-warning text-dark">
                          Còn {attemptSummaries[t.test_id].remaining_attempts} lần làm bài
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                {attemptSummaries[t.test_id] && !attemptSummaries[t.test_id].can_attempt ? (
                  <button 
                    className="btn btn-secondary" 
                    disabled
                    title="Bạn đã hết lượt làm bài kiểm tra này"
                  >
                    Đã hết lượt
                  </button>
                ) : (
                  <Link
                    className="btn btn-primary"
                    to={`/student/tests/${t.test_id}`}
                    state={{ freshStart: true }}
                  >
                    Bắt đầu
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
