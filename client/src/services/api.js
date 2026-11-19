import axios from "axios";
export const tokenStorage = {
  get: () =>
    sessionStorage.getItem("td_token") || localStorage.getItem("td_token"),
  set(token, remember) {
    this.clear();
    (remember ? localStorage : sessionStorage).setItem("td_token", token);
  },
  clear() {
    sessionStorage.removeItem("td_token");
    localStorage.removeItem("td_token");
  },
};
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 20000,
});
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.headers?.Authorization
    ) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("td:logout"));
    }
    return Promise.reject(error);
  },
);
export const errorMessage = (e) =>
  e.response?.data?.error?.message ||
  "Không kết nối được máy chủ. Kiểm tra backend và VITE_API_URL.";
