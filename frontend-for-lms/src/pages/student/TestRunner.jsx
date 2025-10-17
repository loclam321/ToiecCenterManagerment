import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTestMeta, getTestQuestions, submitTest, checkTestEligibility } from '../../services/testService';
import { getCurrentUser } from '../../services/authService';
import useCountdown from '../../services/useCountdown';
import './css/testRunner.css';

export default function TestRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [item_id]: choice_id }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0); // 0-based index of current question
  const [eligibility, setEligibility] = useState(null); // Kiểm tra quyền làm bài
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Kiểm tra quyền làm bài trước
        let eligibilityCheck = null;
        if (user?.user_id) {
          eligibilityCheck = await checkTestEligibility(testId, user.user_id);
          if (!mounted) return;
          setEligibility(eligibilityCheck);
          
          // Nếu đã hết lượt, dừng lại và hiển thị thông báo
          if (!eligibilityCheck.can_attempt) {
            setError(`Bạn đã hết lượt làm bài này (${eligibilityCheck.attempt_count}/${eligibilityCheck.max_attempts} lần). Vui lòng liên hệ giáo viên nếu cần làm thêm.`);
            setLoading(false);
            return;
          }
        }
        
        const [metaResp, qs] = await Promise.all([
          getTestMeta(testId),
          getTestQuestions(testId),
        ]);
        if (!mounted) return;
        setMeta(metaResp);
        setQuestions(qs);
      } catch (e) {
        setError(e.message || 'Không thể tải bài kiểm tra');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [testId, user?.user_id]);

  const total = questions.length;
  const currentQ = total > 0 ? questions[currentIdx] : null;
  // Build a robust label for the current question's Part with sensible fallbacks
  const currentPartLabel = currentQ ? (() => {
    const prefix = [currentQ.part_section, currentQ.part_code].filter(Boolean).join(' ').trim();
    if (currentQ.part_name && prefix) return `${prefix} — ${currentQ.part_name}`;
    if (currentQ.part_name) return currentQ.part_name;
    if (prefix) return prefix;
    if (currentQ.part_id) return `Part ${currentQ.part_id}`;
    return null;
  })() : null;

  const onChoose = (itemId, choiceId) => {
    setAnswers(prev => ({ ...prev, [itemId]: choiceId }));
  };

  const doSubmit = async () => {
    try {
      setSubmitting(true);
      // Build responses array per backend contract
      const responses = Object.entries(answers).map(([qs_index, as_choice_id]) => ({
        qs_index: Number(qs_index),
        as_index: as_choice_id,
      }));
      const payload = {
        user_id: user?.user_id,
        class_id: undefined, // optional for now
        responses,
      };
      const resp = await submitTest(testId, payload);
      setResult(resp);
    } catch (e) {
      setError(e.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Countdown: start only after meta loads and has duration (support both _min and plain)
  const durationMin = Number(meta?.test_duration_min ?? meta?.test_duration ?? 0) || 0;
  const enableTimer = Boolean(meta && durationMin > 0);
  const totalSeconds = enableTimer ? Math.max(0, Math.floor(durationMin * 60)) : 0;
  const storageId = enableTimer ? `test-${testId}-${user?.user_id || 'anon'}-v2` : null;
  const { remaining, setRemaining, format, reset } = useCountdown(totalSeconds, storageId, async () => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    // Auto submit when time's up if not already submitted
    try {
      await doSubmit();
    } catch (_) {
      // swallow; error shown by doSubmit
    }
  });

  // Initialize countdown when meta is ready, unless we have a positive persisted value
  useEffect(() => {
    if (!enableTimer || !storageId || totalSeconds <= 0) return;
    const key = `countdown:${storageId}`;
    const persisted = Number(localStorage.getItem(key));
    const freshStart = Boolean(location.state?.freshStart);
    if (freshStart) {
      // Start new session explicitly without invoking restart semantics
      localStorage.setItem(key, String(totalSeconds));
      setRemaining(totalSeconds);
      // Clear the flag so reloads don't keep resetting
      history.replaceState({ ...history.state, usr: { ...location.state, freshStart: false } }, '');
      return;
    }
    if (!Number.isFinite(persisted) || persisted <= 0) {
      localStorage.setItem(key, String(totalSeconds));
      setRemaining(totalSeconds);
    }
  }, [enableTimer, storageId, totalSeconds, location.state, setRemaining]);

  if (loading) return <div className="card p-3">Đang tải đề...</div>;
  if (error) {
    return (
      <div className="card p-3">
        <div className="alert alert-danger mb-3">
          <h5 className="alert-heading">⚠️ Không thể làm bài</h5>
          <p className="mb-0">{error}</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/student/tests')}
        >
          ← Quay lại danh sách bài kiểm tra
        </button>
      </div>
    );
  }

  if (result) {
    const totalQuestions = Number(result?.breakdown?.total ?? total ?? 0);
    const correctAnswers = Number(result?.breakdown?.correct ?? 0);
    const scorePerQuestion = totalQuestions > 0 ? 10 / totalQuestions : 0;
    const currentScore10 = Number.isFinite(scorePerQuestion)
      ? Number((correctAnswers * scorePerQuestion).toFixed(2))
      : 0;
    const attemptsWithScore = Array.isArray(result?.attempts)
      ? result.attempts.map((attempt) => {
          const attemptTotal = Number(attempt.att_total_questions ?? totalQuestions ?? 0);
          const attemptCorrect = Number(attempt.att_correct_count ?? 0);
          const perQuestion = attemptTotal > 0 ? 10 / attemptTotal : 0;
          const score10 = Number.isFinite(perQuestion)
            ? Number((attemptCorrect * perQuestion).toFixed(2))
            : 0;
          return {
            ...attempt,
            _score10: score10,
            _attemptTotal: attemptTotal,
            _attemptCorrect: attemptCorrect,
          };
        })
      : [];
    const bestScore10 = attemptsWithScore.length
      ? attemptsWithScore.reduce((max, attempt) => (attempt._score10 > max ? attempt._score10 : max), 0)
      : currentScore10;

    const formatScore10 = (score) => (Number.isFinite(score) ? score.toFixed(score % 1 === 0 ? 0 : 2) : '-');

    return (
      <div className="card p-3">
        <h5 className="mb-3">🎯 Kết quả bài kiểm tra</h5>
        
        {result?.low_score_warning && (
          <div className="alert alert-warning my-2" role="alert">
            <strong>⚠️ Lưu ý:</strong> Điểm của bạn đang dưới {result?.low_score_threshold_percent}% tổng số câu. Hãy ôn luyện thêm và thử lại nhé!
          </div>
        )}
        
        {/* Điểm số và trạng thái */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="card bg-light border-0">
              <div className="card-body text-center">
                <div className="text-muted small mb-1">Điểm lần này</div>
                <div className="fs-2 fw-bold text-primary">{formatScore10(currentScore10)}</div>
                <div className="text-muted small">(thang điểm 10)</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-light border-0">
              <div className="card-body text-center">
                <div className="text-muted small mb-1">🏆 Điểm cao nhất</div>
                <div className="fs-2 fw-bold text-success">{formatScore10(bestScore10)}</div>
                <div className="text-muted small">(thang điểm 10)</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-light border-0">
              <div className="card-body text-center">
                <div className="text-muted small mb-1">Kết quả</div>
                <span className={`badge fs-5 ${result?.passed ? 'bg-success' : 'bg-secondary'}`}>
                  {result?.passed ? '✓ Đạt' : '✗ Chưa đạt'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê tổng quan */}
        <div className="alert alert-info mb-3">
          <div className="row text-center">
            <div className="col-4">
              <strong>Số câu đúng</strong>
              <div className="fs-5">{result?.breakdown?.correct ?? 0} / {result?.breakdown?.total ?? total}</div>
            </div>
            <div className="col-4">
              <strong>Tỷ lệ đúng</strong>
              <div className="fs-5">{result?.breakdown?.percentage ?? 0}%</div>
            </div>
            <div className="col-4">
              <strong>Số lần làm</strong>
              <div className="fs-5">{result?.attempts?.length ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Chi tiết từng câu */}
        {Array.isArray(result?.detailed_responses) && result.detailed_responses.length > 0 && (
          <div className="mb-4">
            <h6 className="mb-3">📝 Chi tiết từng câu</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '60px' }} className="text-center">Câu</th>
                    <th>Phần thi</th>
                    <th style={{ width: '120px' }} className="text-center">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {result.detailed_responses.map((resp, idx) => (
                    <tr key={idx} className={resp.is_correct ? 'table-success' : 'table-danger'}>
                      <td className="text-center fw-bold">{resp.question_number}</td>
                      <td>{resp.part_name || `Part ${resp.part_id || '-'}`}</td>
                      <td className="text-center">
                        {resp.is_correct ? (
                          <span className="badge bg-success">✓ Đúng</span>
                        ) : (
                          <span className="badge bg-danger">✗ Sai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lịch sử làm bài */}
        {attemptsWithScore.length > 0 && (
          <div className="mb-3">
            <h6 className="mb-3">📊 Lịch sử làm bài ({attemptsWithScore.length} lần)</h6>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Thời gian nộp</th>
                    <th style={{ width: '120px' }} className="text-center">Điểm (0-10)</th>
                    <th style={{ width: '120px' }} className="text-center">Đúng/Tổng</th>
                    <th style={{ width: '100px' }} className="text-center">Tỷ lệ</th>
                    <th style={{ width: '120px' }} className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {attemptsWithScore.map((a, idx) => {
                    const isBest = Math.abs(a._score10 - bestScore10) < 0.01;
                    const isCurrent = a.att_id === result.current_attempt_id;
                    return (
                      <tr key={a.att_id || idx} className={isCurrent ? 'table-info' : ''}>
                        <td className="text-center">{idx + 1}</td>
                        <td>
                          <small>{a.att_submitted_at ? new Date(a.att_submitted_at).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}</small>
                        </td>
                        <td className="text-center">
                          <strong className="fs-6">{formatScore10(a._score10)}</strong>
                          {isBest && <div><span className="badge bg-warning text-dark">🏆 Best</span></div>}
                        </td>
                        <td className="text-center">
                          {a._attemptCorrect ?? '-'} / {a._attemptTotal ?? '-'}
                        </td>
                        <td className="text-center">
                          {typeof a.att_percentage === 'number' ? (
                            <span className={`badge ${a.att_percentage >= 50 ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {a.att_percentage.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${a.att_status === 'COMPLETED' ? 'bg-success' : 'bg-secondary'}`}>
                            {a.att_status || '—'}
                          </span>
                          {isCurrent && <div><span className="badge bg-info mt-1">Mới nhất</span></div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-primary" onClick={() => navigate('/student/tests')}>
            ← Quay lại danh sách
          </button>
          <button 
            className="btn btn-outline-success" 
            onClick={() => {
              // Reload page to start fresh
              window.location.reload();
            }}
          >
            🔄 Làm lại bài test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h5 className="mb-0">{meta?.test_name || 'Bài kiểm tra'}</h5>
        <div className="d-flex align-items-center gap-2" aria-live="polite">
          {enableTimer ? (
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">Thời gian còn lại:</span>
              <span
                className={`badge rounded-pill ${remaining <= 60 ? 'bg-danger' : 'bg-warning text-dark'}`}
                style={{ fontSize: '1.1rem', padding: '0.5rem 0.75rem' }}
              >
                {format()}
              </span>
            </div>
          ) : (
            <div className="text-muted">Thời lượng: {durationMin || '—'} phút</div>
          )}
        </div>
      </div>
      
      {/* Hiển thị số lượt còn lại */}
      {eligibility && eligibility.remaining_attempts !== undefined && (
        <div className="mt-2">
          <div className={`alert ${eligibility.remaining_attempts <= 1 ? 'alert-warning' : 'alert-info'} py-2 px-3 mb-0`}>
            <strong>📊 Lượt làm bài:</strong> Đây là lần thứ {eligibility.attempt_count + 1}/{eligibility.max_attempts} của bạn
            {eligibility.remaining_attempts > 1 && ` (còn ${eligibility.remaining_attempts - 1} lượt sau lần này)`}
            {eligibility.remaining_attempts === 1 && ' (⚠️ Đây là lượt cuối cùng!)'}
          </div>
        </div>
      )}
      
      {currentPartLabel && (
        <div className="mt-2" aria-live="polite">
          <div className="alert alert-info py-2 px-3 mb-0" role="status">
            Bạn đang ở: <strong>{currentPartLabel}</strong>
          </div>
        </div>
      )}
      {/* Question Navigator */}
      {total > 0 && (
        <div className="mt-3">
          <div className="qn-wrap">
            {questions.map((q, idx) => {
              const answered = Boolean(answers[q.qs_index]);
              const isActive = idx === currentIdx;
              const classNames = ['qn-pill'];
              if (answered) classNames.push('answered');
              if (isActive) classNames.push('active');
              return (
                <button
                  type="button"
                  key={q.qs_index}
                  className={classNames.join(' ')}
                  onClick={() => {
                    setCurrentIdx(idx);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title={answered ? 'Đã trả lời' : 'Chưa trả lời'}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

        </div>
      )}
      <hr />

      {currentQ && (
        <div key={currentQ.qs_index} className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              {currentPartLabel && (
                <span className="badge bg-secondary">{currentPartLabel}</span>
              )}
              <div className="fw-semibold">Câu {currentQ.order} / {total}</div>
            </div>
            <div className="text-muted small">
              {answers[currentQ.qs_index] ? 'Đã chọn' : 'Chưa trả lời'}
            </div>
          </div>

          {(() => {
            const hasImage = Boolean(currentQ.item_image_path);
            return (
              <div className="d-flex flex-column flex-lg-row align-items-start gap-3">
                {/* Left: Image (70%) */}
                {hasImage && (
                  <div className="flex-grow-1 mb-2 mb-lg-0" style={{ flexBasis: '70%' }}>
                    <img
                      src={currentQ.item_image_path}
                      alt="stimulus"
                      className="img-fluid rounded"
                      style={{ width: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Right: Audio + Text + Answers (30% or 100% if no image) */}
                <div style={{ flexBasis: hasImage ? '30%' : '100%', minWidth: hasImage ? 280 : 'auto' }}>
                  {currentQ.item_stimulus_text && (
                    <div className="text-muted small mb-2">{currentQ.item_stimulus_text}</div>
                  )}
                  {currentQ.qs_desciption && (
                    <div className="mb-2">{currentQ.qs_desciption}</div>
                  )}
                  {currentQ.item_audio_path && (
                    <div className="mb-3"><audio controls src={currentQ.item_audio_path} style={{ width: '100%' }} /></div>
                  )}
                  <div>
                    {currentQ.answers.map((a) => (
                      <label key={a.as_index} className="d-block mb-2">
                        <input
                          type="radio"
                          name={`q_${currentQ.qs_index}`}
                          className="form-check-input me-2"
                          checked={answers[currentQ.qs_index] === a.as_index}
                          onChange={() => onChoose(currentQ.qs_index, a.as_index)}
                        />
                        <span className="me-1 fw-semibold">{a.choice_label}.</span>
                        {a.as_content}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="d-flex justify-content-between mt-3">
        <div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/student/tests')}
          >
            Thoát
          </button>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-light"
            disabled={currentIdx === 0}
            onClick={() => { setCurrentIdx((i) => Math.max(i - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Câu trước
          </button>
          {currentIdx < total - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => { setCurrentIdx((i) => Math.min(i + 1, total - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              Câu tiếp
            </button>
          ) : (
            <button className="btn btn-primary" disabled={submitting} onClick={doSubmit}>
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
