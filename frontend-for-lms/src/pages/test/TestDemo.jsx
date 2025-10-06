import React, { useState, useRef } from 'react';
import './css/test.css';
import f3Image from '../../assets/f3.png';

/**
 * TestDemo Component - TOEIC Fill-in-Blank Demo Interface
 * Mục đích: Tạo giao diện demo cho bài test TOEIC với chức năng điền từ vào chỗ trống
 * Route: /test-demo
 */
const TestDemo = () => {
  // === AUDIO STATE ===
  // Trạng thái phát audio (true = đang phát, false = dừng)
  const [isPlaying, setIsPlaying] = useState(false);
  // Trạng thái nghe lại (để hiển thị "Đang phát..." button)
  const [isListening, setIsListening] = useState(false);
  
  // === QUESTION STATE ===
  // Câu trả lời của user (pre-filled với 'playing' để demo)
  const [userAnswer, setUserAnswer] = useState('playing');
  // Feedback sau khi check đáp án: {isCorrect: boolean, message: string}
  const [feedback, setFeedback] = useState(null);
  
  // === NAVIGATION STATE ===
  // Câu hỏi hiện tại (1-based indexing)
  const [currentQuestion, setCurrentQuestion] = useState(1);
  // Tổng số câu hỏi (cố định 30 cho demo)
  const [totalQuestions] = useState(30);
  
  // === REF ===
  // Reference tới audio element (để control playback)
  const audioRef = useRef(null);

  // === AUDIO HANDLERS ===
  /**
   * Xử lý play/pause audio
   * Logic: Toggle trạng thái phát, simulate audio playback 2 giây
   */
  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Simulate audio playback duration: 2 seconds
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
    }
  };

  /**
   * Xử lý nghe lại audio
   * Logic: Set cả isListening và isPlaying, tự động tắt sau 2 giây
   * Hiển thị "Đang phát..." trong lúc chờ
   */
  const handleListenAgain = () => {
    setIsListening(true);
    setIsPlaying(true);
    
    // Simulate audio replay duration: 2 seconds
    setTimeout(() => {
      setIsListening(false);
      setIsPlaying(false);
    }, 2000);
  };

  // === ANSWER VALIDATION ===
  /**
   * Kiểm tra đáp án của user
   * Logic: So sánh với đáp án đúng 'playing' (case-insensitive)
   * Set feedback với kết quả và message tương ứng
   */
  const handleCheckAnswer = () => {
    const correctAnswer = 'playing'; // Đáp án chuẩn
    const isCorrect = userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
    
    setFeedback({
      isCorrect,
      message: isCorrect 
        ? 'Chính xác! The woman is playing a piano.'
        : 'Chưa đúng. Hãy nghe lại và quan sát hình ảnh.'
    });
  };

  // === NAVIGATION HANDLERS ===  
  /**
   * Chuyển về câu hỏi trước
   * Logic: Chỉ cho phép nếu không phải câu đầu tiên (currentQuestion > 1)
   * Reset toàn bộ state của câu hỏi khi chuyển
   */
  const handlePrevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
      resetQuestion();
    }
  };

  /**
   * Chuyển tới câu hỏi tiếp theo  
   * Logic: Chỉ cho phép nếu chưa phải câu cuối (currentQuestion < totalQuestions)
   * Reset toàn bộ state của câu hỏi khi chuyển
   */
  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
      resetQuestion();
    }
  };

  /**
   * Reset toàn bộ state của câu hỏi
   * Được gọi khi: chuyển câu hỏi (prev/next)
   * Logic: Clear user answer, feedback, và audio states
   */
  const resetQuestion = () => {
    setUserAnswer('');       // Clear input
    setFeedback(null);       // Clear feedback message
    setIsPlaying(false);     // Stop audio
    setIsListening(false);   // Reset listening state
  };

  // === INPUT HANDLERS ===
  /**
   * Xử lý thay đổi input của user
   * Logic: Update userAnswer và clear feedback nếu đang hiển thị
   * (Cho phép user thử lại sau khi nhận feedback)
   */
  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
    // Reset feedback khi user thay đổi answer để thử lại
    if (feedback) {
      setFeedback(null);
    }
  };

  // === RENDER ===
  return (
    <div style={{ 
      margin: 0, 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* === NAVIGATION HEADER === */}
      {/* Hiển thị tiêu đề bài test và điều khiển chuyển câu */}
      <div className="test-nav-header">
        <h1 className="test-nav-title">[DAY 1] PART 1 TRANH MỘT NGƯỜI</h1>
        <div className="test-nav-controls">
          {/* Button CÂU TRƯỚC - disabled nếu đang ở câu đầu tiên */}
          <button 
            className={`test-nav-btn prev ${currentQuestion === 1 ? 'disabled' : ''}`}
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 1}
          >
            ← CÂU TRƯỚC
          </button>
          
          {/* Button CÂU TIẾP - disabled nếu đang ở câu cuối */}
          <button 
            className={`test-nav-btn next ${currentQuestion === totalQuestions ? 'disabled' : ''}`}
            onClick={handleNextQuestion}
            disabled={currentQuestion === totalQuestions}
          >
            CÂU TIẾP →
          </button>
          
          {/* Counter hiển thị vị trí câu hỏi hiện tại */}
          <div className="test-counter">{currentQuestion}/{totalQuestions}</div>
        </div>
      </div>

      {/* === MAIN LAYOUT (2 COLUMNS) === */}
      <div className="test-main-layout">
        {/* === LEFT PANEL - QUESTION CONTENT === */}
        <div className="test-question-panel">
          <div className="question-content">
            {/* Loại câu hỏi: Listen & Fill */}
            <div className="question-type">Listen & Fill</div>

            {/* === AUDIO PLAYER === */}
            {/* Custom audio player với play/pause, progress bar, volume */}
            <div className="audio-player-container">
              <div className="custom-audio-player">
                <div className="audio-controls">
                  {/* Play/Pause Button - disabled khi đang listen again */}
                  <button 
                    className="audio-play-btn"
                    onClick={handlePlayAudio}
                    disabled={isListening}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  
                  {/* Audio duration display (fixed 0:02 for demo) */}
                  <span className="audio-time">0:02 / 0:02</span>
                  
                  {/* Progress bar - animated width based on isPlaying state */}
                  <div className="audio-progress">
                    <div 
                      className="audio-progress-bar" 
                      style={{ 
                        width: isPlaying ? '100%' : '0%',   // Full width when playing
                        transition: 'width 2s linear'      // Smooth 2s animation
                      }}
                    />
                  </div>
                  
                  {/* Volume controls (decorative) */}
                  <div className="audio-volume">
                    <button className="volume-btn">🔊</button>
                    <button className="volume-btn">⋯</button>
                  </div>
                </div>
              </div>
            </div>

            {/* === QUESTION IMAGE === */}
            {/* Hình ảnh minh họa cho câu hỏi: Woman playing piano */}
            <div className="question-image">
              <img 
                src={f3Image} 
                alt="Woman playing piano" 
                style={{ maxWidth: '400px', height: 'auto' }}
              />
            </div>

            {/* === FILL IN THE BLANK === */}
            {/* Câu hỏi điền từ vào chỗ trống với input field */}
            <div className="fill-blank-container">
              <div className="fill-blank-text">
                The woman is{' '}
                {/* Input field với dynamic styling based on feedback */}
                <input 
                  type="text" 
                  className={`fill-blank-input ${
                    feedback?.isCorrect ? 'correct' :           // Green border if correct
                    feedback && !feedback.isCorrect ? 'incorrect' : ''  // Red border if incorrect
                  }`}
                  placeholder="..."
                  value={userAnswer}
                  onChange={handleInputChange}
                />
                {' '}a piano.
              </div>
              
              {/* Conditional feedback message - chỉ hiển thị khi có feedback */}
              {feedback && (
                <div 
                  className={`feedback-message ${feedback.isCorrect ? 'correct' : 'incorrect'}`}
                  style={{ display: 'block' }}
                >
                  {feedback.message}
                </div>
              )}
            </div>

            {/* === HELPER TAGS === */}
            {/* Các gợi ý và hướng dẫn cho user */}
            <div className="helper-tags">
              <span className="helper-tag hint">
                Phức: Qua ở trống → Kiếm tra → Câu mới
              </span>
              <span className="helper-tag pronunciation">
                Cần: Điều khiển âm thanh
              </span>
              <span className="helper-tag">
                Lưu ý: Nếu sai, kiểm tra bộ gõ tiếng Việt
              </span>
            </div>
          </div>

          {/* === ACTION BUTTONS === */}
          {/* Các button chính để tương tác với bài test */}
          <div className="question-actions">
            {/* Button KIỂM TRA - disabled nếu input trống */}
            <button 
              className="action-btn check"
              onClick={handleCheckAnswer}
              disabled={!userAnswer.trim()}  // Disable if input is empty/whitespace
            >
              Kiểm tra
            </button>
            
            {/* Button NGHE LẠI - disabled khi đang phát audio */}
            <button 
              className="action-btn listen"
              onClick={handleListenAgain}
              disabled={isPlaying}  // Disable during audio playback
            >
              {isListening ? 'Đang phát...' : 'Nghe lại'}  {/* Dynamic text */}
            </button>
            
            {/* Button CÂU TIẾP - disabled nếu đang ở câu cuối */}
            <button 
              className="action-btn next"
              onClick={handleNextQuestion}
              disabled={currentQuestion === totalQuestions}  // Disable at last question
            >
              Câu tiếp
            </button>
          </div>
        </div>

        {/* === RIGHT PANEL - HELP SECTION === */}
        {/* Panel bên phải chứa các thông tin hỗ trợ học tập */}
        <div className="test-help-panel">
          
          {/* === PRONUNCIATION SECTION === */}
          {/* Hướng dẫn phát âm từ khóa */}
          <div className="help-section">
            <div className="help-title">Pronunciation:</div>
            <div className="help-content">
              <div className="pronunciation-text">
                /ˈpleɪɪŋ/ - playing  {/* IPA notation for correct pronunciation */}
              </div>
            </div>
          </div>

          {/* === TRANSLATION SECTION === */}
          {/* Dịch nghĩa câu và từ khóa */}
          <div className="help-section">
            <div className="help-title">Dịch nghĩa:</div>
            <div className="help-content">
              <div className="translation-text">
                The woman is <strong>playing</strong> a piano.<br />
                <em>Người phụ nữ đang chơi piano.</em>  {/* Vietnamese translation */}
              </div>
            </div>
          </div>

          {/* === STUDY NOTES SECTION === */}
          {/* Ghi chú và tips học tập */}
          <div className="help-section">
            <div className="help-title">Ghi chú:</div>
            <div className="help-content">
              • Nghe kỹ động từ trong câu<br />
              • Chú ý thì hiện tại tiếp diễn<br />
              • Quan sát hành động trong hình
            </div>
          </div>
        </div>
      </div>

      {/* === HIDDEN AUDIO ELEMENT === */}
      {/* Audio element thực tế để phát file âm thanh (hidden) */}
      <audio ref={audioRef} preload="auto">
        <source src="/path/to/audio.mp3" type="audio/mpeg" />
        Trình duyệt của bạn không hỗ trợ phát audio.
      </audio>
    </div>
  );
};

export default TestDemo;

/**
 * === COMPONENT SUMMARY ===
 * 
 * TestDemo Component - Interactive TOEIC Fill-in-Blank Demo Interface
 * 
 * KEY FEATURES:
 * 1. Audio Player: Play/pause with animated progress bar
 * 2. Fill-in-Blank: Input field with real-time validation
 * 3. Navigation: Previous/Next question with counter (1/30)
 * 4. Feedback System: Instant validation with correct/incorrect messages
 * 5. Help Panel: Pronunciation, translation, and study notes
 * 
 * MAIN LOGIC FLOW:
 * 1. User clicks play audio → Audio simulates 2s playback
 * 2. User types answer in input field → Real-time state update
 * 3. User clicks "Kiểm tra" → Validates against "playing"
 * 4. System shows feedback → Green/red styling + message
 * 5. User can navigate questions → Resets all states
 * 
 * STATE MANAGEMENT:
 * - Audio: isPlaying, isListening
 * - Question: userAnswer, feedback
 * - Navigation: currentQuestion, totalQuestions
 * 
 * ROUTES:
 * - Access via: /test-demo
 * - Called from: /test (landing page)
 */