'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { createNotificationStompClient } from '@/lib/socket';
import Sidebar from '@/components/Sidebar';
import { 
  Bell, CheckCircle2, MessageSquare, Briefcase, UserCheck, 
  ArrowLeft, CheckCheck, Filter, Clock, Sparkles, Check, X
} from 'lucide-react';
import { Client } from '@stomp/stompjs';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  type: string;
  invitationId?: string | null;
  invitationStatus?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  commentId?: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedConfirmNotif, setSelectedConfirmNotif] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const notifClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userId = localStorage.getItem('userId') || '';
    loadNotifications();

    if (userId) {
      const client = createNotificationStompClient(userId, (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
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
      setLoading(true);
      const data = await api.notifications.list();
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondInvitation = async (notificationId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      await api.notifications.respondInvitation(notificationId, action);
      loadNotifications();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phản hồi lời mời.');
    }
  };

  const handleRespondLeave = async (notificationId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.notifications.respondLeave(notificationId, action);
      loadNotifications();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi duyệt yêu cầu rời.');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.read(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    if (n.type === 'INVITATION' || n.type === 'LEAVE_REQUEST') {
      setSelectedConfirmNotif(n);
    } else if (n.projectId && n.taskId) {
      let url = `/project/${n.projectId}?taskId=${n.taskId}`;
      if (n.commentId) {
        url += `&commentId=${n.commentId}`;
      }
      router.push(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'ALL') return true;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT':
        return <UserCheck className="h-5 w-5 text-violet-400" />;
      case 'COMMENT':
        return <MessageSquare className="h-5 w-5 text-blue-400" />;
      case 'WORKSPACE':
        return <Briefcase className="h-5 w-5 text-amber-400" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-4xl w-full mx-auto px-6 mt-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            QUAY LẠI
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="ui-btn-secondary flex items-center gap-2 px-4 py-2 text-xs font-semibold"
            >
              <CheckCheck className="h-4 w-4 text-success" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold font-display text-heading flex items-center gap-3">
                <Bell className="h-7 w-7 text-primary" />
                Trung tâm Thông báo
                {unreadCount > 0 && (
                  <span className="text-xs bg-error/20 text-error border border-error/30 px-2.5 py-0.5 rounded-full font-bold">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </h1>
              <p className="text-secondary text-sm mt-1">
                Theo dõi tất cả cập nhật, phân công công việc và hoạt động dự án
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-xl overflow-x-auto shrink-0">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
                { id: 'ASSIGNMENT', label: 'Phân công' },
                { id: 'COMMENT', label: 'Bình luận' },
                { id: 'WORKSPACE', label: 'Workspace' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-secondary hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="glass p-12 rounded-2xl border border-border text-center">
              <Bell className="h-12 w-12 text-muted mx-auto mb-3" />
              <h3 className="text-base font-bold text-heading">Không có thông báo nào</h3>
              <p className="text-secondary text-xs mt-1">
                {filterType === 'UNREAD'
                  ? 'Bạn đã đọc tất cả các thông báo!'
                  : 'Hiện chưa có thông báo nào trong mục này.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`glass p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 hover:scale-[1.005] ${
                    n.isRead
                      ? 'border-border/60 opacity-80'
                      : 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    n.isRead ? 'bg-surface border border-border' : 'bg-primary/10 border border-primary/20'
                  }`}>
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-bold truncate ${n.isRead ? 'text-body' : 'text-title font-display'}`}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="Chưa đọc" />
                      )}
                    </div>
                    <p className="text-xs text-secondary mt-1 leading-relaxed">
                      {n.content}
                    </p>

                    {/* Confirmation Status Badges vs Interactive Action Buttons */}
                    {n.invitationStatus && n.invitationStatus !== 'PENDING' ? (
                      <div className="mt-3 pt-2.5 border-t border-border-subtle">
                        {n.invitationStatus === 'ACCEPTED' && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">✓ Đã chấp nhận lời mời</span>
                        )}
                        {n.invitationStatus === 'REJECTED' && (
                          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 inline-flex items-center gap-1">✕ Đã từ chối lời mời</span>
                        )}
                        {n.invitationStatus === 'APPROVED' && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">✓ Đã duyệt rời</span>
                        )}
                        {n.invitationStatus === 'REJECTED_LEAVE' && (
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1">✕ Từ chối yêu cầu rời</span>
                        )}
                      </div>
                    ) : (
                      <>
                        {n.type === 'INVITATION' && n.invitationId && (
                          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border-subtle" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleRespondInvitation(n.id, 'ACCEPT')}
                              className="px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Check className="h-4 w-4" /> Đồng ý tham gia
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRespondInvitation(n.id, 'DECLINE')}
                              className="px-4 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <X className="h-4 w-4" /> Từ chối
                            </button>
                          </div>
                        )}

                        {n.type === 'LEAVE_REQUEST' && n.invitationId && (
                          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border-subtle" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleRespondLeave(n.id, 'APPROVE')}
                              className="px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Check className="h-4 w-4" /> Duyệt rời
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRespondLeave(n.id, 'REJECT')}
                              className="px-4 py-1.5 rounded-xl bg-surface border border-border text-secondary hover:text-foreground text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <X className="h-4 w-4" /> Từ chối
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted mt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-border bg-surface font-semibold uppercase text-[9px]">
                        {n.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Center confirmation modal */}
      {selectedConfirmNotif && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-foreground">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                {getTypeIcon(selectedConfirmNotif.type)}
              </div>
              <div>
                <h3 className="text-sm font-black font-display text-heading">{selectedConfirmNotif.title}</h3>
                <span className="text-[9px] text-muted uppercase font-bold tracking-wider">{selectedConfirmNotif.type}</span>
              </div>
            </div>

            {/* Content */}
            <p className="text-xs text-secondary leading-relaxed bg-surface/30 border border-border-subtle p-4 rounded-2xl">
              {selectedConfirmNotif.content}
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedConfirmNotif(null)}
                className="ui-btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Đóng
              </button>
              
              {(!selectedConfirmNotif.invitationStatus || selectedConfirmNotif.invitationStatus === 'PENDING') && (
                <>
                  {selectedConfirmNotif.type === 'INVITATION' && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRespondInvitation(selectedConfirmNotif.id, 'DECLINE');
                          setSelectedConfirmNotif(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold transition-all"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRespondInvitation(selectedConfirmNotif.id, 'ACCEPT');
                          setSelectedConfirmNotif(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
                      >
                        Chấp nhận
                      </button>
                    </>
                  )}

                  {selectedConfirmNotif.type === 'LEAVE_REQUEST' && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRespondLeave(selectedConfirmNotif.id, 'REJECT');
                          setSelectedConfirmNotif(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold transition-all"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRespondLeave(selectedConfirmNotif.id, 'APPROVE');
                          setSelectedConfirmNotif(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
                      >
                        Duyệt rời
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
