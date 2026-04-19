import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { connectSocket } from '@/lib/socket';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { config } from '@/lib/config';

interface MessagePayload {
  id: string;
  content: string;
  sender: { id: string; Name: string };
  roomId?: string;
  roomName?: string;
}

interface DmPayload {
  id: string;
  content: string;
  sender: { id: string; Name: string };
  conversationId?: string;
}

export function useGlobalNotifications() {
  const { user } = useAuthContext();
  const { currentWorkspace } = useWorkspaceContext();
  const navigate = useNavigate();
  const location = useLocation();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!user || !currentWorkspace) return;

    const wsId = currentWorkspace.id;
    const myId = user.id;
    const socket = connectSocket();

    const joinRooms = async () => {
      if (joinedRef.current) return;
      try {
        const headers = { 'ngrok-skip-browser-warning': 'true' };

        const [roomRes, dmRes] = await Promise.all([
          fetch(`${config.apiUrl}/workspaces/${wsId}/rooms`, { credentials: 'include', headers }),
          fetch(`${config.apiUrl}/workspaces/${wsId}/dm`, { credentials: 'include', headers }),
        ]);

        if (roomRes.ok) {
          const { data: rooms } = await roomRes.json();
          for (const room of (rooms ?? [])) {
            socket.emit('join_room', room.id);
          }
        }

        if (dmRes.ok) {
          const { data: convs } = await dmRes.json();
          for (const conv of (convs ?? [])) {
            socket.emit('join_dm', conv.id);
          }
        }

        joinedRef.current = true;
      } catch {
        // silent — notifications are best-effort
      }
    };

    if (socket.connected) {
      joinRooms();
    } else {
      socket.once('connect', joinRooms);
    }

    const handleMessage = (msg: MessagePayload) => {
      if (msg.sender.id === myId) return;
      if (location.pathname.includes('/chat-rooms')) return;

      const roomLabel = msg.roomName ? `# ${msg.roomName}` : 'ห้องแชท';
      toast(`${msg.sender.Name}: ${msg.content}`, {
        description: roomLabel,
        action: {
          label: 'เปิด',
          onClick: () =>
            navigate(`/chat-rooms?room=${msg.roomId ?? ''}`),
        },
        duration: 5000,
      });
    };

    const handleDm = (msg: DmPayload) => {
      if (msg.sender.id === myId) return;
      if (location.pathname.includes('/chat-rooms')) return;

      toast(msg.sender.Name, {
        description: msg.content,
        action: {
          label: 'เปิด',
          onClick: () =>
            navigate(`/chat-rooms?dm=${msg.conversationId ?? ''}`),
        },
        duration: 5000,
      });
    };

    socket.on('message_received', handleMessage);
    socket.on('dm_received', handleDm);

    return () => {
      socket.off('message_received', handleMessage);
      socket.off('dm_received', handleDm);
      socket.off('connect', joinRooms);
      joinedRef.current = false;
    };
  }, [user, currentWorkspace, navigate, location.pathname]);
}
