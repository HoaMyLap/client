'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ChatWidget from '@/components/ChatWidget';
import { useLanguage } from '@/lib/i18n';
import { createWorkspaceStompClient } from '@/lib/socket';
import { Client } from '@stomp/stompjs';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, Plus, Folder, Users, Trash, PlusCircle, 
  Pencil, Shield, User, X, CheckCircle2, Activity, BarChart3, Sparkles, Layers,
  FileSpreadsheet, Upload, Download, Bell, AlertTriangle, FolderOpen, FileText, Image as ImageIcon
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
  roleId?: string | null;
  customRoleName?: string | null;
}

interface CustomRole {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  { key: 'WORKSPACE_VIEW', label: 'Xem Workspace', desc: 'Quyền xem thông tin cơ bản của không gian làm việc.' },
  { key: 'WORKSPACE_UPDATE', label: 'Cập nhật Workspace', desc: 'Chỉnh sửa thông tin, đổi tên, đổi ảnh đại diện không gian.' },
  { key: 'WORKSPACE_DELETE', label: 'Xóa Workspace', desc: 'Quyền xóa hoàn toàn không gian làm việc này.' },
  { key: 'WORKSPACE_MEMBER_INVITE', label: 'Mời thành viên', desc: 'Gửi lời mời tham gia không gian làm việc.' },
  { key: 'WORKSPACE_MEMBER_REMOVE', label: 'Xóa thành viên', desc: 'Trục xuất thành viên khỏi không gian làm việc.' },
  { key: 'WORKSPACE_ROLE_MANAGE', label: 'Quản lý vai trò', desc: 'Tạo, sửa, xóa các vai trò tùy chỉnh và phân quyền.' },
  { key: 'PROJECT_CREATE', label: 'Tạo dự án con', desc: 'Tạo mới dự án trực thuộc không gian này.' },
  { key: 'PROJECT_VIEW', label: 'Xem dự án con', desc: 'Xem danh sách và chi tiết các dự án.' },
  { key: 'PROJECT_UPDATE', label: 'Cập nhật dự án', desc: 'Chỉnh sửa thông tin, cấu hình cài đặt của dự án.' },
  { key: 'PROJECT_DELETE', label: 'Xóa dự án', desc: 'Xóa dự án khỏi không gian làm việc.' },
  { key: 'TASK_CREATE', label: 'Tạo công việc', desc: 'Quyền tạo công việc mới trong các dự án.' },
  { key: 'TASK_VIEW', label: 'Xem công việc', desc: 'Xem chi tiết công việc, bình luận và tiến độ.' },
  { key: 'TASK_UPDATE', label: 'Cập nhật công việc', desc: 'Chỉnh sửa, gán người thực hiện, kéo thả trạng thái công việc.' },
  { key: 'TASK_DELETE', label: 'Xóa công việc', desc: 'Xóa hoàn toàn công việc khỏi dự án.' },
  { key: 'TASK_COMMENT_CREATE', label: 'Viết bình luận', desc: 'Thảo luận và gửi bình luận trong công việc.' },
  { key: 'TASK_COMMENT_DELETE', label: 'Xóa bình luận', desc: 'Quyền xóa bình luận (của chính mình hoặc của người khác).' }
];

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const { t, language } = useLanguage();

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceName, setWorkspaceName] = useState<string>('');
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

  // Excel Batch Invite state
  const [inviteMode, setInviteMode] = useState<'SINGLE' | 'EXCEL'>('SINGLE');
  const [excelEmails, setExcelEmails] = useState<string[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  const [pageError, setPageError] = useState('');

  // Workspace Document Explorer states
  const [workspaceActiveTab, setWorkspaceActiveTab] = useState<'projects' | 'documents'>('projects');
  const [docCurrentPath, setDocCurrentPath] = useState<Array<{ id: string; name: string; type: string; projectId?: string }>>([
    { id: 'root', name: 'Kho tài liệu', type: 'root' }
  ]);
  const [docFolders, setDocFolders] = useState<any[]>([]);
  const [docFiles, setDocFiles] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showCreateDocFolderModal, setShowCreateDocFolderModal] = useState(false);
  const [newDocFolderName, setNewDocFolderName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Custom Roles & Permissions state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showRoleMgrModal, setShowRoleMgrModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormPermissions, setRoleFormPermissions] = useState<string[]>([]);
  const [roleFormLoading, setRoleFormLoading] = useState(false);
  const [roleFormError, setRoleFormError] = useState('');

  // Member overrides state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideUser, setOverrideUser] = useState<WorkspaceMember | null>(null);
  const [overridePermissions, setOverridePermissions] = useState<Array<{ permission: string; allowed: boolean; inherited?: boolean }>>([]);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [myOverrides, setMyOverrides] = useState<Array<{ permission: string; allowed: boolean }>>([]);
  
  // Deletion Request Modal state
  const [showDeletionRequestModal, setShowDeletionRequestModal] = useState(false);
  const [deletionRequestProjectId, setDeletionRequestProjectId] = useState<string | null>(null);
  const [deletionRequestReason, setDeletionRequestReason] = useState('');
  const [deletionRequestLoading, setDeletionRequestLoading] = useState(false);

  // Approvals Modal state
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  
  // Custom dialog modal states
  const [dialogConfig, setDialogConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showCustomConfirm = (message: string, onConfirm: () => void) => {
    setDialogConfig({
      show: true,
      title: 'Xác nhận',
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirm();
        setDialogConfig(null);
      },
      onCancel: () => setDialogConfig(null),
    });
  };

  const showCustomAlert = (message: string) => {
    setDialogConfig({
      show: true,
      title: 'Thông báo',
      message,
      type: 'alert',
      onConfirm: () => setDialogConfig(null),
    });
  };

  const stompClientRef = useRef<Client | null>(null);

  const handleSocketMessage = (msg: any) => {
    const { action, payload } = msg;
    if (action === 'ADD_MEMBER') {
      setMembers((prev) => {
        if (prev.some((m) => m.userId === payload.userId)) return prev;
        return [...prev, payload];
      });
    } else if (action === 'REMOVE_MEMBER') {
      setMembers((prev) => prev.filter((m) => m.userId !== payload.userId));
    } else if (action === 'UPDATE_MEMBER') {
      setMembers((prev) =>
        prev.map((m) => (m.userId === payload.userId ? { ...m, role: payload.role } : m))
      );
    }
  };

  useEffect(() => {
    if (workspaceId) {
      const client = createWorkspaceStompClient(workspaceId, handleSocketMessage);
      stompClientRef.current = client;
      return () => {
        if (client) client.deactivate();
      };
    }
  }, [workspaceId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [workspaceId]);

  const fetchWorkspaceDocuments = async () => {
    const currentView = docCurrentPath[docCurrentPath.length - 1];
    setIsLoadingDocs(true);
    try {
      if (currentView.id === 'root') {
        setDocFolders([
          { id: 'workspace_sys', name: 'Tài liệu Workspace', type: 'system_workspace' },
          { id: 'project_sys', name: 'Tài liệu Dự án', type: 'system_project' },
          { id: 'unclassified_sys', name: 'Tài liệu khác (Không phân loại)', type: 'system_unclassified' }
        ]);
        setDocFiles([]);
      } else if (currentView.type === 'system_workspace' || currentView.type === 'workspace_folder') {
        const parentId = currentView.type === 'workspace_folder' ? currentView.id : null;
        const folders = await api.workspaces.getFolders(workspaceId, parentId);
        const files = await api.workspaces.getFiles(workspaceId, parentId);
        setDocFolders(folders.map((f: any) => ({ ...f, type: 'workspace_folder' })));
        setDocFiles(files);
      } else if (currentView.type === 'system_project') {
        const myProjectFolders = projects.map((p: any) => ({
          id: p.id,
          name: `Dự án: ${p.name}`,
          type: 'project_root',
          projectId: p.id
        }));
        setDocFolders(myProjectFolders);
        setDocFiles([]);
      } else if (currentView.type === 'project_root' || currentView.type === 'project_folder') {
        const projectId = currentView.projectId || currentView.id;
        const folderId = currentView.type === 'project_folder' ? currentView.id : null;
        const folders = await api.projects.getFolders(projectId, folderId);
        const files = await api.projects.getFiles(projectId, folderId);
        setDocFolders(folders.map((f: any) => ({ ...f, type: 'project_folder', projectId })));
        setDocFiles(files);
      } else if (currentView.type === 'system_unclassified') {
        const allDocs = await api.workspaces.getAllAccessibleDocuments(workspaceId);
        const taskFilesOnly = allDocs.filter((d: any) => d.source && d.source.includes('Công việc'));
        setDocFolders([]);
        setDocFiles(taskFilesOnly);
      }
    } catch (err) {
      console.error('Failed to load workspace documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (workspaceActiveTab === 'documents') {
      fetchWorkspaceDocuments();
    }
  }, [docCurrentPath, workspaceActiveTab]);

  const handleOpenFolder = (folder: any) => {
    setDocCurrentPath((prev) => [
      ...prev,
      { id: folder.id, name: folder.name, type: folder.type, projectId: folder.projectId }
    ]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    setDocCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleCreateDocFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFolderName.trim()) return;
    const currentView = docCurrentPath[docCurrentPath.length - 1];
    const parentId = currentView.type === 'workspace_folder' ? currentView.id : null;
    try {
      await api.workspaces.createFolder(workspaceId, {
        name: newDocFolderName.trim(),
        parentId
      });
      setNewDocFolderName('');
      setShowCreateDocFolderModal(false);
      fetchWorkspaceDocuments();
      showCustomAlert('Đã tạo thư mục thành công!');
    } catch (err: any) {
      showCustomAlert(err.message || 'Lỗi khi tạo thư mục');
    }
  };

  const handleUploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingDoc(true);
    const currentView = docCurrentPath[docCurrentPath.length - 1];
    const folderId = currentView.type === 'workspace_folder' ? currentView.id : null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.uploadFile(formData);
      
      await api.workspaces.addFile(workspaceId, {
        name: file.name,
        url: uploadRes.url,
        size: file.size,
        type: file.type || 'application/octet-stream',
        folderId
      });
      
      fetchWorkspaceDocuments();
      showCustomAlert('Tải lên tệp thành công!');
    } catch (err: any) {
      showCustomAlert(err.message || 'Lỗi khi tải lên tệp');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocFolder = (folderId: string) => {
    showCustomConfirm('Bạn có chắc chắn muốn xóa thư mục này và TOÀN BỘ nội dung đệ quy bên trong?', async () => {
      try {
        await api.workspaces.deleteFolder(workspaceId, folderId);
        fetchWorkspaceDocuments();
        showCustomAlert('Đã xóa thư mục thành công!');
      } catch (err: any) {
        showCustomAlert(err.message || 'Lỗi khi xóa thư mục');
      }
    });
  };

  const handleDeleteDocFile = (fileId: string) => {
    showCustomConfirm('Bạn có chắc chắn muốn xóa tệp tin này khỏi kho lưu trữ?', async () => {
      try {
        await api.workspaces.deleteFile(workspaceId, fileId);
        fetchWorkspaceDocuments();
        showCustomAlert('Đã xóa tệp tin thành công!');
      } catch (err: any) {
        showCustomAlert(err.message || 'Lỗi khi xóa tệp tin');
      }
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const myId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      const [wsList, projData, memberData, rolesData, myPermOverrides] = await Promise.all([
        api.workspaces.list().catch(() => []),
        api.projects.list(workspaceId),
        api.workspaces.getMembers(workspaceId),
        api.workspaces.getRoles(workspaceId).catch(() => []),
        myId ? api.workspaces.getMemberPermissions(workspaceId, myId).catch(() => []) : Promise.resolve([]),
      ]);
      setProjects(projData || []);
      setMembers(memberData || []);
      setCustomRoles(rolesData || []);
      setMyOverrides((myPermOverrides as any) || []);

      const currentWs = (wsList || []).find((w: any) => w.id === workspaceId);
      if (currentWs) {
        setWorkspaceName(currentWs.name);
      }
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

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const myId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    const myWorkspaceMember = members.find((m) => m.userId === myId);
    const isWorkspaceAdmin = myWorkspaceMember?.role === 'ADMIN';

    if (isWorkspaceAdmin) {
      showCustomConfirm('Bạn có chắc chắn muốn xóa dự án này? Toàn bộ thẻ công việc sẽ bị xóa theo.', async () => {
        try {
          await api.projects.delete(projectId);
          loadData();
        } catch (err: any) {
          showCustomAlert(err.message || 'Lỗi khi xóa dự án.');
        }
      });
    } else {
      setDeletionRequestProjectId(projectId);
      setDeletionRequestReason('');
      setShowDeletionRequestModal(true);
    }
  };

  const handleSubmitDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionRequestProjectId || !deletionRequestReason.trim()) return;

    setDeletionRequestLoading(true);
    try {
      await api.projects.requestDeletion(deletionRequestProjectId, deletionRequestReason.trim());
      setShowDeletionRequestModal(false);
      setDeletionRequestProjectId(null);
      setDeletionRequestReason('');
      showCustomAlert('Đã gửi yêu cầu xóa dự án tới Admin Workspace để phê duyệt.');
      loadData();
    } catch (err: any) {
      showCustomAlert(err.message || 'Lỗi khi gửi yêu cầu xóa dự án.');
    } finally {
      setDeletionRequestLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await api.projects.getDeletionRequests(workspaceId);
      setPendingRequests(data || []);
    } catch (err) {
      console.error('Failed to load pending deletion requests:', err);
    }
  };

  const handleApproveDeletion = async (requestId: string) => {
    showCustomConfirm('Bạn có chắc chắn muốn CHẤP THUẬN xóa dự án này? Thao tác này sẽ xóa vĩnh viễn dự án và không thể khôi phục.', async () => {
      setApprovalsLoading(true);
      try {
        await api.projects.approveDeletion(requestId);
        showCustomAlert('Đã phê duyệt và xóa dự án thành công.');
        await loadPendingRequests();
        loadData();
      } catch (err: any) {
        showCustomAlert(err.message || 'Lỗi khi phê duyệt xóa dự án.');
      } finally {
        setApprovalsLoading(false);
      }
    });
  };

  const handleRejectDeletion = async (requestId: string) => {
    showCustomConfirm('Bạn có chắc chắn muốn TỪ CHỐI yêu cầu xóa dự án này?', async () => {
      setApprovalsLoading(true);
      try {
        await api.projects.rejectDeletion(requestId);
        showCustomAlert('Đã từ chối yêu cầu xóa dự án.');
        await loadPendingRequests();
        loadData();
      } catch (err: any) {
        showCustomAlert(err.message || 'Lỗi khi từ chối yêu cầu.');
      } finally {
        setApprovalsLoading(false);
      }
    });
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const allExtractedEmails: string[] = [];

        // Scan all sheets in the workbook
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Read raw matrix rows to catch every single cell
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          rawRows.forEach((row) => {
            if (Array.isArray(row)) {
              row.forEach((cell) => {
                if (cell) {
                  const cellStr = cell.toString();
                  const matches = cellStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                  if (matches) {
                    allExtractedEmails.push(...matches.map((m: string) => m.trim().toLowerCase()));
                  }
                }
              });
            }
          });
        });

        // Deduplicate emails
        const uniqueEmails = Array.from(new Set(allExtractedEmails));

        if (uniqueEmails.length === 0) {
          setMemberError('Không tìm thấy địa chỉ email hợp lệ trong file Excel vừa tải lên.');
          setExcelEmails([]);
        } else {
          setExcelEmails(uniqueEmails);
          setMemberError('');
        }
      } catch (err: any) {
        setMemberError('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearExcelFile = () => {
    setExcelFileName('');
    setExcelEmails([]);
    setMemberError('');
    if (excelFileInputRef.current) {
      excelFileInputRef.current.value = '';
    }
  };

  const downloadSampleEmailTemplate = () => {
    const sampleData = [
      { 'STT': 1, 'Họ và tên': 'Nguyễn Văn A', 'Email': 'nguyenvana@example.com', 'Ghi chú': 'Trưởng phòng Kinh doanh' },
      { 'STT': 2, 'Họ và tên': 'Trần Thị B', 'Email': 'tranthib@example.com', 'Ghi chú': 'Lập trình viên Senior' },
      { 'STT': 3, 'Họ và tên': 'Lê Văn C', 'Email': 'levanc@example.com', 'Ghi chú': 'Thiết kế UI/UX' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachEmail');
    XLSX.writeFile(workbook, 'Mau_Danh_Sach_Email_Homix.xlsx');
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

      if (inviteMode === 'EXCEL') {
        if (excelEmails.length === 0) {
          throw new Error('Vui lòng tải lên file Excel có chứa email hợp lệ');
        }

        await api.notifications.inviteBatch({
          emails: excelEmails,
          targetType: inviteTargetType,
          targetId: targetId,
          role: memberRole,
        });

        const count = excelEmails.length;
        setExcelEmails([]);
        setShowInviteModal(false);

        setCenterToast({
          title: 'Đã gửi lời mời hàng loạt thành công! 🎉',
          message: `Hệ thống đã gửi lời mời xác nhận tới ${count} địa chỉ email từ file Excel.`,
        });
        setTimeout(() => setCenterToast(null), 4000);
      } else {
        await api.notifications.invite({
          email: memberEmail,
          targetType: inviteTargetType,
          targetId: targetId,
          role: memberRole,
        });

        const invitedEmail = memberEmail;
        setMemberEmail('');
        setShowInviteModal(false);

        setCenterToast({
          title: 'Đã gửi lời mời thành công! 🎉',
          message: `Hệ thống đã gửi lời mời xác nhận tới email "${invitedEmail}". Người dùng sẽ nhận được thông báo để chấp nhận.`,
        });
        setTimeout(() => setCenterToast(null), 4000);
      }
    } catch (err: any) {
      setMemberError(err.message || 'Gửi lời mời thất bại. Chỉ Admin mới có quyền thực hiện.');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRequestLeave = () => {
    showCustomConfirm('Bạn có chắc chắn muốn gửi yêu cầu rời khỏi Workspace này? Yêu cầu sẽ được gửi tới Admin để phê duyệt.', async () => {
      try {
        await api.notifications.requestLeave({ targetType: 'WORKSPACE', targetId: workspaceId });
        showCustomAlert('Yêu cầu rời Workspace đã được gửi thành công tới Admin. Vui lòng chờ phê duyệt.');
      } catch (err: any) {
        showCustomAlert(err.message || 'Không thể gửi yêu cầu rời.');
      }
    });
  };

  const handleRemoveMember = (userId: string, fullname: string) => {
    showCustomConfirm(`Bạn có chắc muốn xóa "${fullname}" khỏi workspace này?`, async () => {
      try {
        await api.workspaces.removeMember(workspaceId, userId);
        loadData();
      } catch (err: any) {
        showCustomAlert(err.message || 'Không thể xóa thành viên (chỉ Admin mới có quyền).');
      }
    });
  };

  const handleChangeMemberRoleWithCustom = async (userId: string, targetValue: string) => {
    try {
      const isCustomRole = !['ADMIN', 'MEMBER', 'VIEWER'].includes(targetValue);
      const updateData = isCustomRole 
        ? { role: 'MEMBER', roleId: targetValue } 
        : { role: targetValue, roleId: null };
      await api.workspaces.updateMemberRole(workspaceId, userId, updateData);
      loadData();
    } catch (err: any) {
      showCustomAlert(err.message || 'Không thể cập nhật vai trò thành viên.');
    }
  };

  const handleSelectRole = (role: CustomRole | null) => {
    setSelectedRole(role);
    if (role) {
      setRoleFormName(role.name);
      setRoleFormDesc(role.description || '');
      setRoleFormPermissions(role.permissions || []);
    } else {
      setRoleFormName('');
      setRoleFormDesc('');
      setRoleFormPermissions([]);
    }
    setRoleFormError('');
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleFormError('');
    setRoleFormLoading(true);
    try {
      const payload = {
        name: roleFormName,
        description: roleFormDesc,
        permissions: roleFormPermissions
      };
      if (selectedRole) {
        await api.workspaces.updateRole(workspaceId, selectedRole.id, payload);
      } else {
        await api.workspaces.createRole(workspaceId, payload);
      }
      loadData();
      handleSelectRole(null);
    } catch (err: any) {
      setRoleFormError(err.message || 'Không thể lưu vai trò.');
    } finally {
      setRoleFormLoading(false);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    showCustomConfirm('Bạn có chắc muốn xóa vai trò này? Các thành viên thuộc vai trò này sẽ trở về vai trò mặc định.', async () => {
      try {
        await api.workspaces.deleteRole(workspaceId, roleId);
        loadData();
        handleSelectRole(null);
      } catch (err: any) {
        showCustomAlert(err.message || 'Không thể xóa vai trò.');
      }
    });
  };

  const handleOpenOverrideModal = async (member: WorkspaceMember) => {
    setOverrideUser(member);
    setShowOverrideModal(true);
    setOverrideLoading(true);
    try {
      const existing = await api.workspaces.getMemberPermissions(workspaceId, member.userId);
      const mapped = ALL_PERMISSIONS.map(p => {
        const found = existing?.find((e: any) => e.permission === p.key);
        return {
          permission: p.key,
          allowed: found ? found.allowed : false,
          inherited: !found
        };
      });
      setOverridePermissions(mapped);
    } catch (err: any) {
      console.error(err);
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleSaveOverrides = async () => {
    if (!overrideUser) return;
    setOverrideLoading(true);
    try {
      const overridesToSave = overridePermissions
        .filter(p => !p.inherited)
        .map(p => ({
          permission: p.permission,
          allowed: p.allowed
        }));
      await api.workspaces.saveMemberPermissions(workspaceId, overrideUser.userId, overridesToSave);
      setShowOverrideModal(false);
      showCustomAlert(`Đã cập nhật quyền chi tiết cho thành viên ${overrideUser.fullname}.`);
      loadData();
    } catch (err: any) {
      showCustomAlert(err.message || 'Không thể lưu quyền chi tiết.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const isAdmin = currentUserMember?.role === 'ADMIN';

  useEffect(() => {
    if (workspaceId && isAdmin) {
      loadPendingRequests();
    }
  }, [workspaceId, isAdmin, members]);

  const checkPermission = (permKey: string): boolean => {
    // 1. Direct overrides take precedence
    const override = myOverrides.find((o) => o.permission === permKey);
    if (override !== undefined) {
      return override.allowed;
    }

    // 2. Look up member role
    if (!currentUserMember) return false;

    // 3. Workspace Admin bypass
    if (currentUserMember.role === 'ADMIN') return true;

    // 4. Custom role look up
    if (currentUserMember.roleId) {
      const customRole = customRoles.find((r) => r.id === currentUserMember.roleId);
      if (customRole) {
        return customRole.permissions?.includes(permKey) || false;
      }
    }

    // 5. Default roles fallback mapping
    if (currentUserMember.role === 'MEMBER') {
      const adminPermissions = [
        'WORKSPACE_UPDATE',
        'WORKSPACE_DELETE',
        'WORKSPACE_ROLE_MANAGE',
        'WORKSPACE_MEMBER_REMOVE',
        'WORKSPACE_MEMBER_INVITE'
      ];
      return !adminPermissions.includes(permKey);
    }

    if (currentUserMember.role === 'VIEWER') {
      const viewerPermissions = [
        'WORKSPACE_VIEW',
        'PROJECT_VIEW',
        'TASK_VIEW'
      ];
      return viewerPermissions.includes(permKey);
    }

    return false;
  };

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
            {t('backToWorkspaceList')}
          </Link>
        </div>

        {/* Hero Header Banner & Stats Overview */}
        <div className="max-w-6xl w-full mx-auto px-6 mt-6">
          <div className="glass p-6 md:p-8 rounded-2xl border border-border relative overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Homix Workspace
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t('activeStatus')}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black font-display text-heading tracking-tight">
                  {t('workspaceDetailsTitle')}
                </h1>
                <p className="text-secondary text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
                  {t('workspaceDetailsDesc')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {checkPermission('PROJECT_CREATE') && (
                  <button
                    onClick={() => setShowProjModal(true)}
                    className="ui-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                    {t('createProject')}
                  </button>
                )}
                {checkPermission('WORKSPACE_MEMBER_INVITE') && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="ui-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Users className="h-4 w-4" />
                    {t('addMember')}
                  </button>
                )}
              </div>
            </div>

            {/* 4 Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border-subtle">
              <div className="bg-surface/50 border border-border p-4 rounded-xl">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('totalProjectsCount')}</span>
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xl font-extrabold text-heading">{projects.length}</div>
                <div className="text-[10px] text-secondary mt-1">
                  {projects.filter(p => p.status === 'COMPLETED').length} {t('completedCount')}
                </div>
              </div>

              <div className="bg-surface/50 border border-border p-4 rounded-xl">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('membersCount')}</span>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-xl font-extrabold text-heading">{members.length}</div>
                <div className="text-[10px] text-secondary mt-1">
                  {members.filter(m => m.role === 'ADMIN').length} {t('adminCount')}
                </div>
              </div>

              <div className="bg-surface/50 border border-border p-4 rounded-xl">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('activityLevel')}</span>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-emerald-400">{t('stableStatus')}</div>
                <div className="text-[9px] text-secondary mt-1">{t('syncedWebSocket')}</div>
              </div>

              <div className="bg-surface/50 border border-border p-4 rounded-xl">
                <div className="flex items-center justify-between text-muted mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('yourRole')}</span>
                  <Shield className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xl font-extrabold text-heading">
                  {isAdmin ? 'ADMIN' : (currentUserMember?.role || 'MEMBER')}
                </div>
                <div className="text-[10px] text-secondary mt-1">{t('systemPermission')}</div>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 w-full">
          {/* Left Column: Projects list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for Workspace Left Column */}
            <div className="flex border-b border-border-subtle/80 gap-6 mb-2">
              <button
                type="button"
                onClick={() => setWorkspaceActiveTab('projects')}
                className={`pb-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 border-0 bg-transparent cursor-pointer ${
                  workspaceActiveTab === 'projects'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-foreground'
                }`}
              >
                <Folder className="h-4.5 w-4.5" />
                Dự án ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceActiveTab('documents')}
                className={`pb-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 border-0 bg-transparent cursor-pointer ${
                  workspaceActiveTab === 'documents'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-foreground'
                }`}
              >
                <FolderOpen className="h-4.5 w-4.5" />
                Kho tài liệu & Thư mục
              </button>
            </div>

            {workspaceActiveTab === 'projects' ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold tracking-tight font-display text-heading flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      Danh sách dự án ({projects.length})
                    </h2>
                    <p className="text-secondary text-xs mt-0.5">
                      {t('selectProjectToTrack')}
                    </p>
                  </div>

                  {checkPermission('PROJECT_CREATE') && (
                    <button onClick={() => setShowProjModal(true)} className="ui-btn-ghost text-xs font-semibold text-primary flex items-center gap-1 hover:underline border-0 bg-transparent cursor-pointer">
                      <Plus className="h-3.5 w-3.5" />
                      {t('create')}
                    </button>
                  )}
                </div>

                {projects.length === 0 ? (
                  <div className="glass rounded-2xl p-12 text-center border border-border">
                    <Folder className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-heading">{t('noProjectYetTitle')}</h3>
                    <p className="text-secondary text-sm mb-6">
                      {t('noProjectYetDesc')}
                    </p>
                    {checkPermission('PROJECT_CREATE') && (
                      <button onClick={() => setShowProjModal(true)} className="ui-btn-primary px-5 py-2.5 text-sm border-0 cursor-pointer rounded-xl">
                        {t('createNewProjectBtn')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((proj) => (
                      <Link key={proj.id} href={`/project/${proj.id}`}>
                        <div className="glass hover:border-primary/50 p-5 rounded-2xl transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between min-h-[170px] relative border border-border shadow-sm hover:shadow-md">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm group-hover:text-primary transition-colors text-title">
                                {proj.name}
                              </h3>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                                proj.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                proj.status === 'ARCHIVED' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                                proj.status === 'DELETION_PENDING' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' :
                                'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                {proj.status === 'COMPLETED' ? t('done') :
                                 proj.status === 'ARCHIVED' ? 'Archived' :
                                 proj.status === 'DELETION_PENDING' ? 'Chờ duyệt xóa ⚠️' :
                                 t('inProgress')}
                              </span>
                            </div>
                            <p className="text-secondary text-xs mt-2 line-clamp-2 leading-relaxed">
                              {proj.description || 'Không có mô tả chi tiết.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted mt-4 pt-3 border-t border-border-subtle">
                            <span>Tạo ngày: {new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>
                            <div className="flex items-center gap-1.5">
                              {checkPermission('PROJECT_UPDATE') && proj.status !== 'DELETION_PENDING' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditProject(e, proj); }}
                                  className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-colors border-0 bg-transparent cursor-pointer"
                                  title="Sửa thông tin dự án"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {checkPermission('PROJECT_DELETE') && proj.status !== 'DELETION_PENDING' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(e, proj.id); }}
                                  className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-muted transition-colors border-0 bg-transparent cursor-pointer"
                                  title="Xóa dự án"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Kho tài liệu & Thư mục explorer
              <div className="glass p-6 rounded-2xl border border-border space-y-6">
                {/* Header / Breadcrumbs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/50 pb-4">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                    {docCurrentPath.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        {idx > 0 && <span className="text-zinc-500">/</span>}
                        <button
                          type="button"
                          onClick={() => handleNavigateBreadcrumb(idx)}
                          className={`hover:text-primary border-0 bg-transparent cursor-pointer font-bold transition-all ${
                            idx === docCurrentPath.length - 1 ? 'text-primary underline' : 'text-zinc-400'
                          }`}
                        >
                          {item.name.replace('📁 ', '')}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Actions (Only in Workspace files folder view) */}
                  {(docCurrentPath[docCurrentPath.length - 1].type === 'system_workspace' ||
                    docCurrentPath[docCurrentPath.length - 1].type === 'workspace_folder') && (
                    <div className="flex items-center gap-2">
                      <label className="ui-btn-secondary px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-primary/5 active:scale-95 transition-all rounded-xl border border-border">
                        <Upload className="h-3.5 w-3.5" />
                        {isUploadingDoc ? 'Đang tải...' : 'Tải lên tệp'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleUploadDocFile}
                          disabled={isUploadingDoc}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCreateDocFolderModal(true)}
                        className="ui-btn-primary px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 hover:scale-102 active:scale-95 transition-all border-0 rounded-xl cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tạo thư mục
                      </button>
                    </div>
                  )}
                </div>

                {isLoadingDocs ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-xs gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary" />
                    Đang tải danh sách tài liệu...
                  </div>
                ) : docFolders.length === 0 && docFiles.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">
                    <FolderOpen className="h-10 w-10 opacity-30 mx-auto mb-3" />
                    Thư mục này hiện tại trống.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Render Folders */}
                    {docFolders.map((folder) => (
                      <div
                        key={folder.id}
                        onDoubleClick={() => handleOpenFolder(folder)}
                        onClick={() => handleOpenFolder(folder)}
                        className="glass border border-border/85 hover:border-primary/40 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder className="h-8 w-8 text-amber-500 shrink-0 fill-amber-500/20" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-heading truncate group-hover:text-primary transition-colors">
                              {folder.name.replace('📁 ', '')}
                            </h4>
                            <p className="text-[10px] text-muted truncate mt-0.5">Thư mục</p>
                          </div>
                        </div>
                        {folder.type === 'workspace_folder' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocFolder(folder.id);
                            }}
                            className="p-1 rounded hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Render Files */}
                    {docFiles.map((file) => {
                      const isImg = file.type && file.type.startsWith('image/');
                      return (
                        <div
                          key={file.id}
                          className="glass border border-border/85 hover:border-primary/40 p-4 rounded-xl flex flex-col justify-between group hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {isImg ? (
                                <ImageIcon className="h-8 w-8 text-indigo-400 shrink-0" />
                              ) : (
                                <FileText className="h-8 w-8 text-blue-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-heading truncate" title={file.name}>
                                  {file.name}
                                </h4>
                                <span className="text-[9px] text-zinc-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-primary/10 text-muted hover:text-primary transition-all"
                                title="Mở tệp/Tải xuống"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                              {file.uploaderId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDocFile(file.id);
                                  }}
                                  className="p-1 rounded hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-[9px] text-muted border-t border-border-subtle/80 mt-3 pt-2 flex items-center justify-between">
                            <span>{new Date(file.uploadedAt || file.createdAt).toLocaleDateString('vi-VN')}</span>
                            {file.source && <span className="text-zinc-500 italic max-w-[120px] truncate">{file.source}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Create Folder Modal */}
                {showCreateDocFolderModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#f4f2f7] dark:bg-[#0e0c14] border border-[#e1dbe9] dark:border-[#221c2e] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-heading">Tạo thư mục mới</h3>
                        <button
                          type="button"
                          onClick={() => setShowCreateDocFolderModal(false)}
                          className="p-1 rounded hover:bg-muted text-muted hover:text-foreground border-0 bg-transparent cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <form onSubmit={handleCreateDocFolder} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted">Tên thư mục</label>
                          <input
                            type="text"
                            required
                            value={newDocFolderName}
                            onChange={(e) => setNewDocFolderName(e.target.value)}
                            placeholder="Nhập tên thư mục..."
                            className="ui-input w-full px-3.5 py-2 text-xs bg-white dark:bg-[#1a1626] border border-[#cbd3e3] dark:border-[#353043] rounded-xl focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateDocFolderModal(false)}
                            className="ui-btn-secondary px-4 py-2 text-xs font-bold rounded-xl border border-border cursor-pointer bg-transparent"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="ui-btn-primary px-4 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer text-white bg-primary"
                          >
                            Tạo thư mục
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Member Management */}
          <div className="space-y-6">
            {isAdmin && pendingRequests.length > 0 && (
              <div className="glass p-6 rounded-2xl border-rose-500/20 bg-rose-500/5 relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-700" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <AlertTriangle className="h-5 w-5 animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-rose-200 tracking-wide font-display">
                      Yêu cầu phê duyệt ({pendingRequests.length})
                    </h3>
                    <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed">
                      Có {pendingRequests.length} dự án đang yêu cầu phê duyệt xóa từ Admin Dự án.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowApprovalsModal(true)}
                      className="mt-3.5 px-4 py-2 w-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-md shadow-rose-900/30 flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                    >
                      Xem danh sách chờ duyệt
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2 text-heading">
                  <Users className="h-5 w-5 text-primary" />
                  {t('membersCount')} ({members.length})
                </h3>
                <button
                  type="button"
                  onClick={handleRequestLeave}
                  className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                  title="Gửi yêu cầu rời Workspace tới Admin"
                >
                  {language === 'vi' ? 'Yêu cầu rời' : 'Request Leave'}
                </button>
              </div>

              {/* Only members with WORKSPACE_MEMBER_INVITE permission can see the Invite Member button */}
              {checkPermission('WORKSPACE_MEMBER_INVITE') ? (
                <button
                  type="button"
                  onClick={() => {
                    setMemberError('');
                    setShowInviteModal(true);
                  }}
                  className="ui-btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-wider mb-6 shadow-md hover:scale-[1.01] transition-transform"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t('inviteMemberModalTitle')}
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-secondary text-center mb-6">
                  {language === 'vi' ? '🔒 Bạn không có quyền mời thành viên mới.' : '🔒 You do not have permission to invite new members.'}
                </div>
              )}

              {/* Members List */}
              <div className="border-t border-border-subtle pt-4 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-heading uppercase tracking-wider">
                    {language === 'vi' ? 'Danh sách thành viên hiện tại' : 'Current Members List'}
                  </h4>
                  {checkPermission('WORKSPACE_ROLE_MANAGE') && (
                    <button
                      onClick={() => setShowRoleMgrModal(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <Layers className="h-3 w-3" />
                      {language === 'vi' ? 'Quản lý vai trò' : 'Manage Roles'}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
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
                        {checkPermission('WORKSPACE_ROLE_MANAGE') ? (
                          <select
                            value={m.roleId || m.role}
                            onChange={(e) => handleChangeMemberRoleWithCustom(m.userId, e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-primary rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <optgroup label="Hệ thống (Default)">
                              <option value="ADMIN">ADMIN</option>
                              <option value="MEMBER">MEMBER</option>
                              <option value="VIEWER">VIEWER</option>
                            </optgroup>
                            {customRoles.length > 0 && (
                              <optgroup label="Tùy chỉnh (Custom Roles)">
                                {customRoles.map((cr) => (
                                  <option key={cr.id} value={cr.id}>{cr.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-850 border border-zinc-700/50 px-2.5 py-1 rounded-lg">
                            {(() => {
                              if (m.roleId) {
                                const cr = customRoles.find((r) => r.id === m.roleId);
                                if (cr) return cr.name;
                              }
                              return m.role;
                            })()}
                          </span>
                        )}
                        
                        {checkPermission('WORKSPACE_ROLE_MANAGE') && (
                          <button
                            onClick={() => handleOpenOverrideModal(m)}
                            className="p-1 rounded text-muted hover:text-primary hover:bg-primary-muted transition-colors cursor-pointer border-0 bg-transparent"
                            title="Cấu hình quyền chi tiết cho thành viên"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </button>
                        )}
                        
                        {checkPermission('WORKSPACE_MEMBER_REMOVE') && (
                          <button
                            onClick={() => handleRemoveMember(m.userId, m.fullname)}
                            className="p-1 rounded text-muted hover:text-error hover:bg-error-muted transition-colors cursor-pointer border-0 bg-transparent"
                            title="Xóa thành viên khỏi workspace"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}
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

        {/* Deletion Request Modal */}
        {showDeletionRequestModal && (
          <div className="ui-modal-overlay">
            <div className="w-full max-w-md glass p-8 rounded-2xl relative">
              <h3 className="text-xl font-bold mb-4 font-display text-heading">Yêu Cầu Xóa Dự Án</h3>
              <p className="text-xs text-muted mb-6">
                Bạn đang gửi yêu cầu xóa dự án này lên Admin Workspace. Dự án sẽ chuyển sang trạng thái chờ duyệt và chỉ bị xóa khi được phê duyệt.
              </p>

              <form onSubmit={handleSubmitDeletionRequest} className="space-y-4">
                <div>
                  <label className="ui-label tracking-wider">Lý do yêu cầu xóa *</label>
                  <textarea
                    required
                    value={deletionRequestReason}
                    onChange={(e) => setDeletionRequestReason(e.target.value)}
                    placeholder="Mô tả lý do bạn muốn xóa dự án này để Admin Workspace phê duyệt..."
                    rows={4}
                    className="ui-input px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => { setShowDeletionRequestModal(false); setDeletionRequestProjectId(null); }} className="ui-btn-secondary px-4 py-2 text-sm">
                    Hủy
                  </button>
                  <button type="submit" disabled={deletionRequestLoading} className="ui-btn-primary px-5 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white border-transparent">
                    {deletionRequestLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
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
                      {t('inviteMemberModalTitle')}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      {t('inviteMemberModalSubtitle')}
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

                {/* Mode Selector: Single vs Excel Batch */}
                <div className="flex rounded-xl bg-surface border border-border p-1">
                  <button
                    type="button"
                    onClick={() => setInviteMode('SINGLE')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      inviteMode === 'SINGLE'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-secondary hover:text-foreground'
                    }`}
                  >
                    {t('singleInviteTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteMode('EXCEL')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      inviteMode === 'EXCEL'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-secondary hover:text-foreground'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> {t('excelInviteTab')}
                  </button>
                </div>

                {/* Target Type Selector */}
                <div>
                  <label className="ui-label text-xs font-semibold mb-1.5 block">{t('inviteJoinType')}</label>
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
                      {t('intoWorkspaceOption')}
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
                      {t('intoProjectOption')}
                    </button>
                  </div>
                </div>

                {/* Project Selector if targetType is PROJECT */}
                {inviteTargetType === 'PROJECT' && (
                  <div>
                    <label className="ui-label text-xs font-semibold mb-1.5 block">{t('selectSpecificProject')}</label>
                    <select
                      required
                      value={inviteProjectId}
                      onChange={(e) => setInviteProjectId(e.target.value)}
                      className="ui-input px-4 py-3 text-xs w-full rounded-xl"
                    >
                      <option value="">{t('selectProjectPlaceholder')}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {inviteMode === 'SINGLE' ? (
                  <div>
                    <label className="ui-label text-xs font-semibold mb-1.5 block">{t('recipientEmailLabel')}</label>
                    <input
                      type="email"
                      required={inviteMode === 'SINGLE'}
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="ui-input px-4 py-3 text-xs w-full rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="ui-label text-xs font-semibold block">{t('uploadExcelEmailLabel')}</label>
                      <button
                        type="button"
                        onClick={downloadSampleEmailTemplate}
                        className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> {language === 'vi' ? 'Tải file mẫu (.xlsx)' : 'Download sample (.xlsx)'}
                      </button>
                    </div>

                    {!excelFileName ? (
                      <div className="border-2 border-dashed border-border hover:border-emerald-500/50 bg-surface/50 p-5 rounded-2xl text-center transition-all">
                        <FileSpreadsheet className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-heading">{t('selectExcelEmailPrompt')}</p>
                        <p className="text-[10px] text-muted mt-1">{t('excelScanNotice')}</p>
                        <input
                          ref={excelFileInputRef}
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleExcelUpload}
                          className="mt-3 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                              <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-heading truncate">{excelFileName}</p>
                              <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                                {t('foundValidEmails')} ({excelEmails.length})
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleClearExcelFile}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold"
                            title="Xóa file"
                          >
                            <Trash className="h-3.5 w-3.5" /> {t('delete')}
                          </button>
                        </div>

                        {excelEmails.length > 0 && (
                          <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-xl bg-background/50 border border-emerald-500/20 text-[11px]">
                            <div className="flex flex-wrap gap-1">
                              {excelEmails.map((email, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                                  {email}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="ui-label text-xs font-semibold mb-1.5 block">{t('permissionRoleLabel')}</label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="ui-input px-4 py-3 text-xs w-full rounded-xl"
                  >
                    <option value="MEMBER">{t('roleMemberOption')}</option>
                    <option value="VIEWER">{t('roleViewerOption')}</option>
                    <option value="ADMIN">{t('roleAdminOption')}</option>
                  </select>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="ui-btn-secondary px-5 py-2.5 text-xs font-semibold"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="ui-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    {memberLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                        {t('sendingBtn')}
                      </>
                    ) : (
                      t('sendInviteNowBtn')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Custom Alert/Confirm Modal Dialog */}
      {dialogConfig && dialogConfig.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-md p-4 animate-fadeIn no-print">
          <div className="bg-card/90 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl w-full max-w-lg rounded-3xl overflow-hidden p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200 text-foreground">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/80 pb-4.5">
              <div className="p-3 bg-primary/15 border border-primary/25 rounded-2xl text-primary shrink-0">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-100 tracking-wide font-display leading-snug">{dialogConfig.title}</h3>
              </div>
            </div>

            {/* Message */}
            <p className="text-sm font-medium text-zinc-200 leading-relaxed bg-surface/60 border border-border/80 p-5 rounded-2xl">
              {dialogConfig.message}
            </p>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              {dialogConfig.type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={dialogConfig.onCancel}
                    className="px-5 py-2.5 rounded-xl border border-border hover:bg-hover text-zinc-300 text-xs font-bold transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={dialogConfig.onConfirm}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold transition-all shadow-lg shadow-primary/25"
                  >
                    Xác nhận
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={dialogConfig.onConfirm}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold transition-all shadow-lg shadow-primary/25"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workspace Custom Roles Management Modal */}
      {showRoleMgrModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-md p-4 animate-fadeIn no-print">
          <div className="bg-card/95 border border-border shadow-2xl backdrop-blur-xl w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-100 tracking-wide font-display">
                    {language === 'vi' ? 'Quản lý Vai trò & Phân quyền' : 'Manage Roles & Permissions'}
                  </h3>
                  <p className="text-secondary text-xs mt-0.5">
                    {language === 'vi' ? 'Thiết lập vai trò tùy chỉnh và phân quyền tương ứng cho các thành viên.' : 'Define custom roles and assign respective permissions to members.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRoleMgrModal(false);
                  handleSelectRole(null);
                }}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Two Panel Layout */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Panel: Roles List */}
              <div className="w-1/3 border-r border-border/80 p-5 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {language === 'vi' ? 'Danh sách vai trò' : 'Roles List'}
                  </span>
                  <button
                    onClick={() => handleSelectRole(null)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Plus className="h-3 w-3" />
                    {language === 'vi' ? 'Thêm mới' : 'Add New'}
                  </button>
                </div>

                <div className="space-y-2">
                  {/* System default roles shown as info cards */}
                  <div className="p-3.5 rounded-2xl bg-surface/30 border border-border/50 text-xs opacity-75">
                    <div className="font-extrabold text-zinc-300">ADMIN (System)</div>
                    <div className="text-[10px] text-muted mt-1">Toàn quyền kiểm soát và quản lý Workspace.</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface/30 border border-border/50 text-xs opacity-75">
                    <div className="font-extrabold text-zinc-300">MEMBER (System)</div>
                    <div className="text-[10px] text-muted mt-1">Tạo/Xem/Cập nhật công việc và dự án được giao.</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface/30 border border-border/50 text-xs opacity-75">
                    <div className="font-extrabold text-zinc-300">VIEWER (System)</div>
                    <div className="text-[10px] text-muted mt-1">Chỉ xem thông tin và nội dung trong Workspace.</div>
                  </div>

                  {customRoles.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRole(r)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedRole?.id === r.id
                          ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                          : 'bg-surface hover:bg-hover border-border text-zinc-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold truncate">{r.name}</div>
                        <div className="text-[10px] text-muted truncate mt-0.5">{r.description || 'Không có mô tả.'}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(r.id);
                        }}
                        className="text-zinc-400 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition-colors"
                        title="Xóa vai trò"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Role Creation / Editing Form */}
              <div className="w-2/3 p-6 flex flex-col min-h-0 overflow-y-auto">
                <h4 className="text-sm font-extrabold text-zinc-100 mb-4 tracking-wide font-display border-b border-border/50 pb-2">
                  {selectedRole 
                    ? (language === 'vi' ? `Chỉnh sửa vai trò: ${selectedRole.name}` : `Edit Role: ${selectedRole.name}`) 
                    : (language === 'vi' ? 'Tạo vai trò tùy chỉnh mới' : 'Create New Custom Role')}
                </h4>

                {roleFormError && <div className="ui-alert-error mb-4 text-xs">{roleFormError}</div>}

                <form onSubmit={handleSaveRole} className="space-y-5 flex-1 flex flex-col">
                  <div className="space-y-4">
                    <div>
                      <label className="ui-label text-xs tracking-wider">Tên vai trò *</label>
                      <input
                        type="text"
                        required
                        value={roleFormName}
                        onChange={(e) => setRoleFormName(e.target.value)}
                        placeholder="Ví dụ: Tech Lead, QA Automation, Product Owner..."
                        className="ui-input text-xs px-4 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="ui-label text-xs tracking-wider">Mô tả vai trò</label>
                      <textarea
                        value={roleFormDesc}
                        onChange={(e) => setRoleFormDesc(e.target.value)}
                        placeholder="Mô tả trách nhiệm hoặc quyền hạn của vai trò này..."
                        className="ui-input text-xs px-4 py-2.5 h-16 min-h-[64px]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-[250px]">
                    <label className="ui-label text-xs tracking-wider mb-2.5">Thiết lập danh sách quyền</label>
                    <div className="border border-border/80 rounded-2xl overflow-hidden flex-1 max-h-[300px] overflow-y-auto p-4 space-y-3.5 bg-surface/40">
                      {ALL_PERMISSIONS.map((perm) => {
                        const isChecked = roleFormPermissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className="flex items-start gap-3 cursor-pointer hover:bg-hover p-2 rounded-xl transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setRoleFormPermissions((prev) =>
                                  isChecked
                                    ? prev.filter((p) => p !== perm.key)
                                    : [...prev, perm.key]
                                );
                              }}
                              className="mt-0.5 accent-primary h-4 w-4"
                            />
                            <div>
                              <div className="text-xs font-bold text-zinc-200">{perm.label}</div>
                              <div className="text-[10px] text-muted mt-0.5">{perm.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border/80">
                    <button
                      type="button"
                      onClick={() => handleSelectRole(null)}
                      className="px-5 py-2.5 rounded-xl border border-border hover:bg-hover text-zinc-300 text-xs font-bold transition-all"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={roleFormLoading}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold transition-all shadow-lg shadow-primary/25"
                    >
                      {roleFormLoading ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                      ) : (
                        language === 'vi' ? 'Lưu vai trò' : 'Save Role'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Custom Permissions Override Modal */}
      {showOverrideModal && overrideUser && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-md p-4 animate-fadeIn no-print">
          <div className="bg-card/95 border border-border shadow-2xl backdrop-blur-xl w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-100 tracking-wide font-display">
                    {language === 'vi' ? `Quyền chi tiết: ${overrideUser.fullname}` : `Detailed Permissions: ${overrideUser.fullname}`}
                  </h3>
                  <p className="text-secondary text-xs mt-0.5">
                    {language === 'vi' ? `Thiết lập quyền tùy chỉnh (Đè/Bổ sung) cho riêng thành viên ${overrideUser.email}.` : `Set custom Allow/Deny overrides specifically for member ${overrideUser.email}.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideUser(null);
                }}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Permissions list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {overrideLoading ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {overridePermissions.map((perm) => {
                    const pDef = ALL_PERMISSIONS.find(ap => ap.key === perm.permission);
                    return (
                      <div
                        key={perm.permission}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-surface/40 hover:bg-surface/60 transition-all text-xs gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-zinc-200">{pDef?.label || perm.permission}</div>
                          <div className="text-[10px] text-muted mt-0.5">{pDef?.desc || ''}</div>
                        </div>

                        {/* Override Tri-State Switch */}
                        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setOverridePermissions(prev =>
                                prev.map(p =>
                                  p.permission === perm.permission
                                    ? { ...p, inherited: true }
                                    : p
                                )
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all ${
                              perm.inherited
                                ? 'bg-zinc-800 text-zinc-300 font-bold'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {language === 'vi' ? 'Kế thừa' : 'Inherit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOverridePermissions(prev =>
                                prev.map(p =>
                                  p.permission === perm.permission
                                    ? { ...p, inherited: false, allowed: true }
                                    : p
                                )
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all ${
                              !perm.inherited && perm.allowed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {language === 'vi' ? 'Cho phép' : 'Allow'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOverridePermissions(prev =>
                                prev.map(p =>
                                  p.permission === perm.permission
                                    ? { ...p, inherited: false, allowed: false }
                                    : p
                                )
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all ${
                              !perm.inherited && !perm.allowed
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {language === 'vi' ? 'Từ chối' : 'Deny'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-border/80 flex justify-end gap-3 bg-surface/20">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideUser(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-border hover:bg-hover text-zinc-300 text-xs font-bold transition-all"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <button
                type="button"
                onClick={handleSaveOverrides}
                disabled={overrideLoading}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold transition-all shadow-lg shadow-primary/25"
              >
                {overrideLoading ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                ) : (
                  language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Deletion Approvals Modal */}
      {showApprovalsModal && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-md p-4 animate-fadeIn no-print">
          <div className="bg-card/95 border border-border shadow-2xl backdrop-blur-xl w-full max-w-xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200 text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-100 tracking-wide font-display">
                    Danh Sách Yêu Cầu Xóa Dự Án
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    Phê duyệt hoặc từ chối các yêu cầu xóa dự án từ các Admin Dự án.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalsModal(false)}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-hover transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted">
                  Không có yêu cầu phê duyệt nào đang chờ xử lý.
                </div>
              ) : (
                pendingRequests.map((req) => {
                  const projName = projects.find(p => p.id === req.projectId)?.name || 'Dự án';
                  const reqName = members.find(m => m.userId === req.requesterId)?.fullname || 'Admin Dự án';
                  return (
                    <div key={req.id} className="p-5 rounded-2xl bg-surface/50 border border-border flex flex-col gap-3.5 relative overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                            Yêu cầu xóa: {projName}
                          </h4>
                          <span className="text-[10px] text-muted mt-0.5 block">
                            Người gửi: <strong className="text-zinc-200">{reqName}</strong> • {new Date(req.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div className="bg-surface/80 border border-border-subtle p-3 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-muted block mb-1">Lý do xóa:</span>
                        <p className="text-xs text-body leading-relaxed whitespace-pre-wrap">
                          {req.reason || 'Không cung cấp lý do.'}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={approvalsLoading}
                          onClick={() => handleRejectDeletion(req.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-hover text-zinc-300 transition-all cursor-pointer"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          disabled={approvalsLoading}
                          onClick={() => handleApproveDeletion(req.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-md shadow-rose-955/30 flex items-center gap-1 border-0 cursor-pointer"
                        >
                          Phê duyệt xóa
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border/80 flex justify-end bg-surface/20">
              <button
                type="button"
                onClick={() => setShowApprovalsModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border hover:bg-hover text-zinc-300 text-xs font-bold transition-all border-0 bg-transparent cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {workspaceId && workspaceName && (
        <ChatWidget
          targetType="WORKSPACE"
          targetId={workspaceId}
          targetName={workspaceName}
          workspaceId={workspaceId}
          isViewer={currentUserMember?.role === 'VIEWER'}
        />
      )}
      </div>
    </div>
  );
}
