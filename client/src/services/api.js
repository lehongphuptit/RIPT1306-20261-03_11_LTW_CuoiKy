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
  baseURL: import.meta.env.VITE_API_URL || "/api",
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

const postFieldHints = {
  title:"Nhập tiêu đề từ 5 đến 120 ký tự.",
  content:"Nhập nội dung từ 1 đến 5.000 ký tự.",
  location:"Kiểm tra địa điểm (tối đa 120 ký tự) hoặc chọn lại từ danh sách.",
  tripDate:"Chọn ngày hợp lệ, từ hôm nay trở về trước.",
  cost:"Nhập chi phí từ 0 đến 999.999.999.999 đồng.",
  visibility:"Chọn lại chế độ người xem.",
  images:"Vui lòng kiểm tra lại các ảnh giữ lại."
};
export function postFieldErrors(error){
  const errors={};
  for(const issue of error.response?.data?.error?.fields || []){
    const name=issue.field?.split(".")[0];
    if(Object.hasOwn(postFieldHints,name)) errors[name]=name === "images" && issue.message === error.response.data.error.message
      ? issue.message : postFieldHints[name];
  }
  return errors;
}
