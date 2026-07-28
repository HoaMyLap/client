const BASE_URL = 'http://localhost:8000/api';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        const currentPath = window.location.pathname;
        if (!['/login', '/register', '/', '/features', '/pricing', '/terms', '/contact'].includes(currentPath)) {
          window.location.href = '/login';
        }
      }
    }
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error: [${response.status}] ${options.method || 'GET'} ${path}`, errorData);
    throw new Error(errorData.error || response.statusText || `Lỗi ${response.status}: Có lỗi xảy ra`);
  }

  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

export const api = {
  auth: {
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    me: () => request('/users/me'),
    update: (data: { fullname: string; avatarUrl?: string }) => 
      request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  },
  workspaces: {
    list: () => request('/workspaces'),
    create: (data: any) => request('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    addMember: (workspaceId: string, email: string, role: string) =>
      request(`/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
    getMembers: (workspaceId: string) => request(`/workspaces/${workspaceId}/members`),
    removeMember: (workspaceId: string, userId: string) =>
      request(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }),
    updateMemberRole: (workspaceId: string, userId: string, role: string) =>
      request(`/workspaces/${workspaceId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
  },
  projects: {
    list: (workspaceId: string) => request(`/projects/workspace/${workspaceId}`),
    get: (projectId: string) => request(`/projects/${projectId}`),
    create: (data: any) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (projectId: string, data: any) =>
      request(`/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (projectId: string) => request(`/projects/${projectId}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (projectId: string) => request(`/tasks/project/${projectId}`),
    create: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request('/tasks', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (taskId: string) => request(`/tasks/${taskId}`, { method: 'DELETE' }),
    move: (taskId: string, data: { newStatus: string; prevPosition: number | null; nextPosition: number | null }) =>
      request(`/tasks/${taskId}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
    getSubtasks: (taskId: string) => request(`/tasks/${taskId}/subtasks`),
    generateAiSubtasks: (taskId: string) => request(`/tasks/${taskId}/ai-subtasks`, { method: 'POST' }),
    suggestSubtasks: (taskId: string) => request(`/tasks/${taskId}/suggest-subtasks`, { method: 'POST' }),
    batchSubtasks: (taskId: string, subtasks: string[]) =>
      request(`/tasks/${taskId}/batch-subtasks`, { method: 'POST', body: JSON.stringify({ subtasks }) }),
    getLogs: (taskId: string) => request(`/tasks/${taskId}/logs`),
    toggleDone: (taskId: string) => request(`/tasks/${taskId}/toggle-done`, { method: 'PATCH' }),
  },
  comments: {
    list: (taskId: string) => request(`/comments/task/${taskId}`),
    create: (data: { content: string; taskId: string; parentCommentId?: string | null }) =>
      request('/comments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, content: string) =>
      request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    delete: (id: string) => request(`/comments/${id}`, { method: 'DELETE' }),
    like: (id: string) => request(`/comments/${id}/like`, { method: 'PATCH' }),
  },
  notifications: {
    list: () => request('/notifications'),
    read: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    readAll: () => request('/notifications/read-all', { method: 'PATCH' }),
    invite: (data: { email: string; targetType: 'WORKSPACE' | 'PROJECT'; targetId: string; role?: string }) =>
      request('/notifications/invite', { method: 'POST', body: JSON.stringify(data) }),
    respondInvitation: (id: string, action: 'ACCEPT' | 'DECLINE') =>
      request(`/notifications/${id}/respond-invitation`, { method: 'POST', body: JSON.stringify({ action }) }),
    requestLeave: (data: { targetType: 'WORKSPACE' | 'PROJECT'; targetId: string }) =>
      request('/notifications/request-leave', { method: 'POST', body: JSON.stringify(data) }),
    respondLeave: (id: string, action: 'APPROVE' | 'REJECT') =>
      request(`/notifications/${id}/respond-leave`, { method: 'POST', body: JSON.stringify({ action }) }),
  },
  ai: {
    getSummary: (projectId: string) => request(`/ai/project/${projectId}/summary`),
    smartSearch: (projectId: string, query: string) =>
      request(`/ai/project/${projectId}/smart-search`, { method: 'POST', body: JSON.stringify({ query }) }),
  },
  uploadImage: (formData: FormData) => request('/upload/image', { method: 'POST', body: formData }),
};
