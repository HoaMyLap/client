'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { Plus, Folder, Users, Briefcase } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await api.workspaces.list();
      setWorkspaces(data || []);
    } catch (err) {
      console.error(err);
      localStorage.clear();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      await api.workspaces.create({
        name: newWorkspaceName,
        description: newWorkspaceDesc,
      });
      setShowModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      loadWorkspaces();
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi tạo workspace.');
    } finally {
      setModalLoading(false);
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
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full glow-orb-accent blur-[140px] pointer-events-none" />

      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-12 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-display text-heading">Không gian làm việc</h2>
            <p className="text-secondary text-sm mt-1">
              Chọn hoặc khởi tạo không gian làm việc mới để bắt đầu dự án
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="ui-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Tạo Workspace
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border max-w-md mx-auto mt-16">
            <Briefcase className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-heading">Chưa có Workspace nào</h3>
            <p className="text-secondary text-sm mb-6">
              Bạn cần tạo mới một không gian làm việc đầu tiên để lập dự án quản lý.
            </p>
            <button onClick={() => setShowModal(true)} className="ui-btn-primary px-5 py-2.5 text-sm">
              Tạo ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <Link key={ws.id} href={`/workspace/${ws.id}`}>
                <div className="glass hover:border-primary/40 p-6 rounded-2xl transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-title">
                      {ws.name}
                    </h3>
                    <p className="text-secondary text-sm mt-2 line-clamp-2">
                      {ws.description || 'Không có mô tả.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted mt-6 pt-4 border-t border-border-subtle">
                    <span className="flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5" />
                      Nhấp để xem dự án
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Workspace
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="ui-modal-overlay">
          <div className="w-full max-w-md glass p-8 rounded-2xl relative">
            <h3 className="text-xl font-bold mb-6 font-display text-heading">Tạo Workspace mới</h3>

            {modalError && <div className="ui-alert-error mb-4 text-sm">{modalError}</div>}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="ui-label tracking-wider">Tên Workspace</label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Ví dụ: Team Marketing, Project Alpha..."
                  className="ui-input px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="ui-label tracking-wider">Mô tả chi tiết</label>
                <textarea
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="Tóm tắt mục tiêu hoặc phòng ban tham gia..."
                  rows={3}
                  className="ui-input px-4 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="ui-btn-secondary px-4 py-2 text-sm">
                  Hủy
                </button>
                <button type="submit" disabled={modalLoading} className="ui-btn-primary px-5 py-2 text-sm">
                  {modalLoading ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
