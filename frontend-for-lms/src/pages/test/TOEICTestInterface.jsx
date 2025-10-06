import React, { useState, useRef } from 'react';
import './css/test.css';
import f3Image from '../../assets/f3.png';

const TOEICTestInterface = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [currentTime, setCurrentTime] = useState('0:02');
  const [duration] = useState('0:02');
  const audioRef = useRef(null);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    // Audio logic here
  };

  const handleCheckAnswer = () => {
    const correctAnswer = 'playing';
    const isCorrect = userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
    
    setFeedback({
      isCorrect,
      message: isCorrect 
        ? 'Chính xác! The woman is playing a piano.'
        : 'Chưa đúng. Hãy nghe lại và quan sát hình ảnh.'
    });
  };

  const handleListenAgain = () => {
    // Reset audio and play again
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="test-container">
      {/* Navigation Header */}
      <div className="test-nav-header">
        <h1 className="test-nav-title">[DAY 1] PART 1 TRANH MỘT NGƯỜI</h1>
        <div className="test-nav-controls">
          <button className="test-nav-btn prev" disabled>
            ← CÂU TRƯỚC
          </button>
          <button className="test-nav-btn next">
            CÂU TIẾP →
          </button>
          <div className="test-counter">1/30</div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="test-main-layout">
        {/* Left Panel - Question Content */}
        <div className="test-question-panel">
          <div className="question-content">
            {/* Question Type */}
            <div className="question-type">Listen & Fill</div>

            {/* Audio Player */}
            <div className="audio-player-container">
              <div className="custom-audio-player">
                <div className="audio-controls">
                  <button 
                    className="audio-play-btn"
                    onClick={handlePlayAudio}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <span className="audio-time">{currentTime} / {duration}</span>
                  <div className="audio-progress">
                    <div 
                      className="audio-progress-bar" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  <div className="audio-volume">
                    <button className="volume-btn">🔊</button>
                    <button className="volume-btn">⋯</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Image */}
            <div className="question-image">
              <img 
                src={f3Image} 
                alt="Woman playing piano" 
                style={{ maxWidth: '400px', height: 'auto' }}
              />
            </div>

            {/* Fill in the Blank */}
            <div className="fill-blank-container">
              <div className="fill-blank-text">
                The woman is{' '}
                <input
                  type="text"
                  className={`fill-blank-input ${feedback?.isCorrect ? 'correct' : feedback ? 'incorrect' : ''}`}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="..."
                />
                {' '}a piano.
              </div>
              
              {feedback && (
                <div className={`feedback-message ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                  {feedback.message}
                </div>
              )}
            </div>

            {/* Helper Tags */}
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

          {/* Action Buttons */}
          <div className="question-actions">
            <button 
              className="action-btn check"
              onClick={handleCheckAnswer}
            >
              Kiểm tra
            </button>
            <button 
              className="action-btn listen"
              onClick={handleListenAgain}
            >
              Nghe lại
            </button>
            <button className="action-btn next">
              Câu tiếp
            </button>
          </div>
        </div>

        {/* Right Panel - Help Section */}
        <div className="test-help-panel">
          <div className="help-section">
            <div className="help-title">Pronunciation:</div>
            <div className="help-content">
              <div className="pronunciation-text">
                /ˈpleɪɪŋ/ - playing
              </div>
            </div>
          </div>

          <div className="help-section">
            <div className="help-title">Dịch nghĩa:</div>
            <div className="help-content">
              <div className="translation-text">
                The woman is <strong>playing</strong> a piano.<br />
                <em>Người phụ nữ đang chơi piano.</em>
              </div>
            </div>
          </div>

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

      {/* Hidden audio element for actual playback */}
      <audio ref={audioRef} preload="auto">
        <source src="/path/to/audio.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default TOEICTestInterface;