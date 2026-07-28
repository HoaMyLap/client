'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, Plus, Folder, Users, Trash, PlusCircle, 
  Pencil, Shield, User, X, CheckCircle2 
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  status: string;
  createdAt: string;
}

interface WorkspaceMember {
  userId: string;
  email: string;
  fullname: string;
  avatarUrl: string | null;
  role: string;
}

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [showProjModal, setShowProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState('');

  // Edit Project Modal State
  const [showEditProjModal, setShowEditProjModal] = useState(false);
  const [editingProjId, setEditingProjId] = useState('');
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjStatus, setEditProjStatus] = useState('ACTIVE');
  const [editProjLoading, setEditProjLoading] = useState(false);
  const [editProjError, setEditProjError] = useState('');

  // Add Member State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [centerToast, setCenterToast] = useState<{ title: string; message: string } | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [inviteTargetType, setInviteTargetType] = useState<'WORKSPACE' | 'PROJECT'>('WORKSPACE');
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');

  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [projData, memberData] = await Promise.all([
        api.projects.list(workspaceId),
        api.workspaces.getMembers(workspaceId),
      ]);
      setProjects(projData || []);
      setMembers(memberData || []);
    } catch (err: any) {
      console.error(err);
      setPageError(err.message || 'Bạn không có quyền truy cập Workspace này hoặc đã rời khỏi Workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjError('');
    setProjLoading(true);

    try {
      await api.projects.create({
        name: newProjName,
        description: newProjDesc,
        workspaceId,
      });
      setShowProjModal(false);
      setNewProjName('');
      setNewProjDesc('');
      loadData();
    } catch (err: any) {
      setProjError(err.message || 'Lỗi khi tạo dự án.');
    } finally {
      setProjLoading(false);
    }
  };

  const handleOpenEditProject = (e: React.MouseEvent, proj: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProjId(proj.id);
    setEditProjName(proj.name);
    setEditProjDesc(proj.description || '');
    setEditProjStatus(proj.status || 'ACTIVE');
    setEditProjError('');
    setShowEditProjModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProjError('');
    setEditProjLoading(true);

    try {
      await api.projects.update(editingProjId, {
        name: editProjName,
        description: editProjDesc,
        status: editProjStatus,
        workspaceId,
      });
      setShowEditProjModal(false);
      loadData();
    } catch (err: any) {
      setEditProjError(err.message || 'Lỗi khi cập nhật dự án.');
    } finally {
      setEditProjLoading(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này? Toàn bộ thẻ công việc sẽ bị xóa theo.')) {
      return;
    }

    try {
      await api.projects.delete(projectId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa dự án (chỉ Admin của Workspace mới được xóa).');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    setMemberLoading(true);

    try {
      const targetId = inviteTargetType === 'PROJECT' ? inviteProjectId : workspaceId;
      if (inviteTargetType === 'PROJECT' && !targetId) {
        throw new Error('Vui lòng chọn dự án để mời');
      }

      await api.notifications.invite({
        email: memberEmail,
        targetType: inviteTargetType,
        targetId: targetId,
        role: memberRole,
      });

      const invitedEmail = memberEmail;
      setMemberEmail('');
      setShowInviteModal(false);

      // Hiển thị thẻ thông báo ra giữa màn hình trong 4 giây
      setCenterToast({
        title: 'Đã gửi lời mời thành công! 🎉',
        message: `Hệ thống đã gửi lời mời xác nhận tới email "${invitedEmail}". Người dùng sẽ nhận được thông báo để chấp nhận.`,
      });
      setTimeout(() => setCenterToast(null), 4000);
    } catch (err: any) {
      setMemberError(err.message || 'Gửi lời mời thất bại. Chỉ Admin mới có quyền thực hiện.');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    if (!confirm('Bạn có chắc chắn muốn gửi yêu cầu rời khỏi Workspace này? Yêu cầu sẽ được gửi tới Admin để phê duyệt.')) return;
    try {
      await api.notifications.requestLeave({ targetType: 'WORKSPACE', targetId: workspaceId });
      alert('Yêu cầu rời Workspace đã được gửi thành công tới Admin. Vui lòng chờ phê duyệt.');
    } catch (err: any) {
      alert(err.message || 'Không thể gửi yêu cầu rời.');
    }
  };

  const handleRemoveMember = async (userId: string, fullname: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${fullname}" khỏi workspace này?`)) return;

    try {
      await api.workspaces.removeMember(workspaceId, userId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa thành viên (chỉ Admin mới có quyền).');
    }
  };

  const handleChangeMemberRole = async (userId: string, newRole: string) => {
    try {
      await api.workspaces.updateMemberRole(workspaceId, userId, newRole);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật vai trò thành viên.');
    }
  };

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const isAdmin = currentUserMember?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground relative font-sans items-center justify-center">
        <Sidebar />
        <div className="flex-1 text-center p-8 max-w-md mx-auto relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-heading mb-2">Không có quyền truy cập</h2>
          <p className="text-secondary text-xs leading-relaxed mb-6">
            {pageError}
          </p>
          <Link href="/" className="ui-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 left-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-6xl w-full mx-auto px-6 mt-6">
          <Link href="/" className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold">
            <ArrowLeft className="h-4.5 w-4.5" />
            QUAY LẠI DANH SÁCH WORKSPACE
          </Link>
        </div>

        <main className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 w-full">
          {/* Left Column: Projects list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight font-display text-heading">Các dự án</h2>
                <p className="text-secondary text-sm mt-1">
                  Lựa chọn dự án để theo dõi Kanban Board
                </p>
              </div>

              <button onClick={() => setShowProjModal(true)} className="ui-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                <Plus className="h-4 w-4" />
                Tạo Dự án
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-border">
                <Folder className="h-12 w-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-heading">Chưa có dự án nào</h3>
                <p className="text-secondary text-sm mb-6">
                  Workspace này chưa khởi tạo dự án. Hãy bắt đầu ngay bây giờ!
                </p>
                <button onClick={() => setShowProjModal(true)} className="ui-btn-primary px-5 py-2.5 text-sm">
                  Tạo dự án mới
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <Link key={proj.id} href={`/project/${proj.id}`}>
                    <div className="glass hover:border-primary/40 p-5 rounded-2xl transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between min-h-[150px] relative border border-border">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold group-hover:text-primary transition-colors text-title">
                            {proj.name}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            proj.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            proj.status === 'ARCHIVED' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                            'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-secondary text-xs mt-2 line-clamp-2">
                          {proj.description || 'Không có mô tả chi tiết.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted mt-4 pt-3 border-t border-border-subtle">
                        <span>Tạo ngày: {new Date(proj.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditProject(e, proj)}
                            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Sửa thông tin dự án"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(e, proj.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-muted transition-colors"
                            title="Xóa dự án"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Member Management */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2 text-heading">
                  <Users className="h-5 w-5 text-primary" />
                  Thành viên ({members.length})
                </h3>
                <button
                  type="button"
                  onClick={handleRequestLeave}
                  className="text-[11px] font-semibold text-amber-400 hover:underline border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-lg"
                  title="Gửi yêu cầu rời Workspace tới Admin"
                >
                  Yêu cầu rời
                </button>
              </div>

              {/* Only Admin can see the Invite Member button */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setMemberError('');
                    setShowInviteModal(true);
                  }}
                  className="ui-btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-wider mb-6 shadow-md hover:scale-[1.01] transition-transform"
                >
                  <PlusCircle className="h-4 w-4" />
                  Mời thành viên mới
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-secondary text-center mb-6">
                  🔒 Chỉ <strong>Admin</strong> mới có quyền mời thành viên mới.
                </div>
              )}

              {/* Members List */}
              <div className="border-t border-border-subtle pt-4 space-y-3">
                <h4 className="text-xs font-bold text-heading uppercase tracking-wider mb-3">
                  Danh sách thành viên hiện tại
                </h4>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          {m.fullname ? m.fullname.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-heading truncate">{m.fullname}</div>
                          <div className="text-[10px] text-muted truncate">{m.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeMemberRole(m.userId, e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-primary rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MEMBER">MEMBER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                        
                        <button
                          onClick={() => handleRemoveMember(m.userId, m.fullname)}
                          className="p-1 rounded text-muted hover:text-error hover:bg-error-muted transition-colors"
                          title="Xóa thành viên khỏi workspace"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Create Project Modal */}
        {showProjModal && (
          <div className="ui-modal-overlay">
            <div className="w-full max-w-md glass p-8 rounded-2xl relative">
              <h3 className="text-xl font-bold mb-6 font-display text-heading">Tạo Dự án mới</h3>

              {projError && <div className="ui-alert-error mb-4 text-sm">{projError}</div>}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="ui-label tracking-wider">Tên Dự án</label>
                  <input
                    type="text"
                    required
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Ví dụ: App Redesign, Marketing Q3..."
                    className="ui-input px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="ui-label tracking-wider">Mô tả chi tiết</label>
                  <textarea
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Mô tả sơ qua mục tiêu và phạm vi của dự án này..."
                    rows={3}
                    className="ui-input px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowProjModal(false)} className="ui-btn-secondary px-4 py-2 text-sm">
                    Hủy
                  </button>
                  <button type="submit" disabled={projLoading} className="ui-btn-primary px-5 py-2 text-sm">
                    {projLoading ? 'Đang tạo...' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditProjModal && (
          <div className="ui-modal-overlay">
            <div className="w-full max-w-md glass p-8 rounded-2xl relative">
              <h3 className="text-xl font-bold mb-6 font-display text-heading">Chỉnh sửa Dự án</h3>

              {editProjError && <div className="ui-alert-error mb-4 text-sm">{editProjError}</div>}

              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                  <label className="ui-label tracking-wider">Tên Dự án</label>
                  <input
                    type="text"
                    required
                    value={editProjName}
                    onChange={(e) => setEditProjName(e.target.value)}
                    className="ui-input px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="ui-label tracking-wider">Mô tả chi tiết</label>
                  <textarea
                    value={editProjDesc}
                    onChange={(e) => setEditProjDesc(e.target.value)}
                    rows={3}
                    className="ui-input px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="ui-label tracking-wider">Trạng thái</label>
                  <select
                    value={editProjStatus}
                    onChange={(e) => setEditProjStatus(e.target.value)}
                    className="ui-input px-4 py-2.5 text-sm"
                  >
                    <option value="ACTIVE font-bold">ACTIVE (Đang hoạt động)</option>
                    <option value="COMPLETED">COMPLETED (Hoàn thành)</option>
                    <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowEditProjModal(false)} className="ui-btn-secondary px-4 py-2 text-sm">
                    Hủy
                  </button>
                  <button type="submit" disabled={editProjLoading} className="ui-btn-primary px-5 py-2 text-sm">
                    {editProjLoading ? 'Đang lưu...' : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Center Screen Floating Toast Notification */}
        {centerToast && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in max-w-md w-full px-4 pointer-events-auto">
            <div className="bg-card border-2 border-emerald-500/50 text-foreground p-5 rounded-2xl shadow-2xl flex items-start gap-4 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-heading">{centerToast.title}</h4>
                <p className="text-xs text-secondary mt-1 leading-relaxed">{centerToast.message}</p>
              </div>
              <button
                onClick={() => setCenterToast(null)}
                className="text-muted hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Spacious Invite Member Modal */}
        {showInviteModal && (
          <div className="ui-modal-overlay bg-black/80 backdrop-blur-md z-[60]">
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl relative shadow-2xl overflow-hidden text-foreground">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display text-heading">
                      Mời thành viên mới
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Gửi lời mời tham gia Workspace hoặc Dự án cụ thể
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="ui-btn-ghost p-2 rounded-xl text-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddMember} className="p-6 space-y-5">
                {memberError && <div className="ui-alert-error text-xs">{memberError}</div>}

                {/* Target Type Selector */}
                <div>
                  <label className="ui-label text-xs font-semibold mb-1.5 block">Hình thức mời gia nhập</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInviteTargetType('WORKSPACE')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                        inviteTargetType === 'WORKSPACE'
                          ? 'bg-primary/20 border-primary text-primary shadow-sm'
                          : 'bg-surface border-border text-secondary hover:text-foreground'
                      }`}
                    >
                      🏢 Vào Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteTargetType('PROJECT')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                        inviteTargetType === 'PROJECT'
                          ? 'bg-primary/20 border-primary text-primary shadow-sm'
                          : 'bg-surface border-border text-secondary hover:text-foreground'
                      }`}
                    >
                      📁 Vào Dự án cụ thể
                    </button>
                  </div>
                </div>

                {/* Project Selector if targetType is PROJECT */}
                {inviteTargetType === 'PROJECT' && (
                  <div>
                    <label className="ui-label text-xs font-semibold mb-1.5 block">Chọn dự án chỉ định</label>
                    <select
                      required
                      value={inviteProjectId}
                      onChange={(e) => setInviteProjectId(e.target.value)}
                      className="ui-input px-4 py-3 text-xs w-full rounded-xl"
                    >
                      <option value="">-- Chọn dự án --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="ui-label text-xs font-semibold mb-1.5 block">Email người nhận lời mời</label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="ui-input px-4 py-3 text-xs w-full rounded-xl"
                  />
                </div>

                <div>
                  <label className="ui-label text-xs font-semibold mb-1.5 block">Vai trò (Permission Role)</label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="ui-input px-4 py-3 text-xs w-full rounded-xl"
                  >
                    <option value="MEMBER">MEMBER (Có quyền Tạo & Sửa công việc)</option>
                    <option value="VIEWER">VIEWER (Chỉ có quyền xem thông tin)</option>
                    <option value="ADMIN">ADMIN (Toàn quyền quản lý)</option>
                  </select>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="ui-btn-secondary px-5 py-2.5 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="ui-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    {memberLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                        Đang gửi...
                      </>
                    ) : (
                      '✨ Gửi lời mời ngay'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
