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
  request,
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
    updateMemberRole: (workspaceId: string, userId: string, roleOrData: string | { role?: string; roleId?: string | null }) => {
      const isString = typeof roleOrData === 'string';
      return request(`/workspaces/${workspaceId}/members/${userId}/role`, {
        method: isString ? 'PATCH' : 'PUT',
        body: JSON.stringify(isString ? { role: roleOrData } : roleOrData),
      });
    },
    getRoles: (workspaceId: string) => request(`/workspaces/${workspaceId}/roles`),
    createRole: (workspaceId: string, data: { name: string; description: string; permissions: string[] }) =>
      request(`/workspaces/${workspaceId}/roles`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateRole: (workspaceId: string, roleId: string, data: { name: string; description: string; permissions: string[] }) =>
      request(`/workspaces/${workspaceId}/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteRole: (workspaceId: string, roleId: string) =>
      request(`/workspaces/${workspaceId}/roles/${roleId}`, { method: 'DELETE' }),
    getMemberPermissions: (workspaceId: string, userId: string) =>
      request(`/workspaces/${workspaceId}/members/${userId}/permissions`),
    saveMemberPermissions: (workspaceId: string, userId: string, permissions: Array<{ permission: string; allowed: boolean }>) =>
      request(`/workspaces/${workspaceId}/members/${userId}/permissions`, {
        method: 'POST',
        body: JSON.stringify(permissions),
      }),
    getFolders: (workspaceId: string, parentId?: string | null) =>
      request(`/workspaces/${workspaceId}/folders${parentId ? `?parentId=${parentId}` : ''}`),
    createFolder: (workspaceId: string, data: { name: string; parentId?: string | null }) =>
      request(`/workspaces/${workspaceId}/folders`, { method: 'POST', body: JSON.stringify(data) }),
    deleteFolder: (workspaceId: string, folderId: string) =>
      request(`/workspaces/${workspaceId}/folders/${folderId}`, { method: 'DELETE' }),
    getFiles: (workspaceId: string, folderId?: string | null) =>
      request(`/workspaces/${workspaceId}/files${folderId ? `?folderId=${folderId}` : ''}`),
    addFile: (workspaceId: string, data: any) =>
      request(`/workspaces/${workspaceId}/files`, { method: 'POST', body: JSON.stringify(data) }),
    deleteFile: (workspaceId: string, fileId: string) =>
      request(`/workspaces/${workspaceId}/files/${fileId}`, { method: 'DELETE' }),
    getAllAccessibleDocuments: (workspaceId: string) =>
      request(`/workspaces/${workspaceId}/all-accessible-documents`),
  },
  projects: {
    list: (workspaceId: string) => request(`/projects/workspace/${workspaceId}`),
    get: (projectId: string) => request(`/projects/${projectId}`),
    create: (data: any) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (projectId: string, data: any) =>
      request(`/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (projectId: string) => request(`/projects/${projectId}`, { method: 'DELETE' }),
    getFiles: (projectId: string, folderId?: string | null) =>
      request(`/projects/${projectId}/files${folderId ? `?folderId=${folderId}` : ''}`),
    addFile: (projectId: string, data: any) =>
      request(`/projects/${projectId}/files`, { method: 'POST', body: JSON.stringify(data) }),
    deleteFile: (projectId: string, fileId: string) =>
      request(`/projects/${projectId}/files/${fileId}`, { method: 'DELETE' }),
    getFolders: (projectId: string, parentId?: string | null) =>
      request(`/projects/${projectId}/folders${parentId ? `?parentId=${parentId}` : ''}`),
    createFolder: (projectId: string, data: { name: string; parentId?: string | null }) =>
      request(`/projects/${projectId}/folders`, { method: 'POST', body: JSON.stringify(data) }),
    deleteFolder: (projectId: string, folderId: string) =>
      request(`/projects/${projectId}/folders/${folderId}`, { method: 'DELETE' }),
    getMembers: (projectId: string) => request(`/projects/${projectId}/members`),
    requestDeletion: (projectId: string, reason: string) =>
      request(`/projects/${projectId}/deletion-request`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getDeletionRequests: (workspaceId: string) =>
      request(`/projects/workspace/${workspaceId}/deletion-requests`),
    approveDeletion: (requestId: string) =>
      request(`/projects/deletion-requests/${requestId}/approve`, { method: 'POST' }),
    rejectDeletion: (requestId: string) =>
      request(`/projects/deletion-requests/${requestId}/reject`, { method: 'POST' }),
  },
  tasks: {
    list: (projectId: string) => request(`/tasks/project/${projectId}`),
    create: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request('/tasks', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (taskId: string) => request(`/tasks/${taskId}`, { method: 'DELETE' }),
    move: (taskId: string, data: { newStatus: string; prevPosition: number | null; nextPosition: number | null }) =>
      request(`/tasks/${taskId}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
    createBatch: (data: { projectId: string; tasks: any[] }) =>
      request('/tasks/batch', { method: 'POST', body: JSON.stringify(data) }),
    getSubtasks: (taskId: string) => request(`/tasks/${taskId}/subtasks`),
    generateAiSubtasks: (taskId: string) => request(`/tasks/${taskId}/ai-subtasks`, { method: 'POST' }),
    suggestSubtasks: (taskId: string) => request(`/tasks/${taskId}/suggest-subtasks`, { method: 'POST' }),
    batchSubtasks: (taskId: string, subtasks: string[]) =>
      request(`/tasks/${taskId}/batch-subtasks`, { method: 'POST', body: JSON.stringify({ subtasks }) }),
    getLogs: (taskId: string) => request(`/tasks/${taskId}/logs`),
    toggleDone: (taskId: string) => request(`/tasks/${taskId}/toggle-done`, { method: 'PATCH' }),
    getFiles: (taskId: string) => request(`/tasks/${taskId}/files`),
    addFile: (taskId: string, data: any) =>
      request(`/tasks/${taskId}/files`, { method: 'POST', body: JSON.stringify(data) }),
    deleteFile: (taskId: string, fileId: string) =>
      request(`/tasks/${taskId}/files/${fileId}`, { method: 'DELETE' }),
  },
  comments: {
    list: (taskId: string) => request(`/comments/task/${taskId}`),
    create: (data: { content: string; taskId: string; parentCommentId?: string | null; replyToUserId?: string | null }) =>
      request('/comments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, content: string) =>
      request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    delete: (id: string) => request(`/comments/${id}`, { method: 'DELETE' }),
    like: (id: string) => request(`/comments/${id}/like`, { method: 'PATCH' }),
    getLikes: (id: string) => request(`/comments/${id}/likes`),
    setViewing: (taskId: string, viewing: boolean) =>
      request(`/comments/task/${taskId}/viewing?viewing=${viewing}`, { method: 'POST' }),
  },
  notifications: {
    list: () => request('/notifications'),
    read: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    readAll: () => request('/notifications/read-all', { method: 'PATCH' }),
    invite: (data: { email: string; targetType: 'WORKSPACE' | 'PROJECT'; targetId: string; role?: string }) =>
      request('/notifications/invite', { method: 'POST', body: JSON.stringify(data) }),
    inviteBatch: (data: { emails: string[]; targetType: 'WORKSPACE' | 'PROJECT'; targetId: string; role?: string }) =>
      request('/notifications/invite-batch', { method: 'POST', body: JSON.stringify(data) }),
    respondInvitation: (id: string, action: 'ACCEPT' | 'DECLINE') =>
      request(`/notifications/${id}/respond-invitation`, { method: 'POST', body: JSON.stringify({ action }) }),
    requestLeave: (data: { targetType: 'WORKSPACE' | 'PROJECT'; targetId: string }) =>
      request('/notifications/request-leave', { method: 'POST', body: JSON.stringify(data) }),
    respondLeave: (id: string, action: 'APPROVE' | 'REJECT') =>
      request(`/notifications/${id}/respond-leave`, { method: 'POST', body: JSON.stringify({ action }) }),
  },
  ai: {
    getSummary: (projectId: string, lang: string = 'vi') => 
      request(`/ai/project/${projectId}/summary?lang=${lang}`),
    smartSearch: (projectId: string, query: string, lang: string = 'vi') =>
      request(`/ai/project/${projectId}/smart-search`, { method: 'POST', body: JSON.stringify({ query, lang }) }),
  },
  chat: {
    getHistory: (targetType: string, targetId: string) =>
      request(`/chat/${targetType.toLowerCase()}/${targetId}/history`),
    sendMessage: (targetType: string, targetId: string, content: string) =>
      request(`/chat/${targetType.toLowerCase()}/${targetId}/send`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
  uploadImage: (formData: FormData) => request('/upload/image', { method: 'POST', body: formData }),
  uploadFile: (formData: FormData) => request('/upload/file', { method: 'POST', body: formData }),
  payments: {
    createOrder: (data: { planType: string; billingCycle: string; paymentMethod: string; voucherCode?: string }) =>
      request('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
    confirmPayment: (data: { orderId?: string; transactionId?: string }) =>
      request('/payments/confirm-payment', { method: 'POST', body: JSON.stringify(data) }),
    getOrderStatus: (orderId: string) => request(`/payments/order-status/${orderId}`),
    getUserOrders: () => request('/payments/user-orders'),
    capturePaypal: (orderId: string) => request('/payments/paypal/capture', { method: 'POST', body: JSON.stringify({ orderId }) }),
  },
};
