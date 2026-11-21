import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    const fetchUnread = async () => {
      try {
        const count = await userService.getUnreadCount();
        if(active)setUnreadCount(count);
      } catch {
      }
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      title="Thông báo"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#1F3333] border border-white/70 shadow-sm transition"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
