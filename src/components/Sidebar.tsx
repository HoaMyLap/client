'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { createNotificationStompClient } from '@/lib/socket';
import { Client } from '@stomp/stompjs';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/lib/i18n';
import { 
  Briefcase, Folder, ChevronRight, Home, Users, 
  Settings, LogOut, ChevronDown, Plus, LayoutGrid, 
  CheckSquare, Bell, User, X, Check, ChevronLeft, ChevronRight as ChevronRightIcon, 
  Sparkles, Zap, TrendingUp, MessageSquare, Calendar, Shield, Activity, FileText, Globe
} from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  workspaceId: string;
}

interface Notification {
  id: string;
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

export default function Sidebar() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  // Collapse/Expand state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  
  // Profile states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editFullname, setEditFullname] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedConfirmNotif, setSelectedConfirmNotif] = useState<Notification | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifClientRef = useRef<Client | null>(null);

  // Click Outside Refs
  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [loading, setLoading] = useState(true);

  const workspaceId = params?.workspaceId as string;
  const projectId = params?.projectId as string;

  useEffect(() => {
    // Load collapsed state from local storage
    const savedCollapse = localStorage.getItem('sidebar_collapsed');
    if (savedCollapse === 'true') {
      setIsCollapsed(true);
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setFullname(localStorage.getItem('fullname') || 'User');
    setEmail(localStorage.getItem('email') || 'user@example.com');
    const storedUserId = localStorage.getItem('userId') || '';
    setUserId(storedUserId);

    // Fetch user details
    api.users.me().then(user => {
      setFullname(user.fullname);
      setEditFullname(user.fullname);
      setEditAvatarUrl(user.avatarUrl || '');
      localStorage.setItem('fullname', user.fullname);
      if (user.email) setEmail(user.email);
    }).catch(console.error);

    loadSidebarData();
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
  }, [workspaceId, projectId]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const loadSidebarData = async () => {
    try {
      setLoading(true);
      const wsList = await api.workspaces.list();
      setWorkspaces(wsList || []);

      let activeWsId = workspaceId;

      if (projectId && !activeWsId) {
        const projDetails = await api.projects.get(projectId);
        if (projDetails) {
          activeWsId = projDetails.workspaceId;
        }
      }

      if (activeWsId) {
        const foundWs = wsList.find((w: Workspace) => w.id === activeWsId);
        if (foundWs) {
          setCurrentWorkspace(foundWs);
        }
        try {
          const projList = await api.projects.list(activeWsId);
          setProjects(projList || []);
        } catch {
          setProjects([]);
        }
      } else {
        setCurrentWorkspace(null);
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
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

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    if (n.type === 'INVITATION' || n.type === 'LEAVE_REQUEST') {
      setSelectedConfirmNotif(n);
      setShowNotifDropdown(false);
    } else if (n.projectId && n.taskId) {
      let url = `/project/${n.projectId}?taskId=${n.taskId}`;
      if (n.commentId) {
        url += `&commentId=${n.commentId}`;
      }
      setShowNotifDropdown(false);
      router.push(url);
    }
  };

  const handleRespondInvitation = async (id: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      await api.notifications.respondInvitation(id, action);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      loadNotifications();
      if (action === 'ACCEPT') {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xử lý lời mời.');
    }
  };

  const handleRespondLeave = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.notifications.respondLeave(id, action);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      loadNotifications();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xử lý yêu cầu rời.');
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

  const { t, language, setLanguage } = useLanguage();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Informational Guest pages to add to sidebar
  const infoPages = [
    { name: t('home'), path: '/', icon: <Home className="w-5 h-5 shrink-0" /> },
    { name: t('features'), path: '/features', icon: <Zap className="w-5 h-5 shrink-0" /> },
    { name: t('pricing'), path: '/pricing', icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
    { name: t('terms'), path: '/terms', icon: <Shield className="w-5 h-5 shrink-0" /> },
    { name: t('contact'), path: '/contact', icon: <MessageSquare className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <aside 
      className={`h-screen sticky top-0 bg-header backdrop-blur-md border-r border-border flex flex-col justify-between shrink-0 font-sans z-30 select-none transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-5 -right-3 h-6 w-6 rounded-full border border-border bg-header text-secondary hover:text-primary hover:border-primary/40 flex items-center justify-center shadow-md cursor-pointer z-50 transition-transform active:scale-95"
        title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
      >
        {isCollapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Top Section */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Brand Header */}
        <div className={`border-b border-border flex items-center justify-center overflow-hidden ${isCollapsed ? 'p-3 h-16' : 'p-2 h-24'}`}>
          <img 
            src={isCollapsed ? "/minilogo.png" : "/logo2.png"} 
            alt="Logo" 
            style={{ transform: 'scale(1.3)' }}
            className={`object-contain transition-all duration-300 ${
              isCollapsed ? 'h-10 w-10' : 'w-[75%] h-full max-h-20'
            }`} 
          />
        </div>

        {/* Informational Pages Navigation Menu */}
        <div className="p-3 space-y-1">
          {!isCollapsed && (
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider px-3 mb-1">
              {language === 'vi' ? 'Liên kết chính' : 'Main Links'}
            </div>
          )}
          {infoPages.map((page, idx) => {
            const isActive = pathname === page.path;
            return (
              <Link 
                key={idx}
                href={page.path}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isCollapsed ? 'justify-center px-0' : ''
                } ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-secondary hover:bg-hover hover:text-primary'
                }`}
                title={isCollapsed ? page.name : undefined}
              >
                {page.icon}
                {!isCollapsed && <span>{page.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Workspaces list */}
        <div className="px-3 py-2 flex-1 border-t border-border-subtle mt-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between text-[9px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
              <span>{t('workspace')}</span>
            </div>
          )}
          
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {workspaces.map((ws) => (
              <Link 
                key={ws.id} 
                href={`/workspace/${ws.id}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                  isCollapsed ? 'justify-center px-0' : ''
                } ${
                  ws.id === workspaceId || (currentWorkspace && currentWorkspace.id === ws.id)
                    ? 'bg-primary/5 text-primary font-bold border border-primary/20'
                    : 'text-secondary hover:bg-hover hover:text-primary'
                }`}
                title={isCollapsed ? ws.name : undefined}
              >
                <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'truncate'}`}>
                  <Briefcase className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{ws.name}</span>}
                </div>
                {!isCollapsed && <ChevronRight className="w-4 h-4 opacity-60" />}
              </Link>
            ))}
            {workspaces.length === 0 && !loading && !isCollapsed && (
              <span className="text-[10px] text-muted px-3 block">{t('noWorkspace')}</span>
            )}
          </div>

          {/* Sibling Projects list */}
          {currentWorkspace && !isCollapsed && (
            <div className="mt-4 pt-3 border-t border-border-subtle">
              <div className="flex items-center justify-between text-[9px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
                <span className="truncate">{t('subProjectsHeader')} {currentWorkspace.name}</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {projects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/project/${proj.id}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      proj.id === projectId
                        ? 'bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20'
                        : 'text-secondary hover:bg-hover hover:text-primary'
                    }`}
                  >
                    <Folder className="w-5 h-5 shrink-0" />
                    <span className="truncate">{proj.name}</span>
                  </Link>
                ))}
                {projects.length === 0 && !loading && (
                  <span className="text-[10px] text-muted px-3 block">{t('noProjectsInWs')}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Profile Summary & Controls */}
      <div className={`p-3 border-t border-border bg-card/25 relative ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
        
        {/* Row of Controls: Theme, Language and Notifications */}
        <div className={`flex items-center justify-between mb-3 px-1 gap-2 ${isCollapsed ? 'flex-col gap-4 mb-0' : ''}`}>
          <ThemeToggle />

          {/* Language Switcher Button */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="p-1.5 rounded-xl bg-surface border border-border text-xs font-bold flex items-center gap-1 hover:border-primary/40 transition-all text-foreground cursor-pointer shadow-sm"
            title={language === 'vi' ? 'Chuyển sang Tiếng Anh (English)' : 'Switch to Vietnamese (Tiếng Việt)'}
          >
            {language === 'vi' ? (
              <><span>🇻🇳</span> <span className="text-[10px]">VI</span></>
            ) : (
              <><span>🇬🇧</span> <span className="text-[10px]">EN</span></>
            )}
          </button>
          
          {/* Collapsible Bell notifications trigger */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
              }}
              className="ui-btn-ghost p-2 relative flex items-center justify-center shrink-0"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5 shrink-0 text-secondary hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-error rounded-full text-[8px] font-bold flex items-center justify-center text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown inside sidebar */}
            {showNotifDropdown && (
              <div className={`absolute bottom-12 mt-0 w-72 glass border border-border rounded-2xl p-4 shadow-2xl z-50 ${
                isCollapsed ? 'left-6' : 'left-0'
              }`}>
                <div className="flex items-center justify-between border-b border-border-subtle pb-3.5 mb-3">
                  <span className="font-bold text-xs text-heading">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[9px] text-primary hover:underline font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20"
                    >
                      {t('markAllRead')} ({unreadCount})
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-2.5 rounded-xl text-left cursor-pointer transition-all border text-xs ${
                        n.isRead ? 'notif-read' : 'notif-unread hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 font-semibold">
                        <span className="text-[11px] line-clamp-1 text-title">{n.title}</span>
                        {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-secondary mt-1 line-clamp-2 leading-relaxed">{n.content}</p>

                      {/* Confirmation Status Badges vs Interactive Action Buttons */}
                      {n.invitationStatus && n.invitationStatus !== 'PENDING' ? (
                        <div className="mt-2 pt-1.5 border-t border-border-subtle">
                          {n.invitationStatus === 'ACCEPTED' && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 inline-block">{t('agreedStatus')}</span>
                          )}
                          {n.invitationStatus === 'REJECTED' && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 inline-block">{t('rejectedStatus')}</span>
                          )}
                          {n.invitationStatus === 'APPROVED' && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 inline-block">{t('approvedLeaveStatus')}</span>
                          )}
                          {n.invitationStatus === 'REJECTED_LEAVE' && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 inline-block">{t('rejectedLeaveStatus')}</span>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Action buttons for Invitation Notification */}
                          {n.type === 'INVITATION' && n.invitationId && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border-subtle" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleRespondInvitation(n.id, 'ACCEPT')}
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <Check className="h-3 w-3" /> {t('acceptBtn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondInvitation(n.id, 'DECLINE')}
                                className="flex-1 py-1 px-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <X className="h-3 w-3" /> {t('declineBtn')}
                              </button>
                            </div>
                          )}

                          {/* Action buttons for Admin Leave Request Approval */}
                          {n.type === 'LEAVE_REQUEST' && n.invitationId && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border-subtle" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleRespondLeave(n.id, 'APPROVE')}
                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <Check className="h-3 w-3" /> {t('approveLeaveBtn')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondLeave(n.id, 'REJECT')}
                                className="flex-1 py-1 px-2 rounded-lg bg-surface border border-border text-secondary hover:text-foreground text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <X className="h-3 w-3" /> {t('declineBtn')}
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      <span className="text-[8px] text-muted block mt-2">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <p className="text-center text-muted text-[10px] py-8">{t('noNotificationsYet')}</p>
                  )}
                </div>

                <div className="border-t border-border-subtle pt-2.5 mt-2 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-xs font-semibold text-primary hover:underline block"
                  >
                    {t('viewAllNotificationsLink')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Account Controls */}
        <div className={`border-t border-border-subtle pt-3 ${isCollapsed ? 'w-full flex justify-center' : ''}`}>
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifDropdown(false);
              }}
              className={`w-full flex items-center justify-between hover:bg-hover p-1.5 rounded-xl transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary shrink-0 overflow-hidden">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{fullname ? fullname.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="text-left truncate">
                    <div className="text-xs font-bold text-title truncate">{fullname}</div>
                    <div className="text-[10px] text-muted truncate">{email}</div>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="w-4 h-4 text-secondary shrink-0" />}
            </button>

            {/* Profile/Logout Dropdown */}
            {showUserDropdown && (
              <div className={`absolute bottom-12 w-48 glass border border-border rounded-xl p-1.5 shadow-2xl z-50 ${
                isCollapsed ? 'left-6' : 'right-0'
              }`}>
                <Link
                  href="/profile"
                  onClick={() => setShowUserDropdown(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover rounded-lg text-left text-body"
                >
                  <User className="h-4.5 w-4.5 text-secondary" />
                  {t('myProfile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-error-muted text-error rounded-lg text-left mt-1 font-semibold"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  {t('logoutBtn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modification Modal (Dời từ Header.tsx) */}
      {showProfileModal && (
        <div className="ui-modal-overlay">
          <div className="w-full max-w-sm glass p-6 rounded-2xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 ui-btn-ghost p-1"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold mb-5 font-display text-heading">Thiết lập hồ sơ</h3>

            {profileError && (
              <div className="ui-alert-error mb-4 text-[10px]">{profileError}</div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="ui-label text-[10px] uppercase tracking-wider mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  className="ui-input px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="ui-label text-[10px] uppercase tracking-wider mb-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="ui-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex gap-2.5 justify-end mt-5">
                <button type="button" onClick={() => setShowProfileModal(false)} className="ui-btn-secondary px-3.5 py-1.5 text-xs">
                  Hủy
                </button>
                <button type="submit" disabled={profileLoading} className="ui-btn-primary px-4 py-1.5 text-xs font-semibold">
                  {profileLoading ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Center confirmation modal */}
      {selectedConfirmNotif && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-foreground">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                {selectedConfirmNotif.type === 'INVITATION' ? (
                  <Users className="h-5 w-5 text-violet-400" />
                ) : selectedConfirmNotif.type === 'LEAVE_REQUEST' ? (
                  <LogOut className="h-5 w-5 text-rose-400" />
                ) : (
                  <Bell className="h-5 w-5 text-primary" />
                )}
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
                {language === 'vi' ? 'Đóng' : 'Close'}
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
                        {language === 'vi' ? 'Từ chối' : 'Decline'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRespondInvitation(selectedConfirmNotif.id, 'ACCEPT');
                          setSelectedConfirmNotif(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
                      >
                        {language === 'vi' ? 'Chấp nhận' : 'Accept'}
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
                        {language === 'vi' ? 'Từ chối' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRespondLeave(selectedConfirmNotif.id, 'APPROVE');
                          setSelectedConfirmNotif(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
                      >
                        {language === 'vi' ? 'Duyệt rời' : 'Approve'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
