import { api, errorMessage } from './api';

export { errorMessage };

export const postService = {
  getPostById: async (id) => {
    const res = await api.get(`/posts/${id}`);
    return res.data;
  },

  createPost: async (formData) => {
    const res = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updatePost: async (id, formData) => {
    const res = await api.patch(`/posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deletePost: async (id) => {
    const res = await api.delete(`/posts/${id}`);
    return res.data;
  },

  autocompletePlaces: async (q) => {
    const res = await api.get('/places/autocomplete', { params: { q } });
    return res.data;
  },

  getPlaceDetail: async (placeId) => {
    const res = await api.get(`/places/${placeId}`);
    return res.data;
  },

  likePost: async (id) => {
    const res = await api.post(`/posts/${id}/likes`);
    return res.data;
  },

  unlikePost: async (id) => {
    const res = await api.delete(`/posts/${id}/likes`);
    return res.data;
  },

  getComments: async (postId, cursor = null) => {
    const res = await api.get(`/posts/${postId}/comments`, {
      params: cursor ? { cursor } : {},
    });
    return res.data;
  },

  createComment: async (postId, payload) => {
    const res = await api.post(`/posts/${postId}/comments`, payload);
    return res.data;
  },

  deleteComment: async (commentId) => {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  },

  reportPost: async (payload) => {
    const res = await api.post('/reports', payload);
    return res.data;
  },
};