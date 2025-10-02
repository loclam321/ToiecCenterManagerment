import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './EnrollmentResultModal.css';

function EnrollmentResultModal({ isOpen, onClose, results, studentData }) {
    if (!isOpen) return null;
    
    // Kiểm tra xem tất cả học viên đã đăng ký trước đó chưa
    const allAlreadyEnrolled = results.alreadyEnrolled.length > 0 && 
                              results.success.length === 0 &&
                              results.failed.length === 0;
    
    // Hàm lấy thông tin học viên từ ID
    const getStudentInfo = (studentId) => {
        const student = studentData.find(s => (s.user_id || s.id) === studentId);
        return student ? student.user_name || student.name || studentId : studentId;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Kết quả đăng ký học viên</h3>
                    <button className="close-button" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="modal-body">
                    {allAlreadyEnrolled && (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle"></i>
                            <span>Tất cả học viên đã đăng ký lớp học này trước đó.</span>
                        </div>
                    )}

                    {results.success.length > 0 && (
                        <div className="result-section success-section">
                            <h4>
                                <i className="bi bi-check-circle"></i> 
                                Đăng ký thành công ({results.success.length})
                            </h4>
                            <ul className="result-list">
                                {results.success.map(id => (
                                    <li key={id}>{getStudentInfo(id)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {results.alreadyEnrolled.length > 0 && (
                        <div className="result-section warning-section">
                            <h4>
                                <i className="bi bi-exclamation-circle"></i>
                                Đã đăng ký trước đó ({results.alreadyEnrolled.length})
                            </h4>
                            <ul className="result-list">
                                {results.alreadyEnrolled.map(id => (
                                    <li key={id}>{getStudentInfo(id)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {results.failed.length > 0 && (
                        <div className="result-section error-section">
                            <h4>
                                <i className="bi bi-x-circle"></i>
                                Đăng ký thất bại ({results.failed.length})
                            </h4>
                            <ul className="result-list">
                                {results.failed.map(item => (
                                    <li key={item.id}>
                                        {getStudentInfo(item.id)} - {item.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    {results.success.length > 0 ? (
                        <button className="btn btn-primary" onClick={onClose}>
                            Đồng ý
                        </button>
                    ) : (
                        <button className="btn btn-secondary" onClick={onClose}>
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

EnrollmentResultModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    results: PropTypes.shape({
        success: PropTypes.array.isRequired,
        alreadyEnrolled: PropTypes.array.isRequired,
        failed: PropTypes.array.isRequired
    }).isRequired,
    studentData: PropTypes.array.isRequired
};

export default EnrollmentResultModal;