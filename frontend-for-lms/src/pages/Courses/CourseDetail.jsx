import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useParams } from 'react-router-dom';
import { fetchLearningPathsByCourse } from '../../services/courseService';

const CourseDetail = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="app-layout bg-light min-vh-100 d-flex flex-column">
      <Header />
      <main className="content bg-white border rounded p-0">
        <div className="container py-4">
          {loading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div className="text-danger">{error}</div>
          ) : data ? (
            <>
              <h2 className="mb-3">{data.course?.course_name} ({data.course?.course_id})</h2>
              <div className="text-muted mb-3">Trạng thái: {data.course?.course_status || data.course?.status}</div>
              <p className="mb-4">{data.course?.course_description || 'Chưa có mô tả'}</p>
              <h4 className="mb-2">Lộ trình ({data.learning_paths?.length || 0})</h4>
              {data.learning_paths?.length ? (
                <ul className="list-group">
                  {data.learning_paths.map(lp => (
                    <li key={lp.lp_id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{lp.lp_name || `LP #${lp.lp_id}`}</div>
                        <div className="small text-muted">{lp.lp_desciption || ''}</div>
                      </div>
                      <span className="badge text-bg-light">#{lp.lp_id}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>Chưa có lộ trình cho khóa học này.</div>
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


