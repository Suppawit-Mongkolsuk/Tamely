export interface Task {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assigneeId?: string;
  assignee?: { id: string; Name: string; avatarUrl?: string | null };
  workspaceId: string;
  createdBy: 'USER' | 'AI';
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  date: string;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
}
