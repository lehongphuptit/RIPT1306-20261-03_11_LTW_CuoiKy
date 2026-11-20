import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Heart, MessageCircle, ShieldAlert, UserPlus } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, userService } from '../services/userService';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async (cursor = null, append = false) => {
    try {
      const res = await userService.getNotifications(cursor);
      const items = res.data;
      setNotifications((prev) => (append ? [...prev, ...items] : items));
      setNextCursor(res.nextCursor || null);
      setHasMore(Boolean(res.nextCursor));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  if (authLoading) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-[#4a6363]">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleMarkRead = async (item) => {
    if (item.read) return;
    try {
      await userService.markNotificationRead(item._id);
      setNotifications(prev=>prev.map(n=>n._id===item._id?{...n,read:true}:n));
    } catch(err){alert(errorMessage(err));}
  };

  const handleMarkAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifications(prev=>prev.map(n=>({...n,read:true})));
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-sky-600" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    }
  };

  const getTargetLink = (item) => {
    if (item.post) {
      return `/posts/${item.post?._id || item.post}`;
    }
    if (item.actor?.username) {
      return `/u/${item.actor.username}`;
    }
    return '/account';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-3xl bg-white/75 dark:bg-[#162424]/85 backdrop-blur-xl border border-white/70 p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#1F3333] dark:text-white" />
            <h1 className="text-xl font-bold text-[#162424] dark:text-[#e8f0f0]">Thông báo</h1>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1F3333] hover:bg-[#142222] text-white flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-[#4a6363] py-6 text-center">Đang tải thông báo...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-[#4a6363] py-8 text-center">Bạn chưa có thông báo nào.</p>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => (
              <Link
                key={item._id}
                to={getTargetLink(item)}
                onClick={() => handleMarkRead(item)}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition ${
                  item.read
                    ? 'bg-white/50 border-white/50 opacity-80'
                    : 'bg-white border-[#1F3333]/20 shadow-sm'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#DDE7E8] flex items-center justify-center shrink-0 mt-0.5">
                  {renderIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#162424]">
                    {item.message || (
                      <>
                        <strong>{item.actor?.displayName || item.actor?.username || 'Ai đó'}</strong>{' '}
                        đã tương tác với bạn
                      </>
                    )}
                  </p>
                  <span className="text-xs text-[#4a6363] mt-1 block">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                {!item.read && <span className="w-2.5 h-2.5 rounded-full bg-[#1F3333] shrink-0 mt-2" />}
              </Link>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={() => fetchNotifications(nextCursor, true)}
                className="w-full py-2.5 rounded-full text-xs font-semibold bg-white/80 hover:bg-white text-[#1F3333]"
              >
                Xem thêm thông báo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
