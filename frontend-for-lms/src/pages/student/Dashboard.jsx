import React, { useEffect, useState, useMemo } from "react";
import { getCurrentUser, getToken } from "../../services/authService";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [classes, setClasses] = useState([]);
  const [testsByClass, setTestsByClass] = useState({});

  const user = getCurrentUser();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      setError("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem bảng điều khiển.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Lấy lessons (service student/lessons - jwt required)
        const res = await fetch("http://localhost:5000/api/student/lessons", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message || "Không thể tải lessons");

        const data = payload.data || {};
        const lessonsList = data.lessons || [];
        const classesList = data.classes || [];
        setLessons(lessonsList);
        setClasses(classesList);

        // 2) Với mỗi class, lấy test results (endpoint được backend cung cấp)
        const testsMap = {};
        for (const cls of classesList) {
          try {
            const classId = cls.class_id;
            // endpoint: /api/tests/class/<class_id>/student-results?user_id=...
            const testsRes = await fetch(
              `http://localhost:5000/api/tests/class/${classId}/student-results?user_id=${user?.user_id || ""}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const testsPayload = await testsRes.json();
            if (testsRes.ok && testsPayload.data) {
              testsMap[classId] = testsPayload.data.tests || [];
            } else {
              testsMap[classId] = [];
            }
          } catch (e) {
            testsMap[cls.class_id] = [];
          }
        }
        setTestsByClass(testsMap);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Today's date in yyyy-mm-dd for matching lesson.available_from
  const todayStr = new Date().toISOString().slice(0, 10);

  const todaysLessons = lessons.filter((l) => l.available_from === todayStr || (!l.available_from && l.is_unlocked));
  const upcomingLessons = lessons.filter((l) => l.available_from && l.available_from > todayStr);

  // Aggregate test stats across classes
  const testStats = Object.values(testsByClass).flat();
  const testsTakenCount = testStats.filter((t) => t.has_attempted).length;
  const bestScores = testStats
    .map((t) => (t.student_percentage != null ? Number(t.student_percentage) : null))
    .filter((v) => v !== null && !Number.isNaN(v));
  const avgScore = bestScores.length ? Math.round((bestScores.reduce((a, b) => a + b, 0) / bestScores.length) * 100) / 100 : null;

  // --- new: compute lesson completion stats and render a small SVG donut chart ---
  // Chart logic: count tests within the student's classes.
  // - totalTests: number of tests available in the classes the student is enrolled in
  // - completedTests: number of those tests the student has attempted
  const classIds = new Set(classes.map((c) => c.class_id));
  const totalTests = Math.max(
    classes.reduce((sum, cls) => sum + ((testsByClass[cls.class_id] || []).length), 0),
    1
  );
  const completedTests = classes.reduce(
    (sum, cls) => sum + ((testsByClass[cls.class_id] || []).filter((t) => t.has_attempted).length),
    0
  );
  const completedPercent = Math.round((completedTests / totalTests) * 100);

  const donutRadius = 40;
  const donutCirc = 2 * Math.PI * donutRadius;

  // --- lesson-derived stats (based on LessonList logic) ---
  const completionFieldCandidates = ["is_completed", "completed", "user_completed", "is_done", "done"];
  const detectedCompletionField = useMemo(() => {
    if (!lessons || lessons.length === 0) return null;
    const sample = lessons[0];
    return completionFieldCandidates.find((f) => f in sample) || null;
  }, [lessons]);

  const lessonIsCompleted = (lesson) => {
    if (detectedCompletionField) return Boolean(lesson[detectedCompletionField]);
    const clsId = lesson.class?.class_id || lesson.class_id;
    if (clsId && testsByClass[clsId]) {
      const testsForClass = testsByClass[clsId];
      return testsForClass.some((t) => (t.lesson_id === lesson.lesson_id || t.lesson_id === lesson.id) && t.has_attempted);
    }
    return false;
  };

  const {
    totalLessons,
    unlockedCount,
    completedLessons,
    toStudyCount,
    upcomingNextWeekLessons,
  } = useMemo(() => {
    const total = lessons.length;
    const unlocked = lessons.reduce((s, l) => s + (l.is_unlocked ? 1 : 0), 0);
    const completed = lessons.reduce((s, l) => s + (lessonIsCompleted(l) ? 1 : 0), 0);
    // toStudy: unlocked lessons that have questions and are not completed
    const toStudy = lessons.filter((l) => l.is_unlocked && (l.question_count || 0) > 0 && !lessonIsCompleted(l)).length;

    // next 7 days window
    const today = new Date();
    const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    const upcoming = [];
    for (const l of lessons) {
      if (l.is_unlocked) continue;
      if (!l.available_from) continue;
      const d = new Date(l.available_from);
      if (Number.isNaN(d.getTime())) continue;
      const dUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      if (dUTC >= start && dUTC <= end) upcoming.push(l);
    }

    return {
      totalLessons: total,
      unlockedCount: unlocked,
      completedLessons: completed,
      toStudyCount: toStudy,
      upcomingNextWeekLessons: upcoming,
    };
  }, [lessons, testsByClass, detectedCompletionField]);

  return (
    <div className="student-dashboard container">
      <h3 className="mb-3">Tổng quan học tập</h3>

      {!token ? (
        <div className="alert alert-warning">Bạn cần đăng nhập để xem bảng điều khiển.</div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Buổi học hôm nay</h6>
            <strong style={{ fontSize: 24 }}>{todaysLessons.length}</strong>
            <div className="small text-muted">bài học mở/đã lên lịch hôm nay</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Buổi sắp tới</h6>
            <strong style={{ fontSize: 24 }}>{upcomingLessons.length}</strong>
            <div className="small text-muted">bài học có ngày trong tương lai</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Bài kiểm tra đã làm</h6>
            <strong style={{ fontSize: 24 }}>{testsTakenCount}</strong>
            <div className="small text-muted">tổng số test đã nộp</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Điểm trung bình (%)</h6>
            <strong style={{ fontSize: 24 }}>{avgScore != null ? `${avgScore}%` : "—"}</strong>
            <div className="small text-muted">trên các bài đã đo được</div>
          </div>
        </div>
      </div>

      {/* Visual summary: lessons done vs to-study (using LessonList rules) */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="card p-3">
            <h6>Bài học — tiến độ</h6>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 110, textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 700 }}>{completedLessons}</div>
                <div className="small text-muted">Đã hoàn thành</div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{toStudyCount} / {unlockedCount} bài cần làm (đã mở)</div>
                <div className="small text-muted">{unlockedCount} / {totalLessons} bài học đã mở/tổng</div>
                <div style={{ marginTop: 8 }}>
                  <div><span className="badge bg-success me-2">{completedLessons}</span> Hoàn thành</div>
                  <div style={{ marginTop: 6 }}><span className="badge bg-warning text-dark me-2">{toStudyCount}</span> Cần làm (đã mở)</div>
                </div>
              </div>
            </div>

            <div className="small text-muted mt-2">
              Số liệu dựa trên trạng thái mở khóa bài học và cờ hoàn thành (nếu có); nếu không có cờ, dùng kết quả bài kiểm tra liên kết để suy đoán.
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-3">
            <h6>Sắp mở (7 ngày tới)</h6>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 110, textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 700 }}>{upcomingNextWeekLessons.length}</div>
                <div className="small text-muted">sắp mở</div>
              </div>
              <div style={{ flex: 1 }}>
                {upcomingNextWeekLessons.length === 0 ? (
                  <div className="text-muted">Không có bài nào sắp mở trong 7 ngày tới.</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {upcomingNextWeekLessons.slice(0, 5).map((l) => (
                      <li key={l.lesson_id || l.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold small">{l.lesson_name}</div>
                          <div className="text-muted small">Mở: {l.available_from?.slice(0,10) || '—'}</div>
                        </div>
                        <div className="small text-muted">{l.question_count || 0} câu</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Đang tải dữ liệu...</div>
      ) : (
        <div className="row">
          <div className="col-lg-6 mb-3">
            <div className="card p-3">
              <h5>Danh sách bài học hôm nay</h5>
              {todaysLessons.length === 0 ? (
                <div className="text-muted">Hôm nay bạn không có bài học mới.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {todaysLessons.map((l) => (
                    <li key={l.lesson_id} className="list-group-item d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold">{l.lesson_name}</div>
                        <div className="small text-muted">{l.class?.class_name || ""} • {l.part?.part_name || ""}</div>
                      </div>
                      <div className="text-end small">
                        <div>{l.question_count || 0} câu</div>
                        {l.video_link ? <div className="badge bg-primary">Video</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-lg-6 mb-3">
            <div className="card p-3">
              <h5>Trạng thái bài kiểm tra theo lớp</h5>
              {classes.length === 0 ? (
                <div className="text-muted">Bạn chưa có lớp nào.</div>
              ) : (
                classes.map((cls) => (
                  <div key={cls.class_id} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <div className="fw-semibold">{cls.class_name}</div>
                      <div className="small text-muted">{cls.course_name}</div>
                    </div>
                    <div className="mt-2">
                      {(testsByClass[cls.class_id] || []).length === 0 ? (
                        <div className="text-muted small">Không có test / chưa có dữ liệu</div>
                      ) : (
                        <ul className="list-group list-group-flush">
                          {(testsByClass[cls.class_id] || []).map((t) => (
                            <li key={t.test_id} className="list-group-item d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-bold">{t.test_name}</div>
                                <div className="small text-muted">{t.test_status} • {t.student_attempt_count || 0} lần</div>
                              </div>
                              <div className="text-end small">
                                {t.has_attempted ? (
                                  <div><span className="badge bg-success">{t.student_percentage ?? t.student_score_10 ? `${t.student_percentage}%` : "—"}</span></div>
                                ) : (
                                  <div className="text-muted">Chưa làm</div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
