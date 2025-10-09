import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTestMeta, getTestQuestions, submitTest } from '../../services/testService';
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
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
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
  }, [testId]);

  const total = questions.length;
  const currentQ = total > 0 ? questions[currentIdx] : null;

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
  if (error) return <div className="alert alert-danger">{error}</div>;

  if (result) {
    return (
      <div className="card p-3">
        <h5>Kết quả</h5>
        <div className="mt-2">Điểm: {result?.sc_score ?? '-'}</div>
        <div>
          Đúng: {result?.breakdown?.correct ?? 0} / {result?.breakdown?.total ?? total}
          {' '}({result?.breakdown?.percentage ?? 0}%)
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={() => navigate('/student/tests')}>Quay lại danh sách</button>
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
            <div className="fw-semibold">Câu {currentQ.order} / {total}</div>
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
