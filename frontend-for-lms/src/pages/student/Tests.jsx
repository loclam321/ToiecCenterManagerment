import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTests, getTestAttempts } from '../../services/testService';
import { getCurrentUser } from '../../services/authService';

export default function StudentTests() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const [attemptSummaries, setAttemptSummaries] = useState({}); // { [test_id]: {count, best_score, last_submitted_at} }
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
                const s = await getTestAttempts(t.test_id, user.user_id);
                summaries[t.test_id] = {
                  count: s.count || (Array.isArray(s.attempts) ? s.attempts.length : 0),
                  best_score: s.best_score ?? null,
                  last_submitted_at: s.last_submitted_at || null,
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
                    <span className="badge text-bg-light me-2">Đã làm: {attemptSummaries[t.test_id].count}</span>
                    {typeof attemptSummaries[t.test_id].best_score === 'number' && (
                      <span className="badge bg-success me-2">Điểm cao nhất: {attemptSummaries[t.test_id].best_score}</span>
                    )}
                    {attemptSummaries[t.test_id].last_submitted_at && (
                      <span className="text-muted small">Lần gần nhất: {new Date(attemptSummaries[t.test_id].last_submitted_at).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Link
                  className="btn btn-primary"
                  to={`/student/tests/${t.test_id}`}
                  state={{ freshStart: true }}
                >
                  Bắt đầu
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
