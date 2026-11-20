import { api, errorMessage } from './api';

export { errorMessage };

export const userService = {
  getProfileByUsername: async (username) => {
    const res = await api.get(`/users/${username}`);
    return res.data;
  },

  getUserPosts: async (username, cursor = null) => {
    const res = await api.get(`/users/${username}/posts`, {
      params: cursor ? { cursor } : {},
    });
    return res.data;
  },

  followUser: async (target) => {
    const res = await api.post(`/users/${target}/follow`);
    return res.data;
  },

  unfollowUser: async (target) => {
    const res = await api.delete(`/users/${target}/follow`);
    return res.data;
  },

  updateProfile: async (payload) => {
    const res = await api.patch('/users/me', payload);
    return res.data;
  },

  updateAvatar: async (formData) => {
    const res = await api.put('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  changePassword: async (payload) => {
    const res = await api.put('/users/me/password', payload);
    return res.data;
  },

  getNotifications: async (cursor = null) => {
    const res = await api.get('/notifications', {
      params: cursor ? { cursor } : {},
    });
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};