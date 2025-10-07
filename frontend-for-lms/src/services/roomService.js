import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const roomService = {
  // Lấy tất cả phòng học
  getAllRooms: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms/all`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  }
};