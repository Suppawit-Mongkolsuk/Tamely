// ===== Calendar & Task Types =====

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  date: string;
  priority: TaskPriority;
  assigneeId: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
}
