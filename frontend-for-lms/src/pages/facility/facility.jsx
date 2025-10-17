// trước đây có thể đang là: import React from 'react';
import React from 'react';

import './css/facility.css';
import heroImg from '../../assets/f4.png';
import heroImg2 from '../../assets/f3.png';
import heroImg3 from '../../assets/f5.png';
import heroImg4 from '../../assets/f2.png';
import heroVideo from '../../assets/video/f1.mp4';
import heroImg5 from '../../assets/f7.png';

function FacilityPage() {
  return (
    <div className="facility-page">
      {/* Hero Section - Cinematic Video Background */}
      <section className="facility-hero" aria-label="Cơ sở vật chất hiện đại">
        <video 
          className="facility-hero-video" 
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video HTML5.
        </video>
        <div className="facility-hero-overlay" />
        <div 
          className="facility-hero-content"
        >
          <h1 className="facility-hero-title">Cơ sở vật chất tại trung tâm</h1>
          <button 
            className="facility-hero-cta" 
            type="button"
            aria-label="Xem video giới thiệu cơ sở vật chất"
          >
            Xem video
          </button>
        </div>
      </section>

      {/* Intro Section - Split Panel Design */}
      <section 
        className="facility-section facility-intro"
      >
        <div className="facility-intro-container">
          {/* Text Panel with Gradient Overlay */}
          <div 
            className="facility-intro-text-panel" 
            style={{ backgroundImage: `url(${heroImg5})` }}
          >
            <h2>Phong cách thiết kế</h2>
            <p>
              Nhằm nâng cao tối đa trải nghiệm học tập cho học sinh, trung tâm sử dụng ngôn ngữ thiết kế tối giản,
              hiện đại với tông màu ấm kết hợp các điểm nhấn tươi sáng. Mỗi không gian học tập được thiết kế với 
              sự chú trọng đến ánh sáng tự nhiên, màu sắc hài hòa và bố cục khoa học.
            </p>
            <button 
              className="facility-cta" 
              type="button"
              aria-label="Kiểm tra trình độ tiếng Anh miễn phí"
            >
              Kiểm tra trình độ miễn phí
            </button>
          </div>

          {/* Simple Gallery */}
          <div 
            className="facility-intro-gallery"
          >
            <div className="facility-gallery-grid">
              <img
                src={heroImg4}
                alt="Cơ sở vật chất 1"
                className="facility-gallery-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets1/f2.png';
                }}
              />
              <img
                src={heroImg2}
                alt="Cơ sở vật chất 2"
                className="facility-gallery-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets1/f3.png';
                }}
              />
              <img
                src={heroImg3}
                alt="Cơ sở vật chất 3"
                className="facility-gallery-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets1/f5.png';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Section - Image + Content Grid */}
      <section 
        className="facility-section facility-equipment"
      >
        <div 
          className="facility-equipment-media" 
          style={{ backgroundImage: `url(${heroImg})` }}
          role="img"
          aria-label="Trang thiết bị học tập hiện đại"
        />
        <div 
          className="facility-equipment-content"
        >
          <h2>Trang thiết bị và nội thất</h2>
          <p>
            Màn hình tương tác 65 inch giúp học viên hiểu sâu và rõ bài học thông qua hình ảnh, video chất lượng cao. 
            Hệ thống âm thanh vòm tạo môi trường học tập sống động. Bàn ghế ergonomic đảm bảo tư thế ngồi thoải mái 
            trong suốt buổi học. Hệ thống điều hòa thông minh duy trì nhiệt độ lý tưởng cho việc tiếp thu kiến thức.
          </p>
        </div>
      </section>
    </div>
  );
}

export default FacilityPage;


