'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Briefcase, Folder, ChevronRight, Home, Users, 
  Settings, LogOut, ChevronDown, Plus, LayoutGrid, CheckSquare 
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

export default function Sidebar() {
  const router = useRouter();
  const params = useParams();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const workspaceId = params?.workspaceId as string;
  const projectId = params?.projectId as string;

  useEffect(() => {
    setFullname(localStorage.getItem('fullname') || 'User');
    setEmail(localStorage.getItem('email') || 'user@example.com');
    loadSidebarData();
  }, [workspaceId, projectId]);

  const loadSidebarData = async () => {
    try {
      setLoading(true);
      // Fetch all workspaces
      const wsList = await api.workspaces.list();
      setWorkspaces(wsList || []);

      let activeWsId = workspaceId;

      // If on a project page, fetch project details to get its workspaceId
      if (projectId && !activeWsId) {
        const projDetails = await api.projects.get(projectId);
        if (projDetails) {
          activeWsId = projDetails.workspaceId;
        }
      }

      if (activeWsId) {
        // Find active workspace details
        const foundWs = wsList.find((w: Workspace) => w.id === activeWsId);
        if (foundWs) {
          setCurrentWorkspace(foundWs);
        }
        // Fetch projects inside active workspace
        const projList = await api.projects.list(activeWsId);
        setProjects(projList || []);
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <aside className="w-64 h-screen sticky top-0 bg-header border-r border-border flex flex-col justify-between shrink-0 font-sans z-30 select-none">
      {/* Top Section */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-display font-bold text-base text-primary-foreground">
            S
          </div>
          <span className="font-bold text-sm tracking-tight text-gradient-brand font-display">
            Smart Manager
          </span>
        </div>

        {/* General Navigation Menu */}
        <div className="p-4 space-y-1">
          <Link 
            href="/"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              !workspaceId && !projectId 
                ? 'bg-primary/10 text-primary' 
                : 'text-secondary hover:bg-hover hover:text-primary'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Không gian làm việc</span>
          </Link>
        </div>

        {/* Workspaces Accordion list */}
        <div className="px-4 py-2 flex-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
            <span>Danh sách Workspace</span>
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {workspaces.map((ws) => (
              <Link 
                key={ws.id} 
                href={`/workspace/${ws.id}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  ws.id === workspaceId || (currentWorkspace && currentWorkspace.id === ws.id)
                    ? 'bg-primary/5 text-primary font-bold border border-primary/20'
                    : 'text-secondary hover:bg-hover hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
            {workspaces.length === 0 && !loading && (
              <span className="text-[11px] text-muted px-3 block">Chưa có Workspace</span>
            )}
          </div>

          {/* Sibling Projects list if inside a workspace context */}
          {currentWorkspace && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
                <span>Dự án: {currentWorkspace.name}</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {projects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/project/${proj.id}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                      proj.id === projectId
                        ? 'bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20'
                        : 'text-secondary hover:bg-hover hover:text-primary'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{proj.name}</span>
                  </Link>
                ))}
                {projects.length === 0 && !loading && (
                  <span className="text-[11px] text-muted px-3 block">Chưa có dự án</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Profile Summary Card */}
      <div className="p-4 border-t border-border bg-card/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-8.5 w-8.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
              {fullname ? fullname.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-title truncate">{fullname}</div>
              <div className="text-[10px] text-muted truncate">{email}</div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-error-muted text-error text-xs font-semibold hover:bg-error-muted/30 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
