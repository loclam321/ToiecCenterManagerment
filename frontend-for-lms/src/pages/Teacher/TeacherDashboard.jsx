import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './css/TeacherDashboard.css';
import { fetchTeacherClasses } from '../../services/teacherClassService';
import { fetchTeacherTestHistory, fetchTeacherTestScoreboard } from '../../services/teacherTestService';
import axios from 'axios';
import { getToken, getCurrentUser } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

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

// Compute schedule status - simple logic matching TeacherSchedule.jsx
const computeScheduleStatus = (schedule) => {
  if (!schedule.schedule_date) return 'upcoming';
  
  const schedDate = schedule.schedule_date; // YYYY-MM-DD
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
  
  // Simple date string comparison (timezone-safe)
  if (schedDate < todayStr) return 'completed';
  if (schedDate === todayStr) return 'today';
  return 'upcoming';
};

function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [classTests, setClassTests] = useState({}); // { [class_id]: { tests: [], attempts: number, avgBestScore10?: number } }
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

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

        // 2) Load teacher's schedules directly from schedules API
        const token = getToken();
        const currentUser = getCurrentUser();
        const teacherId = currentUser?.user_id;
        
        if (teacherId) {
          try {
            const schedResp = await axios.get(
              `${API_BASE_URL}/api/schedules/by-teacher/${teacherId}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
              }
            );
            const schedules = schedResp.data?.data || [];
            
            // Compute status for each schedule and filter today + upcoming
            const withStatus = schedules.map(s => ({
              ...s,
              computedStatus: s.status || computeScheduleStatus(s)
            }));
            
            // Filter: only "today" and "upcoming" (exclude "completed")
            const upcoming = withStatus
              .filter(s => s.computedStatus === 'today' || s.computedStatus === 'upcoming')
              .sort((a, b) => {
                const dtA = toDateTime(a.schedule_date, a.schedule_startime);
                const dtB = toDateTime(b.schedule_date, b.schedule_startime);
                if (!dtA && !dtB) return 0;
                if (!dtA) return 1;
                if (!dtB) return -1;
                return dtA - dtB;
              })
              .slice(0, 6);
            
            if (!cancelled) setUpcomingSchedules(upcoming);
          } catch (e) {
            console.error('Error loading teacher schedules:', e);
            // Set empty array on error so UI shows "Không có buổi dạy"
            if (!cancelled) setUpcomingSchedules([]);
          }
        }

        // 3) For each class, load tests history summary
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

        // 4) For accuracy, compute per-class average student score (10-point) from the latest test scoreboard
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
    const upcomingSessions = upcomingSchedules.length;
    const pendingAssignments = Object.values(classTests).reduce((sum, v) => sum + (v.attempts || 0), 0);
    return { totalClasses, activeStudents, upcomingSessions, pendingAssignments };
  }, [classes, classTests, upcomingSchedules]);

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
              <h3>Lịch dạy trong tuần</h3>
              <Link className="btn btn-sm btn-outline-primary" to="/teachers/schedule">Xem đầy đủ</Link>
            </div>
            <ul className="schedule-list">
              {loading && <li className="p-3 text-muted">Đang tải...</li>}
              {!loading && upcomingSchedules.length === 0 && (
                <li className="p-3 text-muted">Không có buổi dạy sắp tới</li>
              )}
              {!loading && upcomingSchedules.map((schedule) => {
                const dt = toDateTime(schedule.schedule_date, schedule.schedule_startime);
                const status = schedule.computedStatus;
                const isToday = status === 'today';
                
                return (
                  <li key={schedule.schedule_id} className="schedule-item">
                    <div className="session-meta">
                      <div className="session-time">
                        <span className="time">
                          {schedule.schedule_startime ? schedule.schedule_startime.substring(0, 5) : '—'}
                          {' - '}
                          {schedule.schedule_endtime ? schedule.schedule_endtime.substring(0, 5) : '—'}
                        </span>
                        <span className="date">
                          {dt ? dt.toLocaleDateString('vi-VN') : schedule.schedule_date}
                        </span>
                      </div>
                      <div className="session-info">
                        <h4>
                          {schedule.class_name || `Lớp #${schedule.class_id}`}
                          {isToday && (
                            <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                              ● Lịch dạy tới
                            </span>
                          )}
                          {status === 'upcoming' && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem' }}>
                              ○ Lịch dạy
                            </span>
                          )}
                        </h4>
                        <p>
                          {schedule.room_name || 'Chưa có phòng'}
                          {schedule.teacher_name && ` • ${schedule.teacher_name}`}
                        </p>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right"></i>
                  </li>
                );
              })}
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
