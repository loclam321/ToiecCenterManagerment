import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useParams } from 'react-router-dom';
import { fetchLearningPathsByCourse } from '../../services/courseService';
import './css/CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isYouTubeUrl = (url) => /youtu\.be|youtube\.com/.test(url || '');
  const toYouTubeEmbed = (url) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${u.pathname.replace('/', '')}`;
      }
      const vid = u.searchParams.get('v');
      return vid ? `https://www.youtube.com/embed/${vid}` : url;
    } catch (_) {
      return url;
    }
  };

  const safeParseJson = (text) => {
    if (!text) return null;
    try { return JSON.parse(text); } catch (_) { return null; }
  };

  const normalizeHighlights = (val) => {
    if (!val) return [];
    const parsed = Array.isArray(val) ? val : safeParseJson(val);
    return Array.isArray(parsed) ? parsed : [];
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchLearningPathsByCourse(courseId);
        setData(res);
      } catch (e) {
        setError(e.message || 'Không thể tải chi tiết khóa học');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const statusText = useMemo(() => {
    const raw = (data?.course?.course_status || data?.course?.status || '').toString().toUpperCase();
    return raw || 'N/A';
  }, [data]);

  const statusClass = useMemo(() => {
    const s = statusText;
    if (s === 'OPEN' || s === 'RUNNING' || s === 'ACTIVE') return 'status-open';
    if (s === 'CLOSED' || s === 'INACTIVE' || s === 'ARCHIVED') return 'status-closed';
    if (s === 'DRAFT') return 'status-draft';
    return 'status-default';
  }, [statusText]);

  const isValidMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    // Accept absolute http(s), root-relative, relative paths, blob and data URIs
    if (/^(https?:)?\/\//i.test(trimmed)) return true;
    if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) return true;
    if (/^(blob:|data:)/i.test(trimmed)) return true;
    return false;
  };

  const heroMedia = useMemo(() => {
    const empty = { banner: null, thumb: null };
    const lps = data?.learning_paths;
    if (!Array.isArray(lps) || !lps.length) return empty;

    // Prefer the first LP that has both valid banner and thumbnail
    for (const lp of lps) {
      const b = isValidMediaUrl(lp?.banner_url) ? lp.banner_url : null;
      const t = isValidMediaUrl(lp?.thumbnail_url) ? lp.thumbnail_url : null;
      if (b && t) {
        if (b === t) return { banner: b, thumb: null }; // de-duplicate identical URLs
        return { banner: b, thumb: t };
      }
    }
    // Fallback: first valid banner
    for (const lp of lps) {
      const b = isValidMediaUrl(lp?.banner_url) ? lp.banner_url : null;
      if (b) return { banner: b, thumb: null };
    }
    // Fallback: first valid thumbnail
    for (const lp of lps) {
      const t = isValidMediaUrl(lp?.thumbnail_url) ? lp.thumbnail_url : null;
      if (t) return { banner: null, thumb: t };
    }
    return empty;
  }, [data]);


  return (
    <div className="app-layout bg-light min-vh-100 d-flex flex-column course-detail-page">
      <Header />
      <main className="content bg-white border rounded p-0">
        <div className="container py-4 course-detail">
          {loading ? (
            <div className="loading-pane"><div className="spinner"></div><div>Đang tải...</div></div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : data ? (
            <>
              {(heroMedia.banner || heroMedia.thumb) ? (
                <div className={`lp-media lp-media--hero ${heroMedia.banner && heroMedia.thumb ? 'lp-media--split' : ''}`}>
                  {heroMedia.thumb ? (
                    <img className="lp-media-img" src={heroMedia.thumb} alt={`${data?.course?.course_name || 'Course'} thumbnail`} loading="eager" decoding="async" />
                  ) : null}
                  {heroMedia.banner ? (
                    <img className="lp-media-img" src={heroMedia.banner} alt={`${data?.course?.course_name || 'Course'} banner`} loading="eager" decoding="async" />
                  ) : null}
                </div>
              ) : null}
              <section className="course-hero">
                <div className="course-hero-content">
                  <h1 className="course-title">{data.course?.course_name}</h1>
                  <div className="course-subtitle">#{data.course?.course_id}</div>
                  <div className={`status-pill ${statusClass}`}>
                    {statusText}
                  </div>
                </div>
              </section>

              <table className="meta-table">
                <tbody>
                  {!!data.course?.course_code && (
                    <tr>
                      <th>Mã khóa</th>
                      <td>{data.course.course_code}</td>
                    </tr>
                  )}
                  {!!data.course?.level && (
                    <tr>
                      <th>Cấp độ</th>
                      <td>{data.course.level}</td>
                    </tr>
                  )}
                  {!!data.course?.mode && (
                    <tr>
                      <th>Hình thức</th>
                      <td>{data.course.mode}</td>
                    </tr>
                  )}
                  {!!data.course?.target_score && (
                    <tr>
                      <th>Mục tiêu điểm</th>
                      <td>{data.course.target_score}</td>
                    </tr>
                  )}
                  {!!data.course?.schedule_text && (
                    <tr>
                      <th>Lịch học</th>
                      <td>{data.course.schedule_text}</td>
                    </tr>
                  )}
                  {!!(data.course?.start_date || data.course?.end_date) && (
                    <tr>
                      <th>Thời gian</th>
                      <td>{data.course?.start_date || '—'} → {data.course?.end_date || '—'}</td>
                    </tr>
                  )}
                  {!!(data.course?.tuition_fee != null) && (
                    <tr>
                      <th>Học phí</th>
                      <td>{Number(data.course.tuition_fee).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="course-description">{data.course?.course_description || 'Chưa có mô tả'}</p>
              {data.learning_paths?.length ? (
                <div className="lp-grid">
                  {data.learning_paths.map((lp, idx) => {
                    const highlights = normalizeHighlights(lp.highlights_json);
                    const outline = safeParseJson(lp.program_outline_json);
                    const outlineStages = Array.isArray(outline?.stages) ? outline.stages : null;
                    const outlineMeta = outline && typeof outline.meta === 'object' ? outline.meta : null;
                    const isYoutube = isYouTubeUrl(lp.intro_video_url);
                    const embedUrl = isYoutube ? toYouTubeEmbed(lp.intro_video_url) : lp.intro_video_url;
                    return (
                      <div key={lp.lp_id || lp.course_id || idx} className="lp-card">
                        
                        {lp.lp_desciption ? (
                          <div className="lp-desc">{lp.lp_desciption}</div>
                        ) : null}
                        {lp.lp_summary ? (
                          <div className="lp-summary">
                            <div className="lp-section-title">Tổng quan</div>
                            <div>{lp.lp_summary}</div>
                          </div>
                        ) : null}
                        {Array.isArray(highlights) && highlights.length ? (
                          <div className="lp-highlights">
                            <div className="lp-section-title">Điểm nổi bật</div>
                            <ul>
                              {highlights.map((h, i) => {
                                const isObj = h && typeof h === 'object';
                                const title = isObj ? h.title : null;
                                const content = isObj ? h.content : null;
                                return (
                                  <li key={i}>
                                    {isObj ? (
                                      <>
                                        {title && <div className="fw-semibold">{title}</div>}
                                        {content && <div className="text-muted small">{content}</div>}
                                        {!title && !content && <span>{JSON.stringify(h)}</span>}
                                      </>
                                    ) : (
                                      <span>{typeof h === 'string' ? h : JSON.stringify(h)}</span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                        {outlineStages && outlineStages.length ? (
                          <div className="lp-outline">
                            <div className="lp-section-title">Chương trình học</div>
                            <div className="stages-grid">
                              {outlineStages.map((stage, si) => (
                                <div key={si} className="stage-card">
                                  <div className="stage-title">{stage.title || `Giai đoạn ${si + 1}`}</div>
                                  <div className="stage-meta">
                                    {stage.weeks != null && (<span className="chip">{stage.weeks} tuần</span>)}
                                    {stage.hours != null && (<span className="chip">{stage.hours} giờ</span>)}
                                  </div>
                                  {Array.isArray(stage.outcomes) && stage.outcomes.length ? (
                                    <div className="stage-outcomes">
                                      {stage.outcomes.map((oc, oi) => (
                                        <span key={oi} className="chip chip-soft">{oc}</span>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : Array.isArray(outline) && outline.length ? (
                          <div className="lp-outline">
                            <div className="lp-section-title">Chương trình học</div>
                            <ol>
                              {outline.map((o, i) => (
                                <li key={i}>{typeof o === 'string' ? o : (o.title || JSON.stringify(o))}</li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                        {outlineMeta ? (
                          <div className="lp-outline-meta">
                            {outlineMeta.goal_note && (
                              <div className="meta-item"><span className="muted">Mục tiêu:</span> {outlineMeta.goal_note}</div>
                            )}
                            {outlineMeta.designed_for && (
                              <div className="meta-item"><span className="muted">Thiết kế cho:</span> {outlineMeta.designed_for}</div>
                            )}
                          </div>
                        ) : null}
                        {embedUrl ? (
                          <section className="vr-section">
                            <div className="vr-grid">
                              <div className="vr-video">
                                {isYouTubeUrl(lp.intro_video_url) ? (
                                  <iframe
                                    src={embedUrl}
                                    title="Intro video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video src={embedUrl} controls />
                                )}
                              </div>
                              <form
                                className="vr-form"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                }}
                              >
                                <div className="vr-title">Đăng ký tư vấn khóa học</div>
                                <label className="vr-field">
                                  <span>Họ và tên *</span>
                                  <input type="text" name="fullName" required placeholder="Nguyễn Văn A" />
                                </label>
                                <label className="vr-field">
                                  <span>Số điện thoại *</span>
                                  <input type="tel" name="phone" required placeholder="09xxxxxxxx" />
                                </label>
                                <label className="vr-field">
                                  <span>Email</span>
                                  <input type="email" name="email" placeholder="email@domain.com" />
                                </label>
                                <label className="vr-field">
                                  <span>Khóa đăng ký</span>
                                  <input type="text" name="course" defaultValue={data.course?.course_name || ''} />
                                </label>
                                <button className="vr-submit" type="submit">Đăng ký</button>
                                <div className="vr-note">Bằng việc đăng ký, bạn đồng ý nhận tư vấn từ trung tâm.</div>
                              </form>
                            </div>
                          </section>
                        ) : null}
                        <div className="lp-meta-inline">
                          <span className="muted">Mã khóa:</span> {lp.course_id}
                          {lp.published_at && (
                            <>
                              <span className="sep">•</span>
                              <span className="muted">Phát hành:</span> {new Date(lp.published_at).toLocaleDateString('vi-VN')}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">Chưa có lộ trình cho khóa học này.</div>
              )}
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetail;


