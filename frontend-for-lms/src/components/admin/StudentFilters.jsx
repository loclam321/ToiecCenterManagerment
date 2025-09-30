import { useState } from 'react';
import './css/StudentFilters.css';

function StudentFilters({ filters, onFilterChange }) {
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  const handleSearchChange = (e) => {
    onFilterChange('search', e.target.value);
  };
  
  const toggleFilters = () => {
    setExpandedFilters(!expandedFilters);
  };
  
  const handleReset = () => {
    onFilterChange('search', '');
    onFilterChange('status', 'all');
    onFilterChange('course', 'all');
    onFilterChange('sortBy', 'newest');
  };

  return (
    <div className="student-filters">
      <div className="filters-main">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm theo tên, email, ID học viên..."
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <button 
              className="btn-clear" 
              onClick={() => onFilterChange('search', '')}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
        
        <button 
          className={`btn-filter ${expandedFilters ? 'active' : ''}`} 
          onClick={toggleFilters}
        >
          <i className="bi bi-funnel"></i>
          <span>Bộ lọc</span>
          {(filters.status !== 'all' || filters.course !== 'all') && (
            <span className="filter-badge"></span>
          )}
        </button>
        
        <div className="sort-box">
          <label htmlFor="sortBy">Sắp xếp:</label>
          <select 
            id="sortBy" 
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name_asc">Tên (A-Z)</option>
            <option value="name_desc">Tên (Z-A)</option>
            <option value="progress_asc">Tiến độ (Thấp-Cao)</option>
            <option value="progress_desc">Tiến độ (Cao-Thấp)</option>
          </select>
        </div>
      </div>
      
      {expandedFilters && (
        <div className="expanded-filters">
          <div className="filter-group">
            <label htmlFor="status">Trạng thái:</label>
            <select 
              id="status" 
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang học</option>
              <option value="inactive">Ngừng học</option>
              <option value="pending">Chờ xác nhận</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="course">Khóa học:</label>
            <select 
              id="course" 
              value={filters.course}
              onChange={(e) => onFilterChange('course', e.target.value)}
            >
              <option value="all">Tất cả khóa học</option>
              <option value="toeic500">TOEIC 500+</option>
              <option value="toeic650">TOEIC 650+</option>
              <option value="toeic800">TOEIC 800+</option>
            </select>
          </div>
          
          <div className="filter-actions">
            <button className="btn-reset" onClick={handleReset}>
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentFilters;