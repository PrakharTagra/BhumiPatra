import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    const response = await axiosClient.post('/api/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await axiosClient.get('/api/auth/me');
    return response.data;
  },
};

export default authApi;
