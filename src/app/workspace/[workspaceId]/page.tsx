'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { ArrowLeft, Plus, Folder, Users, Trash, PlusCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  status: string;
  createdAt: string;
}

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProjModal, setShowProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState('');

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadProjects();
  }, [workspaceId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.projects.list(workspaceId);
      setProjects(data || []);
    } catch (err) {
      console.error(err);
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
      loadProjects();
    } catch (err: any) {
      setProjError(err.message || 'Lỗi khi tạo dự án.');
    } finally {
      setProjLoading(false);
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
      loadProjects();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa dự án (chỉ Admin của Workspace mới được xóa).');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    setMemberMessage('');
    setMemberLoading(true);

    try {
      await api.workspaces.addMember(workspaceId, memberEmail, memberRole);
      setMemberMessage('Thêm thành viên thành công!');
      setMemberEmail('');
    } catch (err: any) {
      setMemberError(err.message || 'Thêm thành viên thất bại. Chỉ Admin mới có quyền thực hiện.');
    } finally {
      setMemberLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative pb-12 font-sans">
      <div className="absolute top-0 left-0 w-[50%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />

      <Header />

      <div className="max-w-6xl mx-auto px-6 mt-6">
        <Link href="/" className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold">
          <ArrowLeft className="h-4.5 w-4.5" />
          QUAY LẠI DANH SÁCH WORKSPACE
        </Link>
      </div>

      <main className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
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
                  <div className="glass hover:border-primary/40 p-5 rounded-2xl transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between min-h-[140px] relative">
                    <div>
                      <h3 className="font-bold group-hover:text-primary transition-colors text-title">
                        {proj.name}
                      </h3>
                      <p className="text-secondary text-xs mt-2 line-clamp-2">
                        {proj.description || 'Không có mô tả chi tiết.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted mt-4 pt-3 border-t border-border-subtle">
                      <span>Trạng thái: <strong className="text-success">{proj.status}</strong></span>
                      <button
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-muted transition-colors"
                        title="Xóa dự án"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-border">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-2 text-heading">
              <Users className="h-5 w-5 text-primary" />
              Thành viên Workspace
            </h3>
            <p className="text-secondary text-xs mb-6">
              Mời thêm đồng đội tham gia để cùng cộng tác làm việc
            </p>

            {memberError && <div className="ui-alert-error mb-4 text-xs">{memberError}</div>}
            {memberMessage && <div className="ui-alert-success mb-4 text-xs">{memberMessage}</div>}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="ui-label">Email thành viên</label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="ui-input px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="ui-label">Vai trò (Role)</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="ui-input px-4 py-2.5 text-xs"
                >
                  <option value="MEMBER">MEMBER (Có quyền Tạo/Sửa)</option>
                  <option value="VIEWER">VIEWER (Chỉ xem)</option>
                  <option value="ADMIN">ADMIN (Có toàn quyền)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={memberLoading}
                className="ui-btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-primary hover:text-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                {memberLoading ? 'Đang thêm...' : 'Thêm thành viên'}
              </button>
            </form>
          </div>
        </div>
      </main>

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
    </div>
  );
}
