// trước đây có thể đang là: import React from 'react';
import React, { useEffect } from 'react';

import './css/facility.css';
import heroImg from '../../assets/f4.png';
import heroImg2 from '../../assets/f3.png';
import heroImg3 from '../../assets/f5.png';
import heroImg4 from '../../assets/f2.png';
import heroVideo from '../../assets/video/f1.mp4';
import heroImg5 from '../../assets/f7.png';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import AOS from 'aos';
import 'aos/dist/aos.css';

function FacilityPage() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <div className="facility-page">
      {/* Hero Section */}
      <section className="facility-hero" aria-label="Cơ sở vật chất">
        <video className="facility-hero-video" autoPlay muted loop playsInline>
          <source src={heroVideo} type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
        <div className="facility-hero-overlay" />
        <div className="facility-hero-content" data-aos="fade-up">
          <h1 className="facility-hero-title">Cơ sở vật chất tại trung tâm</h1>
          <button className="facility-hero-cta" type="button">Xem video</button>
        </div>
      </section>

      {/* Intro Section */}
      <section className="facility-section facility-intro">
        <div className="facility-intro-container">
          <div className="facility-intro-text-panel" style={{ backgroundImage: `url(${heroImg5})` }} data-aos="fade-right">
            <h2>Phong cách thiết kế</h2>
            <p>
              Nhằm nâng cao tối đa trải nghiệm học tập cho học sinh, trung tâm sử dụng ngôn ngữ thiết kế tối giản,
              hiện đại với tông màu ấm kết hợp các điểm nhấn tươi sáng...
            </p>
            <button className="facility-cta" type="button">Kiểm tra trình độ miễn phí</button>
          </div>

          {/* Swiper Gallery */}
          <div className="facility-intro-gallery" data-aos="zoom-in">
            <Swiper
              modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
              effect="coverflow"
              grabCursor
              centeredSlides
              loop
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              slidesPerView="auto"
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 120,
                modifier: 1,
                slideShadows: false,
              }}
              pagination={{ clickable: true }}
              navigation
              className="mySwiper"
            >
              <SwiperSlide><img src={heroImg4} alt="Cơ sở vật chất 1" /></SwiperSlide>
              <SwiperSlide><img src={heroImg2} alt="Cơ sở vật chất 2" /></SwiperSlide>
              <SwiperSlide><img src={heroImg3} alt="Cơ sở vật chất 3" /></SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="facility-section facility-equipment">
        <div className="facility-equipment-media" style={{ backgroundImage: `url(${heroImg})` }} data-aos="fade-left" />
        <div className="facility-equipment-content" data-aos="fade-up">
          <h2>Trang thiết bị và nội thất</h2>
          <p>Màn hình tương tác 65 inch giúp học viên hiểu sâu và rõ bài học...</p>
        </div>
      </section>
    </div>
  );
}

export default FacilityPage;


