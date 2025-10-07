


const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const getSchedules = async (params = {}) => {
    try {
        // Trong thực tế, sẽ gọi API
        // const queryParams = new URLSearchParams();
        // Object.keys(params).forEach(key => {
        //     if (params[key]) queryParams.append(key, params[key]);
        // });
        // const response = await fetch(`${BASE_URL}/schedules?${queryParams.toString()}`, {
        //     headers: getHeaders()
        // });
        // const result = await response.json();
        // if (!result.success) {
        //     throw new Error(result.message || 'Không thể tải dữ liệu lịch học');
        // }
        // return result.data;
        
        // Tạm thời return mock data
        return getMockSchedules(params);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        throw error;
    }
};

export const createSchedule = async (scheduleData) => {
    try {
        const response = await fetch(`${BASE_URL}/schedules`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(scheduleData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Không thể tạo lịch học');
        }
        
        return result.data;
    } catch (error) {
        console.error("Error creating schedule:", error);
        throw error;
    }
};

export const updateSchedule = async (scheduleId, scheduleData) => {
    try {
        const response = await fetch(`${BASE_URL}/schedules/${scheduleId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(scheduleData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Không thể cập nhật lịch học');
        }
        
        return result.data;
    } catch (error) {
        console.error("Error updating schedule:", error);
        throw error;
    }
};

export const deleteSchedule = async (scheduleId) => {
    try {
        const response = await fetch(`${BASE_URL}/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Không thể xóa lịch học');
        }
        
        return true;
    } catch (error) {
        console.error("Error deleting schedule:", error);
        throw error;
    }
};

// Hàm mock data cho testing
const getMockSchedules = (params) => {
    const mockSchedules = [
        {
            id: '1',
            class_id: '1',
            class_name: 'TOEIC 500+ (Sáng T2-4-6)',
            teacher_id: 'T001',
            teacher_name: 'Nguyễn Văn A',
            room_id: 'R001',
            room_name: 'Phòng 101',
            start_time: '2025-10-02T08:00:00',
            end_time: '2025-10-02T10:00:00',
            session_name: 'Buổi 1: Giới thiệu khóa học',
            color: '#4CAF50',
            recurring: true,
            recurring_pattern: 'MWF' // Monday, Wednesday, Friday
        },
        {
            id: '2',
            class_id: '3',
            class_name: 'TOEIC 750+ (Tối T3-5-7)',
            teacher_id: 'T003',
            teacher_name: 'Lê Văn C',
            room_id: 'R003',
            room_name: 'Phòng 201',
            start_time: '2025-10-03T18:00:00',
            end_time: '2025-10-03T20:30:00',
            session_name: 'Buổi 1: Listening Strategies',
            color: '#2196F3',
            recurring: true,
            recurring_pattern: 'TTS' // Tuesday, Thursday, Saturday
        }
    ];
    
    // Lọc theo các tham số
    let filteredSchedules = [...mockSchedules];
    
    if (params.class_id) {
        filteredSchedules = filteredSchedules.filter(s => s.class_id === params.class_id);
    }
    
    if (params.teacher_id) {
        filteredSchedules = filteredSchedules.filter(s => s.teacher_id === params.teacher_id);
    }
    
    if (params.room_id) {
        filteredSchedules = filteredSchedules.filter(s => s.room_id === params.room_id);
    }
    
    // Trong thực tế sẽ lọc theo ngày, nhưng trong mock data này chúng ta bỏ qua
    
    return filteredSchedules;
};