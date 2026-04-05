export const validateCreateWorkspace = (data: {
  name?: string;
  description?: string;
}): { valid: boolean; message?: string } => {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, message: 'Workspace name is required.' };
  }
  if (data.name.length > 100) {
    return { valid: false, message: 'Workspace name must be at most 100 characters.' };
  }
  if (data.description && data.description.length > 500) {
    return { valid: false, message: 'Description must be at most 500 characters.' };
  }
  return { valid: true };
};

export const validateUpdateWorkspace = (data: {
  name?: string;
  description?: string;
}): { valid: boolean; message?: string } => {
  if (data.name !== undefined && data.name.trim().length === 0) {
    return { valid: false, message: 'Workspace name cannot be empty.' };
  }
  if (data.name && data.name.length > 100) {
    return { valid: false, message: 'Workspace name must be at most 100 characters.' };
  }
  if (data.description && data.description.length > 500) {
    return { valid: false, message: 'Description must be at most 500 characters.' };
  }
  return { valid: true };
};

export const validateInviteCode = (
  inviteCode?: string,
): { valid: boolean; message?: string } => {
  if (!inviteCode || inviteCode.trim().length === 0) {
    return { valid: false, message: 'Invite code is required.' };
  }
  return { valid: true };
};

export const validateAddMember = (
  email?: string,
): { valid: boolean; message?: string } => {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: 'Email is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format.' };
  }
  return { valid: true };
};
