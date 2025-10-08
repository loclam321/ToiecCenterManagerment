import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTests, getTestMeta } from '../../services/testService';

export default function StudentTests() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listTests();
        if (!mounted) return;
        setTests(data);
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
              </div>
              <div>
                <Link className="btn btn-primary" to={`/student/tests/${t.test_id}`}>Bắt đầu</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
