import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, userService } from '../services/userService';

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (authLoading) {
    return <div className="max-w-md mx-auto py-12 text-center text-[#4a6363]">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 kí tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      await userService.changePassword({ currentPassword, newPassword });
      setSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate(`/u/${user.username}`);
      }, 1000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 p-6 sm:p-8 shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-[#162424] dark:text-[#e8f0f0]">Đổi mật khẩu</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Mật khẩu hiện tại *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Mật khẩu mới * (tối thiểu 8 kí tự)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Nhập lại mật khẩu mới *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {success && <p className="text-xs font-medium text-emerald-700">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/80 hover:bg-white text-[#162424]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#1F3333] hover:bg-[#142222] text-white disabled:opacity-50"
            >
              {submitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}