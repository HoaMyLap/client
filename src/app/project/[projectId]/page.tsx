'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { createStompClient } from '@/lib/socket';
import Sidebar from '@/components/Sidebar';
import { jsonrepair } from 'jsonrepair';
import { 
  ArrowLeft, Plus, MessageSquare, Calendar, 
  Trash, Send, CheckSquare, X, Clock, AlertCircle, User, Sparkles, FileText, Search,
  Printer, TrendingUp, Activity, CheckCircle2, Users, AlertTriangle, Briefcase, Lightbulb,
  History, ListChecks, ChevronRight, Check, Heart, Edit2, CornerDownRight
} from 'lucide-react';
import { Client } from '@stomp/stompjs';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  position: number;
  dueDate: string | null;
  assigneeId: string | null;
  creatorId: string | null;
  projectId: string;
  parentTaskId: string | null;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  parentCommentId?: string | null;
  likedUserIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface Member {
  userId: string;
  email: string;
  fullname: string;
  avatarUrl: string;
  role: string;
}

interface TaskLog {
  id: string;
  taskId: string;
  userId: string | null;
  actionType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export default function ProjectKanbanPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  // WebSocket Client Ref
  const stompClientRef = useRef<Client | null>(null);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // New Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('TODO');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Drawer / Detail state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Edit Task State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editAssigneeId, setEditAssigneeId] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);

  // Drawer Tab
  const [drawerTab, setDrawerTab] = useState<'detail' | 'subtasks' | 'logs' | 'comments'>('detail');
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);

  // Comments Reply & Edit States
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // AI Loading & Modal States
  const [aiSubtaskLoading, setAiSubtaskLoading] = useState(false);
  const [showAiSubtaskModal, setShowAiSubtaskModal] = useState(false);
  const [aiSubtaskSuggestions, setAiSubtaskSuggestions] = useState<Array<{ title: string; selected: boolean }>>([]);
  const [aiSubtaskAdding, setAiSubtaskAdding] = useState(false);
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [aiSummaryContent, setAiSummaryContent] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [isReportStale, setIsReportStale] = useState(true);

  // AI Smart Search States
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<Array<{ task: Task; relevanceScore: number; reason: string }>>([]);
  const [showAiSearchModal, setShowAiSearchModal] = useState(false);
  const [aiSearchError, setAiSearchError] = useState('');

  const handleAiSmartSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setAiSearchLoading(true);
    setAiSearchError('');
    try {
      const results = await api.ai.smartSearch(projectId, aiSearchQuery);
      setAiSearchResults(results || []);
      setShowAiSearchModal(true);
    } catch (err: any) {
      setAiSearchError(err.message || 'Lỗi khi kết nối tới trợ lý AI.');
    } finally {
      setAiSearchLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setCurrentUserId(localStorage.getItem('userId') || '');
    
    // Lấy thông tin dự án
    requestProjectDetails();
    
    // 1. Tải danh sách công việc ban đầu
    loadTasks();

    // 2. Thiết lập kết nối WebSocket Realtime
    const client = createStompClient(projectId, handleSocketMessage);
    stompClientRef.current = client;

    // Clean up kết nối khi rời khỏi trang
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [projectId]);

  // Load comments & subtasks when task is selected
  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditDesc(selectedTask.description || '');
      setEditPriority(selectedTask.priority);
      setEditAssigneeId(selectedTask.assigneeId);
      setDrawerTab('detail');
      
      // Định dạng ngày giờ cho input datetime-local (yyyy-MM-ddThh:mm)
      if (selectedTask.dueDate) {
        try {
          const date = new Date(selectedTask.dueDate);
          const isoStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
          setEditDueDate(isoStr.slice(0, 16));
        } catch (e) {
          setEditDueDate(null);
        }
      } else {
        setEditDueDate(null);
      }
      
      loadTaskDetails(selectedTask.id);
    }
  }, [selectedTask]);

  // Load workspace members when workspaceId is fetched
  useEffect(() => {
    if (workspaceId) {
      api.workspaces.getMembers(workspaceId).then((data) => {
        setMembers(data || []);
      }).catch(console.error);
    }
  }, [workspaceId]);

  const requestProjectDetails = async () => {
    try {
      const proj = await api.projects.get(projectId);
      if (proj && proj.workspaceId) {
        setWorkspaceId(proj.workspaceId);
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.tasks.list(projectId);
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      const [commentData, subtaskData, logData] = await Promise.all([
        api.comments.list(taskId),
        api.tasks.getSubtasks(taskId),
        api.tasks.getLogs(taskId),
      ]);
      setComments(commentData || []);
      setSubtasks(subtaskData || []);
      setTaskLogs(logData || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Xử lý thông điệp gửi về từ WebSocket
  const handleSocketMessage = (msg: any) => {
    const { action, payload, taskId } = msg;
    setIsReportStale(true);

    setTasks((prevTasks) => {
      switch (action) {
        case 'CREATE':
          if (prevTasks.some((t) => t.id === payload.id)) return prevTasks;
          return [...prevTasks, payload];

        case 'UPDATE':
        case 'MOVE':
          return prevTasks.map((t) => (t.id === payload.id ? payload : t));

        case 'DELETE':
          return prevTasks.filter((t) => t.id !== taskId);

        default:
          return prevTasks;
      }
    });

    if (selectedTask && selectedTask.id === taskId) {
      if (action === 'ADD_COMMENT' || action === 'UPDATE_COMMENT' || action === 'LIKE_COMMENT') {
        setComments((prev) => {
          const idx = prev.findIndex((c) => c.id === payload.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = payload;
            return next;
          }
          return [...prev, payload];
        });
      } else if (action === 'DELETE_COMMENT') {
        setComments((prev) => prev.filter((c) => c.id !== payload.id && c.parentCommentId !== payload.id));
      } else if (action === 'CREATE' && payload && payload.parentTaskId === taskId) {
        setSubtasks((prev) => {
          if (prev.some((s) => s.id === payload.id)) return prev;
          return [...prev, payload];
        });
      } else if (action === 'UPDATE' && payload && payload.id === selectedTask.id) {
        setSelectedTask(payload);
      } else if (action === 'DELETE') {
        if (taskId === selectedTask.id) {
          setSelectedTask(null);
        } else {
          setSubtasks((prev) => prev.filter((s) => s.id !== taskId));
        }
      }
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter((t) => t.status === status && !t.parentTaskId)
      .sort((a, b) => a.position - b.position);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError('');
    setTaskLoading(true);

    try {
      await api.tasks.create({
        title: newTaskTitle,
        description: newTaskDesc,
        status: modalStatus,
        priority: newTaskPriority,
        projectId,
      });
      setShowTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
    } catch (err: any) {
      setTaskError(err.message || 'Lỗi khi tạo công việc.');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleUpdateTaskDetails = async (overrides: {
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
  } = {}) => {
    if (!selectedTask) return;
    try {
      const updated = await api.tasks.update({
        ...selectedTask,
        title: overrides.title !== undefined ? overrides.title : editTitle,
        description: overrides.description !== undefined ? overrides.description : editDesc,
        priority: overrides.priority !== undefined ? overrides.priority : editPriority,
        assigneeId: overrides.assigneeId !== undefined ? overrides.assigneeId : (editAssigneeId || null),
        dueDate: overrides.dueDate !== undefined ? overrides.dueDate : (editDueDate ? new Date(editDueDate).toISOString() : null),
      });
      setSelectedTask(updated);
    } catch (err: any) {
      alert(err.message || 'Cập nhật thất bại.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    try {
      await api.tasks.delete(taskId);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa công việc.');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc con này?')) return;
    try {
      await api.tasks.delete(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      if (selectedTask) {
        api.tasks.getLogs(selectedTask.id).then((data) => setTaskLogs(data || []));
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa công việc con.');
    }
  };

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newCommentContent;
    if (!selectedTask || !content.trim()) return;

    try {
      const created = await api.comments.create({
        content: content.trim(),
        taskId: selectedTask.id,
        parentCommentId: parentId,
      });
      if (parentId) {
        setReplyContent('');
        setReplyParentId(null);
      } else {
        setNewCommentContent('');
      }
      setComments((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created];
      });
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi bình luận.');
    }
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    try {
      const updated = await api.comments.update(commentId, editCommentContent.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingCommentId(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật bình luận.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await api.comments.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentCommentId !== commentId));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa bình luận.');
    }
  };

  const handleToggleLikeComment = async (commentId: string) => {
    try {
      const updated = await api.comments.like(commentId);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tương tác bình luận.');
    }
  };

  const handleRequestLeaveProject = async () => {
    if (!confirm('Bạn có chắc chắn muốn gửi yêu cầu rời khỏi dự án này? Yêu cầu sẽ được gửi tới Admin để phê duyệt.')) return;
    try {
      await api.notifications.requestLeave({ targetType: 'PROJECT', targetId: projectId });
      alert('Yêu cầu rời dự án đã được gửi thành công tới Admin. Vui lòng chờ phê duyệt.');
    } catch (err: any) {
      alert(err.message || 'Không thể gửi yêu cầu rời dự án.');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;

    try {
      await api.tasks.create({
        title: newSubtaskTitle,
        projectId,
        parentTaskId: selectedTask.id,
      });
      setNewSubtaskTitle('');
      loadTaskDetails(selectedTask.id);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm công việc con.');
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      const updated = await api.tasks.toggleDone(subtaskId);
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? updated : s)));
      // Refresh logs
      if (selectedTask) {
        api.tasks.getLogs(selectedTask.id).then((data) => setTaskLogs(data || []));
      }
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái.');
    }
  };

  const handleGenerateAiSubtasks = async () => {
    if (!selectedTask) return;
    setAiSubtaskLoading(true);
    try {
      const res = await api.tasks.suggestSubtasks(selectedTask.id);
      const suggestions = (res.suggestions || []).map((t: string) => ({
        title: t,
        selected: true,
      }));
      if (suggestions.length === 0) {
        alert('AI không đưa ra gợi ý nào cho công việc này.');
        return;
      }
      setAiSubtaskSuggestions(suggestions);
      setShowAiSubtaskModal(true);
    } catch (err: any) {
      alert(err.message || 'AI phân rã việc thất bại.');
    } finally {
      setAiSubtaskLoading(false);
    }
  };

  const handleConfirmAddAiSubtasks = async () => {
    if (!selectedTask) return;
    const selectedTitles = aiSubtaskSuggestions
      .filter((s) => s.selected && s.title.trim())
      .map((s) => s.title.trim());

    if (selectedTitles.length === 0) {
      alert('Vui lòng chọn ít nhất 1 subtask để thêm.');
      return;
    }

    setAiSubtaskAdding(true);
    try {
      await api.tasks.batchSubtasks(selectedTask.id, selectedTitles);
      loadTaskDetails(selectedTask.id);
      setShowAiSubtaskModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm danh sách subtask.');
    } finally {
      setAiSubtaskAdding(false);
    }
  };

  const handleFetchAiSummary = async () => {
    if (aiSummaryContent && !isReportStale) {
      setShowAiSummaryModal(true);
      return;
    }
    setAiSummaryLoading(true);
    setShowAiSummaryModal(true);
    setAiSummaryContent('');
    try {
      const data = await api.ai.getSummary(projectId);
      setAiSummaryContent(data.summary || 'Không có hoạt động.');
      setIsReportStale(false);
    } catch (err: any) {
      setAiSummaryContent('Lỗi: ' + (err.message || 'Không thể lấy báo cáo AI.'));
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // --- KÉO THẢ NATIVE HTML5 ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnColumn = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const columnTasks = getTasksByStatus(targetStatus);
    const movedTask = tasks.find((t) => t.id === taskId);
    if (!movedTask) return;

    if (movedTask.status === targetStatus && columnTasks.length > 0 && columnTasks[columnTasks.length - 1].id === taskId) {
      return;
    }

    const prevPosition = columnTasks.length > 0 ? columnTasks[columnTasks.length - 1].position : null;
    
    try {
      await api.tasks.move(taskId, {
        newStatus: targetStatus,
        prevPosition,
        nextPosition: null,
      });
    } catch (err: any) {
      alert(err.message || 'Không thể di chuyển công việc.');
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleDropOnCard = async (e: React.DragEvent, targetStatus: string, targetCardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId || taskId === targetCardId) return;

    const columnTasks = getTasksByStatus(targetStatus);
    const targetIdx = columnTasks.findIndex((t) => t.id === targetCardId);
    if (targetIdx === -1) return;

    const nextPosition = columnTasks[targetIdx].position;
    const prevPosition = targetIdx > 0 ? columnTasks[targetIdx - 1].position : null;

    try {
      await api.tasks.move(taskId, {
        newStatus: targetStatus,
        prevPosition,
        nextPosition,
      });
    } catch (err: any) {
      alert(err.message || 'Không thể di chuyển công việc.');
    } finally {
      setDraggedTaskId(null);
    }
  };

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'ui-badge ui-badge-urgent';
      case 'HIGH': return 'ui-badge ui-badge-high';
      case 'MEDIUM': return 'ui-badge ui-badge-medium';
      default: return 'ui-badge ui-badge-low';
    }
  };

  const getMemberName = (userId: string | null) => {
    if (!userId) return 'Chưa giao';
    const member = members.find(m => m.userId === userId);
    return member ? member.fullname : 'Thành viên';
  };

  const renderCommentItem = (comment: Comment, isReply = false) => {
    const isOwner = comment.userId === currentUserId;
    const liked = comment.likedUserIds?.includes(currentUserId);
    const likesCount = comment.likedUserIds?.length || 0;
    const authorName = getMemberName(comment.userId);

    return (
      <div key={comment.id} className="p-3.5 bg-surface border border-border rounded-xl flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-heading">{authorName}</span>
            <span className="text-[10px] text-muted flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(comment.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </span>
          </div>

          {/* Action icons for owner */}
          {isOwner && editingCommentId !== comment.id && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditCommentContent(comment.content);
                }}
                className="text-muted hover:text-primary p-1 rounded transition-colors"
                title="Chỉnh sửa"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteComment(comment.id)}
                className="text-muted hover:text-error p-1 rounded transition-colors"
                title="Xóa"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content or Inline Edit */}
        {editingCommentId === comment.id ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              value={editCommentContent}
              onChange={(e) => setEditCommentContent(e.target.value)}
              rows={2}
              className="ui-input p-2.5 text-xs resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCommentId(null)}
                className="ui-btn-secondary px-2.5 py-1 text-[11px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditComment(comment.id)}
                className="ui-btn-primary px-3 py-1 text-[11px] font-semibold"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <p className="text-body text-xs leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-4 pt-1.5 border-t border-border-subtle mt-1 text-[11px] text-muted">
          <button
            type="button"
            onClick={() => handleToggleLikeComment(comment.id)}
            className={`flex items-center gap-1 font-semibold transition-colors ${
              liked ? 'text-rose-500' : 'hover:text-foreground'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount > 0 ? likesCount : 'Thích'}</span>
          </button>

          {!isReply && (
            <button
              type="button"
              onClick={() => {
                setReplyParentId(replyParentId === comment.id ? null : comment.id);
                setReplyContent('');
              }}
              className="flex items-center gap-1 font-semibold hover:text-foreground transition-colors"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              <span>Trả lời</span>
            </button>
          )}
        </div>

        {/* Inline Reply Form */}
        {replyParentId === comment.id && (
          <form onSubmit={(e) => handleAddComment(e, comment.id)} className="flex gap-2 pt-2 mt-1">
            <input
              type="text"
              required
              autoFocus
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Trả lời ${authorName}...`}
              className="ui-input flex-1 px-3 py-1.5 text-xs"
            />
            <button type="submit" className="ui-btn-primary px-3 py-1.5 text-xs font-semibold shrink-0">
              Trả lời
            </button>
          </form>
        )}
      </div>
    );
  };

  const columns = [
    { id: 'TODO', title: 'Cần làm (Todo)', color: 'border-violet-500/40 text-violet-400' },
    { id: 'IN_PROGRESS', title: 'Đang làm (In Progress)', color: 'border-cyan-500/40 text-cyan-400' },
    { id: 'DONE', title: 'Đã xong (Done)', color: 'border-emerald-500/40 text-emerald-400' },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full glow-orb-primary blur-[140px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10 overflow-y-auto pb-12">
        <div className="max-w-7xl w-full mx-auto px-6 mt-6 flex flex-col md:flex-row md:items-center justify-between no-print gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors text-xs font-semibold shrink-0">
            <ArrowLeft className="h-4.5 w-4.5" />
            QUAY LẠI DỰ ÁN
          </button>

          {/* AI Smart Search Bar */}
          <div className="flex-1 max-w-2xl mx-0 md:mx-4">
            <div className="glass px-3.5 py-1.5 rounded-xl border border-primary/30 flex items-center gap-2.5 shadow-sm focus-within:border-primary transition-all">
              <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
              <input
                type="text"
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSmartSearch()}
                placeholder="✨ AI Smart Search (VD: task gấp cần làm ngay, việc thuộc thiết kế, công việc chưa phân công...)"
                className="bg-transparent border-none text-xs text-foreground placeholder:text-muted focus:outline-none flex-1 font-sans"
              />
              <button
                onClick={handleAiSmartSearch}
                disabled={aiSearchLoading || !aiSearchQuery.trim()}
                className="ui-btn-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                {aiSearchLoading ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    AI Search
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFetchAiSummary}
              className="flex items-center gap-2 bg-primary-muted hover:bg-primary/25 border border-primary/30 px-4 py-2 rounded-xl text-xs font-semibold text-primary transition-all active:scale-[0.98]"
            >
              <FileText className="h-4 w-4 text-primary animate-pulse" />
              Báo cáo tiến độ AI 📊
            </button>
            <button
              onClick={handleRequestLeaveProject}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-400 transition-all active:scale-[0.98]"
              title="Gửi yêu cầu rời khỏi dự án này tới Admin"
            >
              Yêu cầu rời dự án
            </button>
          </div>
        </div>

      {/* Kanban Board Container */}
      <main className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className="glass p-5 rounded-2xl border border-border min-h-[500px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full bg-current ${col.color}`} />
                  <h3 className="font-bold text-sm font-display">{col.title}</h3>
                  <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-md">
                    {colTasks.length}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setModalStatus(col.id);
                    setShowTaskModal(true);
                  }}
                  className="ui-btn-ghost p-1.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Task list in column */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {colTasks.map((task) => {
                  const childSubtasks = tasks.filter((t) => t.parentTaskId === task.id);
                  const totalSubtasks = childSubtasks.length;
                  const doneSubtasks = childSubtasks.filter((t) => t.status === 'DONE').length;
                  const pendingSubtasks = totalSubtasks - doneSubtasks;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnCard(e, col.id, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className="glass hover:border-primary/30 p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all border border-border hover:scale-[1.01] flex flex-col justify-between min-h-[120px]"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-title line-clamp-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-secondary text-xs mt-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Subtasks summary widget */}
                      {totalSubtasks > 0 && (
                        <div className="mt-3 p-2.5 rounded-lg bg-surface border border-border flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 font-semibold text-heading">
                              <ListChecks className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>Subtasks ({totalSubtasks})</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-[10px]">
                              <span className="text-emerald-400">✓ {doneSubtasks} xong</span>
                              {pendingSubtasks > 0 && (
                                <span className="text-amber-400">⏳ {pendingSubtasks} chưa</span>
                              )}
                            </div>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                              style={{ width: `${Math.round((doneSubtasks / totalSubtasks) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-border-subtle flex flex-col gap-2">
                        {task.assigneeId && (
                          <div className="flex items-center gap-1.5 text-[10px] text-secondary">
                            <User className="h-3 w-3 text-primary" />
                            <span>{getMemberName(task.assigneeId)}</span>
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-[10px] text-secondary">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span>Hạn: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-muted">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            <span>Thảo luận</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="h-32 border border-dashed border-border rounded-xl flex items-center justify-center text-muted text-xs">
                    Kéo thẻ vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg ui-drawer z-50 flex flex-col overflow-hidden bg-card text-foreground shadow-2xl">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-base font-bold font-display text-heading truncate">{selectedTask.title}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${getPriorityBadgeColor(selectedTask.priority)}`}>
                {selectedTask.priority} · {selectedTask.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="p-2 text-secondary hover:text-error hover:bg-error-muted rounded-lg transition-colors"
                title="Xóa công việc"
              >
                <Trash className="h-4 w-4" />
              </button>
              <button onClick={() => setSelectedTask(null)} className="ui-btn-ghost p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border shrink-0 px-2">
            {([
              { id: 'detail', label: 'Chi tiết', icon: <FileText className="h-3.5 w-3.5" /> },
              { id: 'subtasks', label: `Subtasks (${subtasks.length})`, icon: <ListChecks className="h-3.5 w-3.5" /> },
              { id: 'logs', label: 'Lịch sử', icon: <History className="h-3.5 w-3.5" /> },
              { id: 'comments', label: `Thảo luận (${comments.length})`, icon: <MessageSquare className="h-3.5 w-3.5" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDrawerTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  drawerTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-foreground'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ===== TAB: Chi tiết ===== */}
            {drawerTab === 'detail' && (
              <>
                <div>
                  <label className="ui-label">Tiêu đề</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleUpdateTaskDetails()}
                    className="ui-input px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="ui-label">Mô tả công việc</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    onBlur={() => handleUpdateTaskDetails()}
                    rows={3}
                    className="ui-input px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="ui-label">Độ ưu tiên</label>
                    <select
                      value={editPriority}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditPriority(val);
                        handleUpdateTaskDetails({ priority: val });
                      }}
                      className="ui-input px-3 py-2 text-xs"
                    >
                      <option value="LOW">LOW (Thấp)</option>
                      <option value="MEDIUM">MEDIUM (Trung bình)</option>
                      <option value="HIGH">HIGH (Cao)</option>
                      <option value="URGENT">URGENT (Khẩn cấp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="ui-label">Trạng thái</label>
                    <div className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-body capitalize">
                      {selectedTask.status.replace('_', ' ').toLowerCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="ui-label">Người thực hiện</label>
                    <select
                      value={editAssigneeId || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setEditAssigneeId(val);
                        handleUpdateTaskDetails({ assigneeId: val });
                      }}
                      className="ui-input px-3 py-2 text-xs"
                    >
                      <option value="">Chưa phân công</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.fullname}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ui-label">Hạn chót</label>
                    <input
                      type="datetime-local"
                      value={editDueDate || ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setEditDueDate(val);
                        handleUpdateTaskDetails({ dueDate: val ? new Date(val).toISOString() : null });
                      }}
                      className="ui-input px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ===== TAB: Subtasks ===== */}
            {drawerTab === 'subtasks' && (
              <>
                {/* Progress bar */}
                {subtasks.length > 0 && (() => {
                  const doneCount = subtasks.filter((s) => s.status === 'DONE').length;
                  const pct = Math.round((doneCount / subtasks.length) * 100);
                  return (
                    <div className="bg-surface border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-heading">Tiến độ subtasks</span>
                        <span className="text-xs font-bold text-primary">{doneCount}/{subtasks.length} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* AI Generate button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={aiSubtaskLoading}
                    onClick={handleGenerateAiSubtasks}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiSubtaskLoading ? 'Đang tạo...' : 'Gợi ý bằng AI ✨'}
                  </button>
                </div>

                {/* Subtask list with checkboxes */}
                <div className="space-y-2">
                  {subtasks.length === 0 && (
                    <div className="text-center py-8 text-secondary text-xs">
                      <CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted" />
                      Chưa có công việc con nào. Thêm thủ công hoặc dùng AI.
                    </div>
                  )}
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        sub.status === 'DONE'
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-surface border-border hover:border-border-focus'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleSubtask(sub.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          sub.status === 'DONE'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {sub.status === 'DONE' && <Check className="h-3 w-3" />}
                      </button>
                      <span className={`text-xs flex-1 ${
                        sub.status === 'DONE' ? 'line-through text-muted' : 'text-body'
                      }`}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-muted hover:text-error transition-colors p-1 rounded"
                        title="Xóa công việc con"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add subtask form */}
                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Thêm công việc con mới..."
                    className="ui-input flex-1 px-3 py-2 text-xs"
                  />
                  <button type="submit" className="ui-btn-primary px-3 py-2 text-xs">
                    Thêm
                  </button>
                </form>
              </>
            )}

            {/* ===== TAB: Lịch sử hoạt động ===== */}
            {drawerTab === 'logs' && (
              <>
                {taskLogs.length === 0 ? (
                  <div className="text-center py-10 text-secondary text-xs">
                    <History className="h-8 w-8 mx-auto mb-2 text-muted" />
                    Chưa có hoạt động nào được ghi nhận.
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-4">
                      {taskLogs.map((log, idx) => (
                        <div key={log.id} className="flex gap-4 items-start relative">
                          {/* Icon dot */}
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center z-10 ${
                            log.actionType === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' :
                            log.actionType === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                            log.actionType === 'UPDATE_STATUS' ? 'bg-violet-500/20 text-violet-400' :
                            log.actionType.includes('AI') ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {log.actionType === 'CREATE' && <CheckCircle2 className="h-4 w-4" />}
                            {log.actionType === 'DELETE' && <Trash className="h-4 w-4" />}
                            {log.actionType === 'UPDATE_STATUS' && <ChevronRight className="h-4 w-4" />}
                            {log.actionType === 'UPDATE' && <AlertCircle className="h-4 w-4" />}
                            {log.actionType.includes('AI') && <Sparkles className="h-4 w-4" />}
                          </div>
                          {/* Content */}
                          <div className="flex-1 bg-surface border border-border rounded-xl p-3 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-heading">
                                {log.actionType === 'CREATE' && 'Tạo công việc'}
                                {log.actionType === 'DELETE' && 'Xóa công việc'}
                                {log.actionType === 'UPDATE_STATUS' && 'Cập nhật trạng thái'}
                                {log.actionType === 'UPDATE' && 'Chỉnh sửa nội dung'}
                                {log.actionType === 'AI_SUBTASKS_GEN' && 'AI tạo subtask'}
                                {!['CREATE','DELETE','UPDATE_STATUS','UPDATE','AI_SUBTASKS_GEN'].includes(log.actionType) && log.actionType}
                              </span>
                              <span className="text-[10px] text-muted">
                                {new Date(log.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                            {log.actionType === 'UPDATE_STATUS' && log.oldValue && log.newValue && (
                              <div className="flex items-center gap-1.5 mt-1 text-secondary">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px]">{log.oldValue}</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-semibold">{log.newValue}</span>
                              </div>
                            )}
                            {log.newValue && log.actionType !== 'UPDATE_STATUS' && (
                              <p className="text-secondary mt-1">{log.newValue}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== TAB: Thảo luận ===== */}
            {drawerTab === 'comments' && (
              <>
                <div className="space-y-4">
                  {comments.length === 0 && (
                    <div className="text-center py-10 text-secondary text-xs">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted" />
                      Chưa có bình luận nào. Hãy là người đầu tiên trao đổi!
                    </div>
                  )}

                  {comments
                    .filter((c) => !c.parentCommentId)
                    .map((comment) => {
                      const replies = comments.filter((c) => c.parentCommentId === comment.id);
                      return (
                        <div key={comment.id} className="space-y-2">
                          {renderCommentItem(comment)}

                          {/* Nested Replies */}
                          {replies.length > 0 && (
                            <div className="ml-5 pl-3 border-l-2 border-primary/20 space-y-2">
                              {replies.map((reply) => renderCommentItem(reply, true))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <form onSubmit={(e) => handleAddComment(e, null)} className="flex gap-2 pt-3 border-t border-border mt-4">
                  <input
                    type="text"
                    required
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    placeholder="Viết bình luận mới..."
                    className="ui-input flex-1 px-3.5 py-2 text-xs"
                  />
                  <button type="submit" className="ui-btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                    <Send className="h-3.5 w-3.5" />
                    Gửi
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass p-8 rounded-2xl relative">
            <h3 className="text-xl font-bold mb-6 font-display">Tạo Công việc mới</h3>
            
            {taskError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-sm">
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Tiêu đề công việc
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Thiết kế Database, Code API..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Nhập yêu cầu chi tiết của công việc..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Độ ưu tiên
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="LOW">LOW (Thấp)</option>
                  <option value="MEDIUM">MEDIUM (Trung bình)</option>
                  <option value="HIGH">HIGH (Cao)</option>
                  <option value="URGENT">URGENT (Khẩn cấp)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  {taskLoading ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Full Screen Page Overlay (1 trang riêng) */}
      <div 
        id="ai-report-side-panel"
        className={`fixed inset-0 h-screen w-full bg-[#030014] z-50 flex flex-col transition-transform duration-300 ease-in-out ${showAiSummaryModal ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Style tag for print rules */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Force exact colors for background graphics (Doughnut charts, progress bars, column colors) */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide the main app layout completely (no blank spaces) */
            header, main, footer, .no-print {
              display: none !important;
            }
            
            /* Reset body/html styles for print */
            body, html {
              background: #ffffff !important;
              color: #000000 !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* Reset main wrapper styles */
            .min-h-screen {
              background: #ffffff !important;
              height: auto !important;
              min-height: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            /* Make report panel occupy full page naturally */
            #ai-report-side-panel {
              position: relative !important;
              display: block !important;
              width: 100% !important;
              height: auto !important;
              background: #ffffff !important;
              color: #000000 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              transition: none !important;
            }
            
            #ai-report-print-area {
              width: 100% !important;
              max-width: none !important;
              padding: 20px !important;
              margin: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              overflow: visible !important;
            }
            
            /* Force all text inside to be black for printing, keeping backgrounds intact */
            #ai-report-print-area text,
            #ai-report-print-area span,
            #ai-report-print-area h1,
            #ai-report-print-area h2,
            #ai-report-print-area h3,
            #ai-report-print-area h4,
            #ai-report-print-area h5,
            #ai-report-print-area p,
            #ai-report-print-area li,
            #ai-report-print-area strong {
              color: #000000 !important;
              fill: #000000 !important;
            }
            
            /* SVGs line strokes must be visible as black lines */
            #ai-report-print-area svg {
              display: block !important;
              margin: 15px auto !important;
              background: #ffffff !important;
              border: none !important;
            }
            
            #ai-report-print-area line,
            #ai-report-print-area polyline,
            #ai-report-print-area polygon,
            #ai-report-print-area path,
            #ai-report-print-area circle {
              stroke: #000000 !important;
            }
            
            #ai-report-print-area polygon {
              fill: rgba(139, 92, 246, 0.1) !important;
            }
            
            /* Remove glassmorphism styling during print */
            #ai-report-print-area .glass {
              background: #ffffff !important;
              border: 1px solid #d4d4d8 !important;
              color: #000000 !important;
              box-shadow: none !important;
            }
          }
        ` }} />

        {/* Full Page Header */}
        <div className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md no-print">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => setShowAiSummaryModal(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại Dự án
            </button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
              <h3 className="font-bold text-zinc-100 text-base font-display">Báo cáo & Dashboard tiến độ AI</h3>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={aiSummaryLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-md shadow-violet-600/10"
            >
              <Printer className="h-4 w-4" />
              In PDF
            </button>
          </div>
        </div>

        {/* Full Page Body container */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div id="ai-report-print-area" className="max-w-4xl mx-auto w-full p-6 md:py-10">
            {aiSummaryLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 no-print">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
                <span className="text-xs text-zinc-500">AI đang lập báo cáo và dựng biểu đồ...</span>
              </div>
            ) : (
              <>
                {/* Print Only Header (Visible during PDF Export) */}
                <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b border-zinc-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-black text-white text-lg">
                      H
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-wider text-black">HOMIX v2.0</h2>
                      <p className="text-[10px] text-zinc-600 font-semibold">Hệ thống Quản lý Dự án & Tiến độ Thông minh</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-base font-black text-black uppercase">BÁO CÁO NGHIỆM THU DỰ ÁN</h1>
                    <p className="text-[10px] text-zinc-600">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                {/* Hero Cover Header */}
                <div className="mb-10 p-8 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/60 shadow-xl relative overflow-hidden no-print">
                  {/* Background glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                      <span className="text-[10px] font-bold text-violet-400 tracking-widest uppercase">
                        Báo cáo tiến độ phân tích bởi AI
                      </span>
                      <h1 className="text-2xl font-black text-zinc-100 tracking-tight mt-1 font-display uppercase">
                        BÁO CÁO NGHIỆM THU DỰ ÁN
                      </h1>
                      <p className="text-xs text-zinc-400 mt-1">
                        Chủ nhiệm: Ngô Hòa My • Ngày lập: {new Date().toLocaleDateString('vi-VN')} • Hệ thống Homix v2.0
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-400">Dự án Hoạt động</span>
                    </div>
                  </div>
                  
                  {/* 4 Cards Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">Tỷ lệ hoàn thành</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                      {(() => {
                        const total = tasks.length;
                        const done = tasks.filter(t => t.status === 'DONE').length;
                        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <>
                            <div className="text-lg font-bold text-zinc-100 mt-1.5">{rate}%</div>
                            <div className="w-full bg-zinc-850 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">Tổng số công việc</span>
                        <Briefcase className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="text-lg font-bold text-zinc-100 mt-1.5">{tasks.length}</div>
                      <div className="text-[9px] text-zinc-500 mt-2">
                        Done: {tasks.filter(t => t.status === 'DONE').length} • Todo: {tasks.filter(t => t.status === 'TODO').length}
                      </div>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">Thành viên tham gia</span>
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-lg font-bold text-zinc-100 mt-1.5">{members.length}</div>
                      <div className="text-[9px] text-zinc-500 mt-2">Nhân sự tham gia dự án</div>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">Mức độ hoạt động</span>
                        <Activity className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="text-lg font-bold text-zinc-100 mt-1.5">Ổn định</div>
                      <div className="text-[9px] text-zinc-500 mt-2">Phân tích logs 24h qua</div>
                    </div>
                  </div>
                </div>

                <AiReportRenderer content={aiSummaryContent} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Search Results Modal */}
      {showAiSearchModal && (
        <div className="ui-modal-overlay bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl relative max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-heading">
                    Kết quả AI Tìm kiếm Thông minh
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Truy vấn: <span className="font-semibold text-primary">"{aiSearchQuery}"</span> · {aiSearchResults.length} công việc trùng khớp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiSearchModal(false)}
                className="ui-btn-ghost p-2 rounded-xl text-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error message */}
            {aiSearchError && (
              <div className="mx-6 mt-4 ui-alert-error text-xs">{aiSearchError}</div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              {aiSearchResults.length === 0 ? (
                <div className="text-center py-12 text-muted text-xs bg-surface/40 rounded-xl border border-border">
                  <Sparkles className="h-10 w-10 text-muted mx-auto mb-3" />
                  Không tìm thấy công việc nào phù hợp với yêu cầu tìm kiếm của bạn.
                </div>
              ) : (
                aiSearchResults.map((res, idx) => {
                  const childSubtasks = tasks.filter((t) => t.parentTaskId === res.task.id);
                  const totalSubtasks = childSubtasks.length;
                  const doneSubtasks = childSubtasks.filter((t) => t.status === 'DONE').length;
                  const pendingSubtasks = totalSubtasks - doneSubtasks;

                  return (
                    <div
                      key={res.task.id || idx}
                      onClick={() => {
                        setSelectedTask(res.task);
                        setShowAiSearchModal(false);
                      }}
                      className="bg-surface hover:bg-hover border border-border hover:border-primary/40 p-4.5 rounded-xl cursor-pointer transition-all flex flex-col gap-2.5 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-sm text-title">
                          {res.task.title}
                        </h4>
                        <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          {(res.relevanceScore * 100).toFixed(0)}% Phù hợp
                        </span>
                      </div>

                      {/* AI Reasoning pill */}
                      <div className="text-xs bg-primary/10 border border-primary/25 p-3 rounded-xl text-primary font-medium flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span className="leading-relaxed">{res.reason}</span>
                      </div>

                      {/* Subtasks summary widget */}
                      {totalSubtasks > 0 && (
                        <div className="p-2.5 rounded-lg bg-surface-elevated border border-border flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 font-semibold text-heading">
                              <ListChecks className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>Subtasks ({totalSubtasks})</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-[10px]">
                              <span className="text-emerald-400">✓ {doneSubtasks} xong</span>
                              {pendingSubtasks > 0 && (
                                <span className="text-amber-400">⏳ {pendingSubtasks} chưa</span>
                              )}
                            </div>
                          </div>

                          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                              style={{ width: `${Math.round((doneSubtasks / totalSubtasks) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted pt-2.5 border-t border-border-subtle mt-0.5">
                        <span>Trạng thái: <strong className="text-foreground">{res.task.status}</strong> · Ưu tiên: <strong className="text-foreground">{res.task.priority}</strong></span>
                        {res.task.dueDate && (
                          <span>Hạn: {new Date(res.task.dueDate).toLocaleDateString('vi-VN')}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Subtask Confirmation Modal */}
      {showAiSubtaskModal && (
        <div className="ui-modal-overlay bg-black/80 backdrop-blur-md z-[60]">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl relative max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-heading">
                    Xác nhận Subtasks gợi ý từ AI
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Chọn các bước công việc bạn muốn tự động thêm vào task:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiSubtaskModal(false)}
                className="ui-btn-ghost p-2 rounded-xl text-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List Control */}
            <div className="px-6 py-3 flex items-center justify-between text-xs border-b border-border-subtle shrink-0 bg-surface/30">
              <span className="font-semibold text-secondary">
                Đã chọn: <strong className="text-primary">{aiSubtaskSuggestions.filter(s => s.selected).length}/{aiSubtaskSuggestions.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const allSelected = aiSubtaskSuggestions.every(s => s.selected);
                  setAiSubtaskSuggestions(prev => prev.map(s => ({ ...s, selected: !allSelected })));
                }}
                className="text-xs text-primary hover:underline font-semibold"
              >
                {aiSubtaskSuggestions.every(s => s.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {/* Subtask Suggestions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
              {aiSubtaskSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    item.selected
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-surface/50 border-border text-muted opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAiSubtaskSuggestions(prev => prev.map((s, i) => i === idx ? { ...s, selected: checked } : s));
                    }}
                    className="w-4.5 h-4.5 rounded accent-primary cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAiSubtaskSuggestions(prev => prev.map((s, i) => i === idx ? { ...s, title: val } : s));
                    }}
                    className="bg-transparent border-none text-xs font-medium text-foreground focus:outline-none flex-1 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAiSubtaskSuggestions(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="text-muted hover:text-error transition-colors p-1 rounded"
                    title="Xóa gợi ý này"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-border bg-surface/50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAiSubtaskModal(false)}
                className="ui-btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={aiSubtaskAdding || aiSubtaskSuggestions.filter(s => s.selected).length === 0}
                onClick={handleConfirmAddAiSubtasks}
                className="ui-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2"
              >
                {aiSubtaskAdding ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Xác nhận thêm {aiSubtaskSuggestions.filter(s => s.selected).length} Subtasks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ============================================================================
// AI REPORT PARSER & CHARTS RENDERER COMPONENTS (NATIVE SVG & CSS)
// ============================================================================

interface ChartConfig {
  title: string;
  chartType: 'doughnut' | 'pie' | 'line' | 'horizontalBar' | 'stackedBar' | 'radar' | 'bar';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
  insight: string;
}

interface ReportSection {
  title: string;
  content: string;
  chart: ChartConfig | null;
}

/**
 * parseAiReport: Dùng thư viện jsonrepair để sửa JSON do AI sinh ra.
 * jsonrepair xử lý toàn bộ edge-cases: embedded newlines, unescaped quotes,
 * trailing commas, single quotes, missing brackets, v.v.
 */
function parseAiReport(content: string): { sections: ReportSection[]; rawText: string } {
  let cleaned = content.trim();
  
  // Xóa bỏ markdown code block nếu có
  if (cleaned.startsWith('```')) {
    const firstLineBreak = cleaned.indexOf('\n');
    const lastBackticks = cleaned.lastIndexOf('```');
    if (firstLineBreak !== -1 && lastBackticks > firstLineBreak) {
      cleaned = cleaned.substring(firstLineBreak + 1, lastBackticks).trim();
    }
  }
  if (cleaned.startsWith('json')) {
    cleaned = cleaned.substring(4).trim();
  }

  const jsonStart = cleaned.indexOf('[');
  const jsonEnd = cleaned.lastIndexOf(']');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const rawJson = cleaned.substring(jsonStart, jsonEnd + 1);
    try {
      // Bước 1: thử parse trực tiếp (nếu AI đã sinh ra JSON hợp lệ)
      const sections = JSON.parse(rawJson);
      return { sections, rawText: '' };
    } catch {
      // Bước 2: dùng jsonrepair để sửa JSON lỗi
      try {
        const repaired = jsonrepair(rawJson);
        const sections = JSON.parse(repaired);
        return { sections, rawText: '' };
      } catch (e2) {
        console.error('jsonrepair also failed:', e2);
      }
    }
  }
  
  // Fallback: hiển thị văn bản thô
  return { sections: [], rawText: content };
}


const getSectionIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('tiến độ') || lower.includes('tổng quan') || lower.includes('hoàn thành') || lower.includes('completion') || lower.includes('timeline') || lower.includes('burndown') || lower.includes('status')) {
    return <TrendingUp className="h-4.5 w-4.5 text-violet-400 shrink-0" />;
  }
  if (lower.includes('thành viên') || lower.includes('nhân sự') || lower.includes('member') || lower.includes('team') || lower.includes('productivity') || lower.includes('phân bổ') || lower.includes('workload')) {
    return <Users className="h-4.5 w-4.5 text-blue-400 shrink-0" />;
  }
  if (lower.includes('hoạt động') || lower.includes('logs') || lower.includes('nhật ký') || lower.includes('24h') || lower.includes('distribution') || lower.includes('day')) {
    return <Activity className="h-4.5 w-4.5 text-amber-400 shrink-0" />;
  }
  if (lower.includes('rủi ro') || lower.includes('đề xuất') || lower.includes('cải tiến') || lower.includes('risk') || lower.includes('bug') || lower.includes('severity')) {
    return <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0" />;
  }
  return <FileText className="h-4.5 w-4.5 text-zinc-400 shrink-0" />;
};

const AiReportRenderer = ({ content }: { content: string }) => {
  const { sections, rawText } = parseAiReport(content);

  if (rawText) {
    return (
      <div className="prose prose-invert max-w-none text-zinc-300">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-4 border-b border-zinc-800 pb-2">
          BÁO CÁO TỔNG QUAN
        </h4>
        <div className="text-zinc-300 font-sans">{renderCleanMarkdown(rawText)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sections.map((section, idx) => {
        const hasChart = !!section.chart && section.chart.chartType;
        return (
          <div key={idx} className="border-b border-zinc-900 pb-8 last:border-0 last:pb-0">
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-zinc-900 pb-3">
              {getSectionIcon(section.title)}
              {section.title}
            </h4>
            
            <div className="text-sm text-zinc-300 leading-relaxed font-sans max-w-none">
              {renderCleanMarkdown(section.content)}
            </div>
            
            {hasChart && (
              /* Khung Biểu đồ lồng ghép nằm bên dưới */
              <div className="w-full max-w-2xl mx-auto glass p-6 rounded-xl border border-zinc-800 bg-zinc-950/20 flex flex-col justify-between gap-4 shadow-lg shadow-black/40 mt-6 mb-2">
                <div>
                  <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-wide mb-4 flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                    <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
                    {section.chart!.title}
                  </h5>
                  <div className="flex items-center justify-center min-h-[220px] py-2 w-full">
                    {section.chart!.chartType === 'doughnut' || section.chart!.chartType === 'pie' ? (
                      <DoughnutChart config={section.chart!} />
                    ) : section.chart!.chartType === 'line' ? (
                      <LineChart config={section.chart!} />
                    ) : section.chart!.chartType === 'bar' ? (
                      <BarChart config={section.chart!} />
                    ) : section.chart!.chartType === 'horizontalBar' ? (
                      <HorizontalBarChart config={section.chart!} />
                    ) : section.chart!.chartType === 'stackedBar' ? (
                      <StackedBarChart config={section.chart!} />
                    ) : section.chart!.chartType === 'radar' ? (
                      <RadarChart config={section.chart!} />
                    ) : (
                      <div className="text-xs text-zinc-500">Biểu đồ không được hỗ trợ</div>
                    )}
                  </div>
                </div>
                {section.chart!.insight && (
                  <div className="text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/60 flex items-start gap-2 leading-normal">
                    <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-300">Nhận xét:</span> {section.chart!.insight}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const colors = ["var(--chart-1, #8b5cf6)", "var(--chart-2, #3b82f6)", "var(--chart-3, #10b981)", "var(--chart-4, #f59e0b)", "var(--chart-5, #ef4444)", "var(--chart-6, #ec4899)", "var(--chart-7, #6366f1)", "var(--chart-8, #14b8a6)"];

const DoughnutChart = ({ config }: { config: ChartConfig }) => {
  const data = config.datasets[0]?.data || [];
  const total = data.reduce((a, b) => a + b, 0);
  let current = 0;
  
  const gradientParts = data.map((val, idx) => {
    const percent = total > 0 ? (val / total) * 100 : 0;
    const start = current;
    current += percent;
    return `${colors[idx % colors.length]} ${start}% ${current}%`;
  });
  
  const backgroundStyle = {
    background: gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(', ')})` : '#3f3f46'
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center justify-center relative w-36 h-36 rounded-full shadow-lg shadow-black/40" style={backgroundStyle}>
        {config.chartType === 'doughnut' && (
          <div className="absolute w-24 h-24 bg-zinc-950 rounded-full flex flex-col items-center justify-center">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Tổng</span>
            <span className="text-sm font-bold text-white">{total}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] w-full border-t border-zinc-900 pt-3">
        {config.labels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span className="truncate">{label}: <strong className="text-zinc-200">{data[idx]}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ config }: { config: ChartConfig }) => {
  const data = config.datasets[0]?.data || [];
  const labels = config.labels || [];
  if (data.length === 0) return <div className="text-xs text-zinc-600">Không có dữ liệu</div>;
  
  const maxVal = Math.max(...data, 1);
  const width = 500;
  const height = 200;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const points = data.map((val, idx) => {
    const x = paddingLeft + (idx * chartWidth) / (data.length - 1 || 1);
    const y = paddingTop + chartHeight - (val * chartHeight) / maxVal;
    return { x, y, val, label: labels[idx] };
  });
  
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = [
    `${paddingLeft},${paddingTop + chartHeight}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${paddingLeft + chartWidth},${paddingTop + chartHeight}`
  ].join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        <defs>
          <linearGradient id={`areaGrad-${config.title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
          </linearGradient>
        </defs>
        
        {/* Lưới ngang */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const y = paddingTop + (idx * chartHeight) / 3;
          const val = Math.round(maxVal - (idx * maxVal) / 3);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} fill="#71717a" fontSize="10" textAnchor="end">{val}</text>
            </g>
          );
        })}
        
        {/* Vùng phủ Gradient */}
        <polygon points={areaPoints} fill={`url(#areaGrad-${config.title.replace(/\s+/g, '')})`} />
        
        {/* Đường biểu đồ */}
        <polyline fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />
        
        {/* Nút điểm trị */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#a78bfa" stroke="#09090b" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 8} fill="#a78bfa" fontSize="9" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {p.val}
            </text>
            <title>{`${p.label}: ${p.val}`}</title>
          </g>
        ))}
        
        {/* Nhãn X */}
        {points.map((p, idx) => (
          <text key={idx} x={p.x} y={height - 8} fill="#71717a" fontSize="9" textAnchor="middle">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

const BarChart = ({ config }: { config: ChartConfig }) => {
  const data = config.datasets[0]?.data || [];
  const labels = config.labels || [];
  const maxVal = Math.max(...data, 1);
  
  return (
    <div className="w-full flex items-end justify-between h-56 pt-6 px-2 border-b border-zinc-800/80">
      {data.map((val, idx) => {
        const heightPct = (val / maxVal) * 100;
        return (
          <div key={idx} className="flex flex-col items-center flex-1 group gap-2 h-full justify-end">
            <span className="text-[9px] text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              {val}
            </span>
            <div 
              style={{ height: `${Math.max(heightPct, 5)}%` }} 
              className="w-6 bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-sm group-hover:from-violet-500 group-hover:to-indigo-400 transition-all shadow-md shadow-violet-500/10 cursor-pointer"
            />
            <span className="text-[9px] text-zinc-500 truncate max-w-[50px] mt-1 h-3 text-center">
              {labels[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const HorizontalBarChart = ({ config }: { config: ChartConfig }) => {
  const data = config.datasets[0]?.data || [];
  const labels = config.labels || [];
  const maxVal = Math.max(...data, 1);
  
  return (
    <div className="w-full space-y-2.5">
      {data.map((val, idx) => {
        const widthPct = (val / maxVal) * 100;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span className="truncate max-w-[70%] font-medium">{labels[idx]}</span>
              <span className="font-semibold text-zinc-300">{val}</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800/50">
              <div 
                style={{ width: `${widthPct}%` }}
                className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StackedBarChart = ({ config }: { config: ChartConfig }) => {
  const data = config.datasets[0]?.data || [];
  const labels = config.labels || [];
  const total = data.reduce((a, b) => a + b, 0);
  const colorsList = ["var(--chart-5, #ef4444)", "var(--chart-4, #f59e0b)", "var(--chart-2, #3b82f6)", "var(--chart-3, #10b981)", "var(--chart-1, #8b5cf6)", "var(--chart-7, #6366f1)"];
  
  return (
    <div className="w-full space-y-4">
      <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden flex border border-zinc-800">
        {data.map((val, idx) => {
          const widthPct = total > 0 ? (val / total) * 100 : 0;
          if (widthPct === 0) return null;
          return (
            <div 
              key={idx}
              style={{ 
                width: `${widthPct}%`,
                backgroundColor: colorsList[idx % colorsList.length] 
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all cursor-pointer"
            >
              <title>{`${labels[idx]}: ${val}`}</title>
            </div>
          );
        })}
      </div>
      
      {/* Chú thích */}
      <div className="grid grid-cols-2 gap-2 text-[10px] w-full border-t border-zinc-900 pt-3">
        {labels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorsList[idx % colorsList.length] }} />
            <span className="truncate">{label}: <strong className="text-zinc-200">{data[idx]}</strong> ({total > 0 ? Math.round((data[idx] / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RadarChart = ({ config }: { config: ChartConfig }) => {
  const data = config.datasets[0]?.data || [];
  const labels = config.labels || [];
  if (data.length === 0) return <div className="text-xs text-zinc-600">Không có dữ liệu</div>;
  
  const maxVal = Math.max(...data, 1);
  const cx = 100;
  const cy = 80;
  const r = 50;
  const numPoints = data.length;
  
  const gridPoints = Array.from({ length: numPoints }).map((_, idx) => {
    const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, label: labels[idx] };
  });

  const gridPolygon = gridPoints.map(p => `${p.x},${p.y}`).join(' ');

  const gridPolygonMid = Array.from({ length: numPoints }).map((_, idx) => {
    const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
    const x = cx + (r * 0.5) * Math.cos(angle);
    const y = cy + (r * 0.5) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
  
  const valuePoints = data.map((val, idx) => {
    const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
    const valR = (val / maxVal) * r;
    const x = cx + valR * Math.cos(angle);
    const y = cy + valR * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 200 160" className="w-full h-56">
        {/* Mạng nhện lưới */}
        <polygon points={gridPolygon} fill="none" stroke="#1f2937" strokeWidth="1" />
        <polygon points={gridPolygonMid} fill="none" stroke="#1f2937" strokeWidth="1" />
        
        {/* Trục liên kết */}
        {gridPoints.map((p, idx) => (
          <line key={idx} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1f2937" strokeWidth="1" />
        ))}

        {/* Vùng dữ liệu */}
        <polygon points={valuePoints} fill="rgba(139, 92, 246, 0.25)" stroke="#8b5cf6" strokeWidth="1.5" />
        
        {/* Điểm nút trị số */}
        {data.map((val, idx) => {
          const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
          const valR = (val / maxVal) * r;
          const x = cx + valR * Math.cos(angle);
          const y = cy + valR * Math.sin(angle);
          return (
            <circle key={idx} cx={x} cy={y} r="2.5" fill="#a78bfa" />
          );
        })}

        {/* Nhãn trục */}
        {gridPoints.map((p, idx) => {
          const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
          const lx = cx + (r + 15) * Math.cos(angle);
          const ly = cy + (r + 6) * Math.sin(angle) + 2;
          return (
            <text key={idx} x={lx} y={ly} fill="#71717a" fontSize="7" textAnchor="middle">
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// ============================================================================
// TYPOGRAPHY CLEANER (STRIPS ** OR ## AND OUTPUTS PURE POLISHED JSX)
// ============================================================================

const parseBoldText = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} className="font-semibold text-white">{part}</strong>;
    }
    return part;
  });
};

const renderCleanMarkdown = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  
  const flushList = (key: string | number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-300">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    let trimmed = line.trim();
    
    // Xử lý các tiêu đề Heading
    if (trimmed.startsWith('# ')) {
      flushList(idx);
      const cleanText = parseBoldText(trimmed.substring(2).replace(/[#*`~_]/g, '').trim());
      elements.push(<h1 key={idx} className="text-xl font-bold text-white mt-6 mb-3">{cleanText}</h1>);
    } else if (trimmed.startsWith('## ')) {
      flushList(idx);
      const cleanText = parseBoldText(trimmed.substring(3).replace(/[#*`~_]/g, '').trim());
      elements.push(<h2 key={idx} className="text-base font-bold text-violet-400 mt-5 mb-3">{cleanText}</h2>);
    } else if (trimmed.startsWith('### ')) {
      flushList(idx);
      const cleanText = parseBoldText(trimmed.substring(4).replace(/[#*`~_]/g, '').trim());
      elements.push(<h3 key={idx} className="text-sm font-bold text-zinc-200 mt-4 mb-2">{cleanText}</h3>);
    }
    // Xử lý danh sách gạch đầu dòng
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const cleanText = parseBoldText(trimmed.substring(2).replace(/[-*`~_]/g, '').trim());
      listItems.push(<li key={`li-${idx}`} className="text-sm leading-relaxed">{cleanText}</li>);
    }
    // Xử lý văn bản thường
    else if (trimmed.length > 0) {
      flushList(idx);
      if (trimmed.startsWith('===') || trimmed.startsWith('---')) {
        elements.push(<hr key={idx} className="border-zinc-800 my-4" />);
      } else {
        const cleanText = parseBoldText(trimmed.replace(/[#*`~_]/g, '').trim());
        elements.push(<p key={idx} className="text-sm text-zinc-300 mb-3 leading-relaxed">{cleanText}</p>);
      }
    } else {
      flushList(idx);
    }
  });
  
  flushList('final');
  return <div className="space-y-1">{elements}</div>;
};

