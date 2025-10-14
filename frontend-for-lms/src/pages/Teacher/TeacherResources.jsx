import './css/TeacherResources.css';

const resourceCollectionMock = [
  {
    id: 'RES-101',
    title: 'Ngân hàng đề Listening Part 3',
    description: '20 đề cập nhật quý III/2025, kèm đáp án và transcript.',
    lastUpdated: '01/10/2025',
    type: 'Tài liệu'
  },
  {
    id: 'RES-132',
    title: 'Template đánh giá tiến độ lớp',
    description: 'Biểu mẫu chuẩn để báo cáo tiến độ từng lớp hàng tuần.',
    lastUpdated: '28/09/2025',
    type: 'Biểu mẫu'
  },
  {
    id: 'RES-204',
    title: 'Checklist chuẩn bị lớp học hybrid',
    description: 'Các bước cần chuẩn bị cho buổi học kết hợp offline/online.',
    lastUpdated: '22/09/2025',
    type: 'Checklist'
  }
];

function TeacherResources() {
  return (
    <div className="teacher-resources">
      <div className="resource-actions">
        <button type="button" className="btn btn-primary">
          <i className="bi bi-upload"></i> Tải tài liệu lên
        </button>
        <button type="button" className="btn btn-outline-secondary">
          <i className="bi bi-funnel"></i> Quản lý thư mục
        </button>
      </div>

      <div className="resource-list">
        {resourceCollectionMock.map((item) => (
          <article key={item.id} className="resource-card">
            <div className="resource-meta">
              <span className="badge bg-info">{item.type}</span>
              <span className="resource-id">{item.id}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <footer>
              <span>Cập nhật: {item.lastUpdated}</span>
              <div className="resource-actions-inline">
                <button type="button" className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-eye"></i> Xem nhanh
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-download"></i> Tải về
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

export default TeacherResources;
