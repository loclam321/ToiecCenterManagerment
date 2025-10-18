import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './css/TeacherDashboard.css';
import { fetchTeacherClasses } from '../../services/teacherClassService';
import { fetchTeacherTestHistory, fetchTeacherTestScoreboard } from '../../services/teacherTestService';

// Helper: parse date (YYYY-MM-DD) and time (HH:MM) into Date
const toDateTime = (dStr, tStr) => {
  if (!dStr) return null;
  try {
    const [y, m, d] = dStr.split('-').map(Number);
    let hh = 0, mm = 0;
    if (tStr) {
      const [h, mi] = String(tStr).split(':').map(Number);
      hh = isNaN(h) ? 0 : h;
      mm = isNaN(mi) ? 0 : mi;
    }
    return new Date(y, (m || 1) - 1, d || 1, hh, mm);
  } catch {
    return null;
  }
};

function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [classTests, setClassTests] = useState({}); // { [class_id]: { tests: [], attempts: number, avgBestScore10?: number } }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // 1) Load classes teacher is responsible for
        const cls = await fetchTeacherClasses();
        if (cancelled) return;
        setClasses(cls || []);

        // 2) For each class, load tests history summary
        const histories = await Promise.all(
          (cls || []).map(async (c) => {
            try {
              const h = await fetchTeacherTestHistory(c.class_id);
              return { class_id: c.class_id, tests: h.tests || [] };
            } catch (e) {
              // Skip failures per class
              return { class_id: c.class_id, tests: [] };
            }
          })
        );
        if (cancelled) return;
        const baseMap = {};
        histories.forEach(({ class_id, tests }) => {
          const attempts = (tests || []).reduce((sum, t) => sum + (t.attempt_count || 0), 0);
          baseMap[class_id] = { tests, attempts };
        });

        // 3) For accuracy, compute per-class average student score (10-point) from the latest test scoreboard
        const latestTests = histories
          .map(({ class_id, tests }) => ({ class_id, latestTestId: (tests && tests.length > 0) ? tests[0].test_id : null }))
          .filter((x) => !!x.latestTestId);

        const scoreboardResults = await Promise.all(
          latestTests.map(async ({ class_id, latestTestId }) => {
            try {
              const s = await fetchTeacherTestScoreboard(latestTestId);
              const rows = s.scoreboard || [];
              const scores = rows
                .map((r) => (typeof r.best_score_10 === 'number') ? r.best_score_10 : (typeof r.score_10 === 'number' ? r.score_10 : null))
                .filter((v) => v !== null);
              const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null;
              return { class_id, avgBestScore10: avg };
            } catch (e) {
              return { class_id, avgBestScore10: null };
            }
          })
        );

        const map = { ...baseMap };
        scoreboardResults.forEach(({ class_id, avgBestScore10 }) => {
          if (!map[class_id]) map[class_id] = { tests: [], attempts: 0 };
          map[class_id].avgBestScore10 = avgBestScore10;
        });

        setClassTests(map);
      } catch (e) {
        setError(e?.message || 'Không thể tải dữ liệu dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Compute summary
  const summary = useMemo(() => {
    const totalClasses = classes.length;
    const activeStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
    const upcomingSessions = classes.reduce((count, c) => {
      const ns = c.next_session;
      if (!ns) return count;
      const dt = toDateTime(ns.date, ns.start_time);
      if (!dt) return count;
      return dt >= new Date() ? count + 1 : count;
    }, 0);
    const pendingAssignments = Object.values(classTests).reduce((sum, v) => sum + (v.attempts || 0), 0);
    return { totalClasses, activeStudents, upcomingSessions, pendingAssignments };
  }, [classes, classTests]);

  // Upcoming sessions list (sorted)
  const upcomingSessionsList = useMemo(() => {
    const now = new Date();
    const rows = classes
      .map((c) => {
        const ns = c.next_session;
        if (!ns) return null;
        const dt = toDateTime(ns.date, ns.start_time);
        if (!dt || dt < now) return null;
        return {
          classId: c.class_id,
          className: c.class_name,
          course: c?.course?.course_name || c?.course_name || 'Lớp học',
          startTime: ns.start_time || '',
          date: ns.date || '',
          room: ns.room_name || '',
          dt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 6); // limit list
    return rows;
  }, [classes]);

  // Per-class test stats
  const perClassStats = useMemo(() => {
    return classes.map((c) => {
      const tests = classTests[c.class_id]?.tests || [];
      const testsCount = tests.length;
      const attempts = classTests[c.class_id]?.attempts || 0;
      // Prefer accurate average from latest scoreboard; fallback to average of test bests
      const avgFromScoreboard = classTests[c.class_id]?.avgBestScore10 ?? null;
      let avgBestScore10 = avgFromScoreboard;
      if (avgBestScore10 === null) {
        const bestScores = tests
          .map((t) => (typeof t.best_score_10 === 'number') ? t.best_score_10 : null)
          .filter((v) => v !== null);
        avgBestScore10 = bestScores.length
          ? Math.round((bestScores.reduce((s, v) => s + v, 0) / bestScores.length) * 100) / 100
          : null;
      }
      return {
        class_id: c.class_id,
        class_name: c.class_name,
        student_count: c.student_count || 0,
        progress_percent: c.progress_percent ?? null,
        tests_count: testsCount,
        attempts,
        avg_best_score_10: avgBestScore10,
      };
    });
  }, [classes, classTests]);

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
              <div className="card-value">{loading ? '-' : summary.activeStudents}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon bg-green">
              <i className="bi bi-journal-check"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Lượt làm bài</div>
              <div className="card-value">{loading ? '-' : summary.pendingAssignments}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon bg-orange">
              <i className="bi bi-calendar3"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Buổi dạy sắp tới</div>
              <div className="card-value">{loading ? '-' : summary.upcomingSessions}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon bg-purple">
              <i className="bi bi-easel"></i>
            </div>
            <div className="card-info">
              <div className="card-title">Lớp đang phụ trách</div>
              <div className="card-value">{loading ? '-' : summary.totalClasses}</div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-widgets row g-4 mt-1">
        <div className="col-lg-7">
          <div className="widget-card">
            <div className="card-header">
              <h3>Lịch dạy sắp tới</h3>
              <Link className="btn btn-sm btn-outline-primary" to="/teachers/schedule">Xem đầy đủ</Link>
            </div>
            <ul className="schedule-list">
              {loading && <li className="p-3 text-muted">Đang tải...</li>}
              {!loading && upcomingSessionsList.length === 0 && (
                <li className="p-3 text-muted">Không có buổi dạy sắp tới</li>
              )}
              {!loading && upcomingSessionsList.map((session) => (
                <li key={`${session.classId}-${session.date}-${session.startTime}`} className="schedule-item">
                  <div className="session-meta">
                    <div className="session-time">
                      <span className="time">{session.startTime}</span>
                      <span className="date">{new Date(session.dt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="session-info">
                      <h4>{session.course}</h4>
                      <p>#{session.classId} • {session.room || '—'}</p>
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
              <h3>Thống kê theo lớp</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Lớp</th>
                    <th className="text-center">HV</th>
                    <th className="text-center">Bài</th>
                    <th className="text-center">Lượt</th>
                    <th className="text-center">Điểm TB (10)</th>
                    <th className="text-center">Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={6} className="text-muted p-3">Đang tải...</td></tr>
                  )}
                  {!loading && perClassStats.length === 0 && (
                    <tr><td colSpan={6} className="text-muted p-3">Chưa có dữ liệu</td></tr>
                  )}
                  {!loading && perClassStats.map((row) => (
                    <tr key={row.class_id}>
                      <td>
                        <div className="fw-medium">{row.class_name || `#${row.class_id}`}</div>
                      </td>
                      <td className="text-center">{row.student_count}</td>
                      <td className="text-center">{row.tests_count}</td>
                      <td className="text-center">{row.attempts}</td>
                      <td className="text-center">{row.avg_best_score_10 ?? '—'}</td>
                      <td className="text-center">
                        {typeof row.progress_percent === 'number' ? (
                          <span className="badge bg-primary-subtle text-primary">{row.progress_percent}%</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TeacherDashboard;
