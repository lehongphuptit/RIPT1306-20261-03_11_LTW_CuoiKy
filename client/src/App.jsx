import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
function Account() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>Đang kiểm tra phiên đăng nhập…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <main style={{ maxWidth: 650, margin: "60px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>Travel Diary</h1>
      <p>Đăng nhập thành công: {user.displayName}</p>
      <p>Vai trò từ server: {user.role}</p>
      <p>
        Đây là trang kiểm tra kết nối. Nhóm thay bằng bảng tin hoặc trang quản
        trị sau.
      </p>
      <button
        onClick={logout}
        style={{
          padding: 12,
          background: "#173f40",
          color: "white",
          marginTop: 20,
        }}
      >
        Đăng xuất
      </button>
    </main>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/account" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<Account />} />
          <Route
            path="*"
            element={
              <main style={{ padding: 32 }}>404 — Không tìm thấy trang</main>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

