import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchLessonDetail, submitLessonQuiz } from '../../services/studentLessonService';
import '../student/css/lesson.css';

function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const totalQuestions = questions.length;

  const formatDate = (value) => {
    if (!value) return 'Không xác định';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Không xác định';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setResult(null);
        setAnswers({});

        const data = await fetchLessonDetail(lessonId);
        if (!mounted) return;
        setLesson(data.lesson || null);
        setQuestions(data.questions || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Không thể tải thông tin bài học');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lessonId]);

  const handleChoose = (itemId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [itemId]: choiceId }));
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const handleSubmit = async () => {
    if (totalQuestions === 0) return;
    try {
      setSubmitting(true);
      const responses = Object.entries(answers).map(([itemId, choiceId]) => ({
        item_id: Number(itemId),
        choice_id: Number(choiceId),
      }));
      const resp = await submitLessonQuiz(lessonId, responses);
      setResult(resp);
    } catch (err) {
      setError(err.message || 'Không thể nộp bài luyện tập');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card p-4 text-center">Đang tải nội dung bài học...</div>;
  }

  if (error) {
    return (
      <div className="card p-4">
        <div className="alert alert-danger mb-3">{error}</div>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/student/lessons')}>
          Quay lại danh sách bài học
        </button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="card p-4">
        <p className="mb-3">Không tìm thấy bài học.</p>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/student/lessons')}>
          Quay lại danh sách bài học
        </button>
      </div>
    );
  }

  const availableDate = formatDate(lesson.available_from);

  return (
    <div className="lesson-detail">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/student/lessons')}>
          ← Danh sách bài học
        </button>
        <span className="badge bg-primary">{lesson.part?.part_section} · {lesson.part?.part_code}</span>
        <span className="text-muted small">Mở từ {availableDate}</span>
      </div>

      <div className="card p-4 mb-4 shadow-sm">
        <h5 className="mb-3">{lesson.lesson_name}</h5>
        {lesson.video_link && (
          <div className="mb-3">
            <video controls src={lesson.video_link} />
          </div>
        )}
        {lesson.learning_path?.summary && (
          <p className="text-muted mb-2">{lesson.learning_path.summary}</p>
        )}
        {lesson.learning_path?.description && (
          <p className="text-muted small mb-0">{lesson.learning_path.description}</p>
        )}
      </div>

      {result ? (
        <div className="summary-card card p-4 mb-4">
          <h6 className="mb-3">Kết quả luyện tập</h6>
          <div className="row g-3 mb-3">
            <div className="col-sm-4">
              <div className="p-3 bg-white rounded border h-100 text-center">
                <div className="text-muted small">Số câu đúng</div>
                <div className="fs-3 fw-bold text-success">{result.correct} / {result.total_questions}</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="p-3 bg-white rounded border h-100 text-center">
                <div className="text-muted small">Tỷ lệ đúng</div>
                <div className="fs-3 fw-bold text-primary">{result.score_percentage?.toFixed?.(2) ?? result.score_percentage}%</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="p-3 bg-white rounded border h-100 text-center">
                <div className="text-muted small">Điểm quy đổi (0-10)</div>
                <div className="fs-3 fw-bold text-warning">{result.score_out_of_10?.toFixed?.(2) ?? result.score_out_of_10}</div>
              </div>
            </div>
          </div>
          {Array.isArray(result.details) && result.details.length > 0 && (
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '60px' }} className="text-center">#</th>
                    <th>Nội dung</th>
                    <th style={{ width: '140px' }} className="text-center">Lựa chọn</th>
                    <th style={{ width: '140px' }} className="text-center">Đáp án đúng</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((item) => (
                    <tr key={item.item_id} className={item.is_correct ? 'table-success' : 'table-danger'}>
                      <td className="text-center fw-semibold">{item.order}</td>
                      <td>{item.question_text || '—'}</td>
                      <td className="text-center">{item.selected_choice_label || '—'}</td>
                      <td className="text-center">{item.correct_choice_label || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-outline-secondary" onClick={() => setResult(null)}>
              Làm lại bài luyện tập
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/student/lessons')}>
              Quay lại danh sách bài học
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-4 lesson-practice">
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
            <h6 className="mb-0">Câu hỏi luyện tập ({totalQuestions})</h6>
            <div className="text-muted small">
              Đã chọn {answeredCount} / {totalQuestions}
            </div>
          </div>

          {totalQuestions === 0 ? (
            <p className="text-muted mb-0">Bài học chưa có câu hỏi luyện tập. Vui lòng thử lại sau.</p>
          ) : (
            <>
              {questions.map((q) => {
                const stimText = q.item_stimulus_text || '';
                const questionText = q.item_question_text || '';
                const hasMedia = Boolean(q.item_image_path || q.item_audio_path);
                return (
                  <div key={q.item_id} className="question-card">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-semibold">Câu {q.order}</div>
                      <div className="text-muted small">
                        {answers[q.item_id] ? 'Đã chọn' : 'Chưa trả lời'}
                      </div>
                    </div>
                    {stimText && <p className="text-muted small mb-2">{stimText}</p>}
                    {questionText && <p className="mb-3">{questionText}</p>}
                    {hasMedia && (
                      <div className="mb-3">
                        {q.item_image_path && (
                          <img
                            src={q.item_image_path}
                            alt="stimulus"
                            className="img-fluid rounded"
                            style={{ maxHeight: 200, objectFit: 'cover' }}
                          />
                        )}
                        {q.item_audio_path && (
                          <div className="mt-2">
                            <audio controls src={q.item_audio_path} style={{ width: '100%' }} />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="d-flex flex-column gap-2">
                      {q.choices.map((choice) => (
                        <label key={choice.choice_id} className="choice-item border p-2">
                          <input
                            type="radio"
                            name={`question_${q.item_id}`}
                            value={choice.choice_id}
                            checked={answers[q.item_id] === choice.choice_id}
                            onChange={() => handleChoose(q.item_id, choice.choice_id)}
                          />
                          <strong className="me-2">{choice.choice_label}.</strong>
                          {choice.choice_content}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="d-flex justify-content-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting || totalQuestions === 0}
                >
                  {submitting ? 'Đang nộp...' : 'Nộp kết quả'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonDetail;
