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
      <section className="facility-hero" aria-label="Cơ sở vật chất">
        <video className="facility-hero-video" autoPlay muted loop playsInline>
          <source src={heroVideo} type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
        <div className="facility-hero-overlay" />
        <div className="facility-hero-content">
          <h1 className="facility-hero-title">Cơ sở vật chất tại trung tâm</h1>
          <button className="facility-hero-cta" type="button">Xem video</button>
        </div>
      </section>

      <section className="facility-section facility-intro">
        <div className="facility-intro-container">
          <div className="facility-intro-text-panel" style={{ backgroundImage: `url(${heroImg5})` }}>
            <h2>Phong cách thiết kế</h2>
            <p>
              Nhằm nâng cao tối đa trải nghiệm học tập cho học sinh, trung tâm sử dụng ngôn ngữ thiết kế tối giản,
              hiện đại với tông màu ấm kết hợp các điểm nhấn tươi sáng. Không gian mở, bàn ghế bo tròn an toàn,
              hỗ trợ các hoạt động nhóm và di chuyển linh hoạt.
            </p>
            <p>
              Hệ thống ánh sáng tối ưu cùng vật liệu tiêu âm giúp lớp học dễ chịu, tập trung và hiệu quả hơn.
            </p>
            <button className="facility-cta" type="button">Kiểm tra trình độ miễn phí</button>
          </div>
          <div className="facility-intro-gallery">
            <div className="facility-thumb" style={{ backgroundImage: `url(${heroImg4})` }} />
            <div className="facility-thumb" style={{ backgroundImage: `url(${heroImg2})` }} />
            <div className="facility-thumb" style={{ backgroundImage: `url(${heroImg3})` }} />
          </div>
        </div>
      </section>

      <section className="facility-section facility-equipment">
        <div className="facility-equipment-media" style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="facility-equipment-content">
          <h2>Trang thiết bị và nội thất</h2>
          <p>
            Màn hình tương tác 65 inch giúp học viên hiểu sâu và rõ bài học. Bảng viết 360° bao quanh phòng học hỗ trợ
            tối đa việc thể hiện ý tưởng. Hệ thống đèn và lấy sáng tự nhiên kết hợp vật liệu cách nhiệt, chống UV nhằm
            bảo vệ sức khỏe cho học sinh.
          </p>
          <p>
            Bàn ghế công thái học, bo tròn cạnh, dễ di chuyển, giúp các con thoải mái vận động và tham gia hoạt động nhóm.
          </p>
        </div>
      </section>
    </div>
  );
}

export default FacilityPage;


