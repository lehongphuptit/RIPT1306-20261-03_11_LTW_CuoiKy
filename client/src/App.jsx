import HomePage, {JournalTimeline} from './pages/HomePage.jsx';
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PostFormPage from './pages/PostFormPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import EditProfilePage from './pages/EditProfilePage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import NotificationBell from './components/notifications/NotificationBell.jsx';
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function Account() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>Đang kiểm tra phiên đăng nhập...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <main style={{ maxWidth: 650, margin: "60px auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>Travel Diary</h1>
        <NotificationBell />
      </div>
      <p>Đăng nhập thành công: {user.displayName}</p>
      <p>Vai trò từ server: {user.role}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
        <Link to="/posts/new" style={{ padding: "10px 16px", background: "#1F3333", color: "white", borderRadius: 999, textDecoration: "none", fontSize: 14 }}>
          + Đăng bài mới
        </Link>
        <Link to={`/u/${user.username}`} style={{ padding: "10px 16px", background: "#DDE7E8", color: "#162424", borderRadius: 999, textDecoration: "none", fontSize: 14 }}>
          Trang cá nhân
        </Link>
        <Link to="/settings/profile" style={{ padding: "10px 16px", background: "#DDE7E8", color: "#162424", borderRadius: 999, textDecoration: "none", fontSize: 14 }}>
          Sửa hồ sơ
        </Link>
        <Link to="/notifications" style={{ padding: "10px 16px", background: "#DDE7E8", color: "#162424", borderRadius: 999, textDecoration: "none", fontSize: 14 }}>
          Thông báo
        </Link>
      </div>
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
          <Route path="/" element={<HomePage />}>
            <Route index element={<JournalTimeline />} />
            <Route path="account" element={<Account />} />
            <Route path="posts/new" element={<Navigate to="/?view=create" replace />} />
            <Route path="posts/:id/edit" element={<PostFormPage />} />
            <Route path="posts/:id" element={<PostDetailPage />} />
            <Route path="u/:username" element={<ProfilePage />} />
            <Route path="settings/profile" element={<EditProfilePage />} />
            <Route path="settings/password" element={<ChangePasswordPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="*"
            element={
              <main style={{ padding: 32 }}>404 - Không tìm thấy trang</main>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
