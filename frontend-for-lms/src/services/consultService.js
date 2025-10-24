import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/consult-registrations';

export const createConsultRegistration = async (registrationData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/`, registrationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    console.error('Error creating consult registration:', error);
    throw error;
  }
};
