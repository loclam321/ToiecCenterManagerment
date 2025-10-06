import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTestMeta, fetchTestQuestions, submitTest } from '../../services/testService';
import { getCurrentUser } from '../../services/authService';
import './css/test.css';
import heroImg from '../../assets/english-education.jpg';

// Data will be loaded from API
const DEMO_META = {
  test_id: 0,
  test_name: 'Làm thử - Kiểm tra đầu vào TOEIC',
  test_description: 'Chế độ thử nghiệm giúp bạn trải nghiệm giao diện bài kiểm tra.',
  test_duration: 5,
  test_total_score: 5,
  test_passing_score: 3,
  skill_name: 'General TOEIC',
};

const DEMO_QUESTIONS = [
  {
    order: 1,
    qs_index: 10001,
    qs_desciption: 'Chọn đáp án đúng: The meeting ______ at 9 AM tomorrow.',
    answers: [
      { as_index: 11001, as_content: 'will start' },
      { as_index: 11002, as_content: 'start' },
      { as_index: 11003, as_content: 'started' },
      { as_index: 11004, as_content: 'has started' },
    ],
  },
  {
    order: 2,
    qs_index: 10002,
    qs_desciption: 'Which option best describes the speaker’s intention?',
    answers: [
      { as_index: 12001, as_content: 'Requesting a report' },
      { as_index: 12002, as_content: 'Confirming an appointment' },
      { as_index: 12003, as_content: 'Making a complaint' },
      { as_index: 12004, as_content: 'Giving directions' },
    ],
  },
  {
    order: 3,
    qs_index: 10003,
    qs_desciption: 'Find the correct synonym: "purchase" = ?',
    answers: [
      { as_index: 13001, as_content: 'buy' },
      { as_index: 13002, as_content: 'sell' },
      { as_index: 13003, as_content: 'rent' },
      { as_index: 13004, as_content: 'lend' },
    ],
  },
  {
    order: 4,
    qs_index: 10004,
    qs_desciption: 'Fill in the blank: He ______ the report by Friday.',
    answers: [
      { as_index: 14001, as_content: 'will finish' },
      { as_index: 14002, as_content: 'finishes' },
      { as_index: 14003, as_content: 'finished' },
      { as_index: 14004, as_content: 'has finishing' },
    ],
  },
  {
    order: 5,
    qs_index: 10005,
    qs_desciption: 'Choose the correct preposition: She is responsible ___ the budget.',
    answers: [
      { as_index: 15001, as_content: 'for' },
      { as_index: 15002, as_content: 'to' },
      { as_index: 15003, as_content: 'with' },
      { as_index: 15004, as_content: 'on' },
    ],
  },
];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TestPage() {
  const navigate = useNavigate();
  const { testId: testIdParam } = useParams();
  const parsedId = Number(testIdParam);
  const isLanding = typeof testIdParam === 'undefined';
  const testId = isLanding ? null : parsedId;
  const [testMeta, setTestMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // { [qs_index]: as_index }
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const totalQuestions = questions.length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (isLanding) {
          if (!cancelled) setLoading(false);
          return;
        }
        
        const [meta, qs] = await Promise.all([
          fetchTestMeta(testId),
          fetchTestQuestions(testId),
        ]);
        if (cancelled) return;
        setTestMeta(meta);
        const normalized = (qs || [])
          .map((q, idx) => ({
            order: q.question_order || q.order || idx + 1,
            qs_index: q.qs_index,
            qs_desciption: q.qs_desciption,
            answers: (q.answers || []).map((a) => ({
              as_index: a.as_index,
              as_content: a.as_content,
            })),
          }))
          .sort((a, b) => a.order - b.order);
        setQuestions(normalized);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId, isLanding]);

  const progressPercent = useMemo(() => {
    const answered = Object.keys(responses).length;
    if (totalQuestions === 0) return 0;
    return Math.round((answered / totalQuestions) * 100);
  }, [responses, totalQuestions]);

  useEffect(() => {
    if (!started) return;
    setRemainingSeconds((testMeta?.test_duration || 0) * 60);
  }, [started, testMeta?.test_duration]);

  useEffect(() => {
    if (!started || submitted) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submitted]);

  function handleSelectAnswer(qsIndex, asIndex) {
    setResponses((prev) => ({ ...prev, [qsIndex]: asIndex }));
  }

  function handlePrev() {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));
  }

  function handleSubmit() {
    if (submitted) return;
    
    const user = getCurrentUser();
    const payload = {
      user_id: user?.user_id || null,
      class_id: user?.class_id || null,
      responses: Object.entries(responses).map(([qs_index, as_index]) => ({
        qs_index: Number(qs_index),
        as_index,
      })),
    };
    submitTest(testId, payload)
      .then((data) => {
        setResult({
          sc_score: data?.sc_score ?? 0,
          passed: data?.passed ?? false,
          breakdown: data?.breakdown || [],
        });
        setSubmitted(true);
      })
      .catch(() => {
        const score = Object.keys(responses).length;
        const passed = score >= (testMeta?.test_passing_score || 0);
        setResult({ sc_score: score, passed });
        setSubmitted(true);
      });
  }

  return (
    <div className="test-container">
      {isLanding && (
        <section className="test-hero" aria-label="Landing kiểm tra đầu vào">
          <div className="test-hero-media" aria-hidden="true">
            <img src={heroImg} alt="English study background" />
            <div className="test-hero-overlay" />
          </div>
          <div className="test-hero-content">
            <h1 className="test-hero-title">Bài kiểm tra tiếng Anh chuẩn quốc tế miễn phí</h1>
            <p className="test-hero-desc">Theo sát hành trình học của bạn với bài kiểm tra năng lực trực tuyến — phù hợp từ nền tảng đến luyện thi TOEIC/IELTS. Làm nhanh tại nhà, kết quả tức thì.</p>
            <p className="test-hero-note"><em>*Bài kiểm tra chỉ mang tính tham khảo, không thay thế đánh giá trình độ đầu vào với giáo viên tại trung tâm.</em></p>
            <div className="test-hero-actions">
              <button className="btn-primary" onClick={() => navigate('/test-demo')}>Tiếp theo</button>
            </div>
          </div>
        </section>
      )}
      {loading && (
        <div className="loading">Đang tải bài kiểm tra...</div>
      )}
      {error && (
        <div className="error">{error}</div>
      )}

      {!isLanding && !loading && !error && !started && !submitted && testMeta && (
        <section className="test-intro">
          <h1 className="test-title">{testMeta.test_name}</h1>
          <p className="test-desc">{testMeta.test_description}</p>
          <div className="test-meta">
            <div>Thời lượng: <strong>{testMeta.test_duration} phút</strong></div>
            <div>Kỹ năng: <strong>{testMeta.skill_name}</strong></div>
            <div>Điểm đạt: <strong>{testMeta.test_passing_score}/{testMeta.test_total_score}</strong></div>
          </div>
          <button
            className="btn-primary"
            onClick={() => setStarted(true)}
            disabled={isDemo ? false : (() => {
              const now = new Date();
              const st = testMeta?.test_starttime ? new Date(testMeta.test_starttime) : null;
              const et = testMeta?.test_endtime ? new Date(testMeta.test_endtime) : null;
              if (st && now < st) return true;
              if (et && now > et) return true;
              return false;
            })()}
            aria-disabled={isDemo ? false : (() => {
              const now = new Date();
              const st = testMeta?.test_starttime ? new Date(testMeta.test_starttime) : null;
              const et = testMeta?.test_endtime ? new Date(testMeta.test_endtime) : null;
              if (st && now < st) return true;
              if (et && now > et) return true;
              return false;
            })()}
          >
            Bắt đầu
          </button>
        </section>
      )}

      {!isLanding && started && !submitted && !loading && !error && (
        <section className="test-exam">
          <header className="test-header">
            <div className="test-name">{testMeta.test_name}</div>
            <div className="test-timer" aria-live="polite">{formatTime(remainingSeconds)}</div>
          </header>

          <div className="test-progress">
            <div className="test-progress-bar" style={{ width: `${progressPercent}%` }} />
            <div className="test-progress-text">Câu {currentIndex + 1}/{totalQuestions}</div>
          </div>

          {questions.length > 0 && (
            <div className="question-card">
              <div className="question-title">{questions[currentIndex].qs_desciption}</div>
              <div className="answers" role="radiogroup" aria-label="Lựa chọn đáp án">
                {questions[currentIndex].answers.map((a) => (
                  <label key={a.as_index} className={`answer-item ${responses[questions[currentIndex].qs_index] === a.as_index ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`q-${questions[currentIndex].qs_index}`}
                      value={a.as_index}
                      checked={responses[questions[currentIndex].qs_index] === a.as_index}
                      onChange={() => handleSelectAnswer(questions[currentIndex].qs_index, a.as_index)}
                    />
                    <span className="answer-text">{a.as_content}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="nav-actions">
            <button className="btn-secondary" onClick={handlePrev} disabled={currentIndex === 0}>Trước</button>
            <button className="btn-secondary" onClick={handleNext} disabled={currentIndex === totalQuestions - 1}>Sau</button>
            <button className="btn-primary btn-submit" onClick={handleSubmit}>Nộp bài</button>
          </div>
        </section>
      )}

      {submitted && (
        <section className="test-result">
          <h2>Kết quả</h2>
          <div className="result-summary">
            <div>Điểm: <strong>{result?.sc_score}</strong> / {testMeta.test_total_score}</div>
            <div>Trạng thái: <strong className={result?.passed ? 'text-pass' : 'text-fail'}>{result?.passed ? 'Đạt' : 'Chưa đạt'}</strong></div>
          </div>
        </section>
      )}
    </div>
  );
}


