import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestMeta, getTestQuestions, submitTest } from '../../services/testService';
import { getCurrentUser } from '../../services/authService';

export default function TestRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [item_id]: choice_id }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0); // 0-based index of current question

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
      <div className="d-flex align-items-center justify-content-between">
        <h5 className="mb-0">{meta?.test_name || 'Bài kiểm tra'}</h5>
        <div className="text-muted">Thời lượng: {meta?.test_duration_min ?? '—'} phút</div>
      </div>
      <hr />

      {currentQ && (
        <div key={currentQ.qs_index} className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">Câu {currentQ.order} / {total}</div>
            <div className="text-muted small">
              {answers[currentQ.qs_index] ? 'Đã chọn' : 'Chưa trả lời'}
            </div>
          </div>
          {currentQ.item_stimulus_text && (
            <div className="text-muted small mb-2">{currentQ.item_stimulus_text}</div>
          )}
          <div className="mb-2">{currentQ.qs_desciption}</div>
          {currentQ.item_image_path && (
            <div className="mb-2"><img src={currentQ.item_image_path} alt="stimulus" style={{ maxWidth: '100%' }} /></div>
          )}
          {currentQ.item_audio_path && (
            <div className="mb-2"><audio controls src={currentQ.item_audio_path} /></div>
          )}
          <div>
            {currentQ.answers.map((a) => (
              <label key={a.as_index} className="d-block">
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
