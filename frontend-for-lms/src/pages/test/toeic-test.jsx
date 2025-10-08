import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import './css/toeic-test.css';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ToeicTestPage() {
  const navigate = useNavigate();
  const { testId: testIdParam } = useParams();
  const parsedId = Number(testIdParam);
  const testId = Number.isNaN(parsedId) ? null : parsedId;
  
  const [testMeta, setTestMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // { [item_id]: choice_id }
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!testId) {
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
            item_id: q.qs_index,
            question_text: q.qs_desciption,
            stimulus_text: q.item_stimulus_text,
            image_path: q.item_image_path,
            audio_path: q.item_audio_path,
            item_type: q.item_type || 'MULTIPLE_CHOICE',
            pronunciation: q.pronunciation,
            translation: q.translation,
            answers: (q.answers || []).map((a) => ({
              choice_id: a.as_index,
              choice_content: a.as_content,
              choice_label: a.choice_label || String.fromCharCode(65 + (a.as_index % 4)) // A, B, C, D
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
  }, [testId]);

  const progressPercent = useMemo(() => {
    const answered = Object.keys(responses).length;
    if (totalQuestions === 0) return 0;
    return Math.round((answered / totalQuestions) * 100);
  }, [responses, totalQuestions]);

  useEffect(() => {
    if (!started) return;
    setRemainingSeconds((testMeta?.test_duration || 30) * 60);
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
  }, [started, submitted]);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setAudioCurrentTime(0);
  };

  function handleSelectAnswer(itemId, choiceId) {
    setResponses((prev) => ({ ...prev, [itemId]: choiceId }));
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
      responses: Object.entries(responses).map(([item_id, choice_id]) => ({
        qs_index: Number(item_id),
        as_index: choice_id,
      })),
    };
    
    submitTest(testId, payload)
      .then((data) => {
        setResult({
          sc_score: data?.sc_score ?? 0,
          passed: data?.passed ?? false,
          breakdown: data?.breakdown || {},
        });
        setSubmitted(true);
      })
      .catch(() => {
        // Fallback scoring
        const score = Object.keys(responses).length;
        const passed = score >= (testMeta?.test_passing_score || 0);
        setResult({ sc_score: score, passed });
        setSubmitted(true);
      });
  }

  if (loading) {
    return (
      <div className="toeic-test-container">
        <div className="loading">Đang tải bài kiểm tra...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="toeic-test-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!started && !submitted && testMeta) {
    return (
      <div className="toeic-test-container">
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
          >
            Bắt đầu
          </button>
        </section>
      </div>
    );
  }

  if (started && !submitted) {
    return (
      <div className="toeic-test-container">
        <header className="toeic-header">
          <div className="toeic-brand">
            <div className="brand-logo">
              <div className="logo-icon">🎯</div>
              <div className="brand-text">
                <div className="brand-title">TOEIC Mentors</div>
                <div className="brand-subtitle">Online Testing System</div>
              </div>
            </div>
          </div>
          
          <nav className="toeic-nav">
            <div className="nav-item">
              <span className="nav-icon">📚</span>
              <span>Luyện tập</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon">🎯</span>
              <span>Lộ trình 600+</span>
            </div>
            <div className="nav-item active">
              <span className="nav-icon">🏠</span>
              <span>Thi thử</span>
            </div>
          </nav>

          <div className="header-actions">
            <button className="btn-study">Vào học</button>
            <div className="user-info">
              <span className="user-level">BASIC</span>
              <div className="user-avatar">L</div>
            </div>
          </div>
        </header>

        <div className="test-content">
          <div className="test-header-info">
            <h2 className="test-section-title">{testMeta.test_name}</h2>
            <div className="test-navigation">
              <button 
                className="btn-nav btn-prev" 
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                ← CÂU TRƯỚC
              </button>
              <button 
                className="btn-nav btn-next" 
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1}
              >
                CÂU TIẾP →
              </button>
            </div>
            <div className="question-counter">
              {currentIndex + 1}/{totalQuestions}
            </div>
          </div>

          {currentQuestion && (
            <div className="question-container">
              <div className="question-content">
                <div className="question-main">
                  {currentQuestion.item_type === 'LISTENING' && (
                    <div className="audio-section">
                      <h3>Listen & Fill</h3>
                      <div className="audio-player">
                        <button 
                          className="audio-play-btn"
                          onClick={handlePlayAudio}
                        >
                          {audioPlaying ? '⏸️' : '▶️'}
                        </button>
                        <div className="audio-time">
                          {formatTime(Math.floor(audioCurrentTime))} / {formatTime(Math.floor(audioDuration))}
                        </div>
                        <div className="audio-progress">
                          <div 
                            className="audio-progress-bar"
                            style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                          />
                        </div>
                        <button className="audio-volume">🔊</button>
                        <button className="audio-menu">⋮</button>
                      </div>
                      
                      {currentQuestion.audio_path && (
                        <audio
                          ref={audioRef}
                          src={currentQuestion.audio_path}
                          onTimeUpdate={handleAudioTimeUpdate}
                          onLoadedMetadata={handleAudioLoadedMetadata}
                          onEnded={handleAudioEnded}
                        />
                      )}
                    </div>
                  )}

                  {currentQuestion.image_path && (
                    <div className="question-image">
                      <img 
                        src={currentQuestion.image_path} 
                        alt="Test question visual"
                        className="test-image"
                      />
                    </div>
                  )}

                  {currentQuestion.stimulus_text && (
                    <div className="question-stimulus">
                      <div className="stimulus-text">
                        {currentQuestion.stimulus_text.split('___').map((part, index, arr) => (
                          <span key={index}>
                            {part}
                            {index < arr.length - 1 && (
                              <span className="blank-space">_____</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="question-hints">
                    <span className="hint-label">Enter:</span>
                    <span className="hint-text">Qua ô trống → Kiểm tra → Câu mới</span>
                    <span className="hint-separator">|</span>
                    <span className="hint-label">Ctrl:</span>
                    <span className="hint-text">Điều khiển âm thanh</span>
                    <span className="hint-separator">|</span>
                    <span className="hint-note">Lưu ý: Nếu sai, kiểm tra bộ gõ tiếng Việt</span>
                  </div>
                </div>

                <div className="question-sidebar">
                  {currentQuestion.pronunciation && (
                    <div className="pronunciation-section">
                      <h4>Pronunciation:</h4>
                      <p>{currentQuestion.pronunciation}</p>
                    </div>
                  )}
                  
                  {currentQuestion.translation && (
                    <div className="translation-section">
                      <h4>Dịch nghĩa:</h4>
                      <p>{currentQuestion.translation}</p>
                    </div>
                  )}
                </div>
              </div>

              {currentQuestion.answers && currentQuestion.answers.length > 0 && (
                <div className="answers-section">
                  <div className="answers-grid">
                    {currentQuestion.answers.map((answer) => (
                      <label 
                        key={answer.choice_id} 
                        className={`answer-option ${
                          responses[currentQuestion.item_id] === answer.choice_id ? 'selected' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.item_id}`}
                          value={answer.choice_id}
                          checked={responses[currentQuestion.item_id] === answer.choice_id}
                          onChange={() => handleSelectAnswer(currentQuestion.item_id, answer.choice_id)}
                        />
                        <span className="answer-label">{answer.choice_label}</span>
                        <span className="answer-text">{answer.choice_content}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="question-actions">
                <button className="btn-action btn-check">Kiểm tra</button>
                <button className="btn-action btn-listen">Nghe lại</button>
                <button className="btn-action btn-next-q">Câu tiếp</button>
              </div>
            </div>
          )}
        </div>

        <div className="test-footer">
          <div className="test-progress">
            <div className="progress-text">
              Tiến độ: {Object.keys(responses).length}/{totalQuestions} câu
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          <div className="test-timer">
            Thời gian còn lại: {formatTime(remainingSeconds)}
          </div>
          
          <button className="btn-submit" onClick={handleSubmit}>
            Nộp bài
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="toeic-test-container">
        <section className="test-result">
          <h2>Kết quả bài kiểm tra</h2>
          <div className="result-summary">
            <div className="result-score">
              Điểm: <strong>{result?.sc_score}</strong> / {testMeta.test_total_score}
            </div>
            <div className={`result-status ${result?.passed ? 'passed' : 'failed'}`}>
              {result?.passed ? '✅ Đạt' : '❌ Chưa đạt'}
            </div>
            {result?.breakdown && (
              <div className="result-breakdown">
                <div>Đúng: {result.breakdown.correct}/{result.breakdown.total}</div>
                <div>Tỷ lệ: {result.breakdown.percentage}%</div>
              </div>
            )}
          </div>
          <div className="result-actions">
            <button onClick={() => navigate('/tests')} className="btn-secondary">
              Quay lại danh sách
            </button>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Làm lại
            </button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}