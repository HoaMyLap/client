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
  },
  projects: {
    list: (workspaceId: string) => request(`/projects/workspace/${workspaceId}`),
    get: (projectId: string) => request(`/projects/${projectId}`),
    create: (data: any) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
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
  },
  comments: {
    list: (taskId: string) => request(`/comments/task/${taskId}`),
    create: (data: any) => request('/comments', { method: 'POST', body: JSON.stringify(data) }),
  },
  notifications: {
    list: () => request('/notifications'),
    read: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
  ai: {
    getSummary: (projectId: string) => request(`/ai/project/${projectId}/summary`),
  },
};
