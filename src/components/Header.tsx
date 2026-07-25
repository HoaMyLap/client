import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { createNotificationStompClient } from '@/lib/socket';
import { Bell, LogOut, User, X } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import ThemeToggle from '@/components/ThemeToggle';

interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export default function Header() {
  const router = useRouter();
  const [fullname, setFullname] = useState('');
  const [userId, setUserId] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [editFullname, setEditFullname] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const notifClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setFullname(localStorage.getItem('fullname') || 'User');
    const storedUserId = localStorage.getItem('userId') || '';
    setUserId(storedUserId);

    api.users.me().then(user => {
      setFullname(user.fullname);
      setEditFullname(user.fullname);
      setEditAvatarUrl(user.avatarUrl);
      localStorage.setItem('fullname', user.fullname);
    }).catch(console.error);

    loadNotifications();

    if (storedUserId) {
      const client = createNotificationStompClient(storedUserId, (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      });
      notifClientRef.current = client;
    }

    return () => {
      if (notifClientRef.current) {
        notifClientRef.current.deactivate();
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.read(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileLoading(true);

    try {
      const updated = await api.users.update({
        fullname: editFullname,
        avatarUrl: editAvatarUrl,
      });
      setFullname(updated.fullname);
      localStorage.setItem('fullname', updated.fullname);
      setShowProfileModal(false);
    } catch (err: any) {
      setProfileError(err.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="app-header sticky top-0 z-40 px-6 py-4 flex items-center justify-between text-foreground font-sans">
      <Link href="/" className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-display font-bold text-lg text-primary-foreground">
          S
        </div>
        <span className="font-bold text-lg tracking-tight text-gradient-brand font-display">
          Smart Manager
        </span>
      </Link>

      <div className="flex items-center gap-4 relative">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            className="ui-btn-ghost p-2 relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-error rounded-full text-[9px] font-bold flex items-center justify-center text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass border border-border rounded-2xl p-4 shadow-lg z-50">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
                <span className="font-bold text-sm text-heading">Thông báo</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] text-primary font-semibold bg-primary-muted px-2 py-0.5 rounded-full">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    className={`p-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                      n.isRead ? 'notif-read' : 'notif-unread hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs line-clamp-1 text-title">{n.title}</span>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-secondary mt-1 line-clamp-2">{n.content}</p>
                    <span className="text-[9px] text-muted block mt-2">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-center text-muted text-xs py-8">Bạn không có thông báo nào.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 hover:bg-hover p-1.5 rounded-xl transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-primary-muted border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {fullname ? fullname.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-subtitle text-sm font-medium hidden sm:inline select-none">
              {fullname}
            </span>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-48 glass border border-border rounded-xl p-2 shadow-lg z-50">
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowUserDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-hover rounded-lg text-left text-body"
              >
                <User className="h-4 w-4 text-secondary" />
                Hồ sơ cá nhân
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-error-muted text-error rounded-lg text-left mt-1"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfileModal && (
        <div className="ui-modal-overlay">
          <div className="w-full max-w-md glass p-8 rounded-2xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 ui-btn-ghost p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-6 font-display text-heading">Thiết lập hồ sơ</h3>

            {profileError && (
              <div className="ui-alert-error mb-4 text-xs">{profileError}</div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="ui-label">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  className="ui-input px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="ui-label">Đường dẫn ảnh đại diện (Avatar URL)</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="ui-input px-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setShowProfileModal(false)} className="ui-btn-secondary px-4 py-2 text-xs">
                  Hủy
                </button>
                <button type="submit" disabled={profileLoading} className="ui-btn-primary px-5 py-2 text-xs font-semibold">
                  {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
