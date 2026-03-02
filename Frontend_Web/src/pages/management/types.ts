// ===== Management Page Types =====

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  members: number;
  messages: number;
  privacy: 'public' | 'private';
  created: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}
