import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useImagePreviews } from '../hooks/useImagePreviews';
import { errorMessage, userService } from '../services/userService';

export default function EditProfilePage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFiles, setAvatarFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const avatarPreviews = useImagePreviews(avatarFiles);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  if (authLoading) {
    return <div className="max-w-xl mx-auto py-12 text-center text-[#4a6363]">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleAvatarChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Ảnh đại diện chỉ chấp nhận JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh đại diện tối đa 5 MB.');
      return;
    }
    setAvatarFiles([file]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError('Tên hiển thị phải từ 2 đến 50 kí tự.');
      return;
    }
    if (bio.length > 200) {
      setError('Giới thiệu bản thân tối đa 200 kí tự.');
      return;
    }

    setSubmitting(true);
    try {
      const formData=new FormData();
      formData.append('displayName',displayName.trim());
      formData.append('bio',bio.trim());
      if(avatarFiles[0])formData.append('avatar',avatarFiles[0]);
      const result=await userService.updateProfile(formData);
      setUser(result.user);

      setSuccess('Cập nhật hồ sơ thành công!');
      setTimeout(() => {
        navigate(`/u/${user.username}`);
      }, 900);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentAvatarUrl =
    avatarPreviews[0]?.url ||
    user.avatar?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username)}&background=1F3333&color=fff`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 p-6 sm:p-8 shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-[#162424] dark:text-[#e8f0f0]">Chỉnh sửa hồ sơ</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1F3333] text-white flex items-center justify-center shadow hover:bg-[#142222]"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <span className="text-xs text-[#4a6363]">Bấm biểu tượng máy ảnh để đổi ảnh đại diện</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Tên hiển thị *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-full bg-white dark:bg-[#182828] px-4 py-2.5 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#162424] dark:text-[#e8f0f0] mb-1.5">
              Giới thiệu bản thân ({bio.length}/200)
            </label>
            <textarea
              rows={4}
              maxLength={200}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Chia sẻ đôi dòng về sở thích xê dịch của bạn..."
              className="w-full rounded-2xl bg-white dark:bg-[#182828] p-4 text-sm border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#1F3333]"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {success && <p className="text-xs font-medium text-emerald-700">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-full text-sm font-medium bg-white/80 hover:bg-white text-[#162424]"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-2.5 rounded-full text-sm font-semibold bg-[#1F3333] hover:bg-[#142222] text-white disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
