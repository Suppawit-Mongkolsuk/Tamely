import { useCallback, useEffect, useState } from 'react';
import { workspaceService } from '@/services/workspace.service';
import { connectSocket } from '@/lib/socket';
import type { WorkspaceMember } from '@/types/workspace';

export function useChatPresence(wsId: string | undefined, myId: string) {
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [myWorkspaceRole, setMyWorkspaceRole] = useState<
    'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
  >('MEMBER');

  const fetchWorkspaceMembers = useCallback(async () => {
    if (!wsId) return;
    try {
      const data = await workspaceService.getMembers(wsId);
      const me = data.find((member) => member.userId === myId);
      if (me) {
        setMyWorkspaceRole(me.role as 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER');
      }
      setWorkspaceMembers(data.filter((member) => member.userId !== myId));
    } catch (err) {
      console.warn('[ChatRooms] Failed to fetch workspace members:', err);
    }
  }, [myId, wsId]);

  useEffect(() => {
    void fetchWorkspaceMembers();
  }, [fetchWorkspaceMembers]);

  useEffect(() => {
    const socket = connectSocket();

    const queryInitialStatus = () => {
      if (workspaceMembers.length === 0) return;
      const userIds = workspaceMembers.map((member) => member.userId);
      socket.emit('get_online_status', userIds, (statusMap: Record<string, boolean>) => {
        setOnlineStatus(statusMap);
      });
    };

    const handleOnline = ({ userId }: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: true }));
    };

    const handleOffline = ({ userId }: { userId: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: false }));
    };

    socket.on('user_online', handleOnline);
    socket.on('user_offline', handleOffline);

    if (socket.connected) {
      queryInitialStatus();
    } else {
      socket.once('connect', queryInitialStatus);
    }

    return () => {
      socket.off('user_online', handleOnline);
      socket.off('user_offline', handleOffline);
      socket.off('connect', queryInitialStatus);
    };
  }, [workspaceMembers]);

  return {
    workspaceMembers,
    onlineStatus,
    myWorkspaceRole,
    fetchWorkspaceMembers,
  };
}
