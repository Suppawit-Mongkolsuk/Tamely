import { useCallback, useEffect, useState } from 'react';
import { dmService } from '@/services/dm.service';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';

export function useUnreadDMs() {
  const { currentWorkspace } = useWorkspaceContext();
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setTotalUnread(0);
      return;
    }

    setIsLoading(true);
    try {
      const conversations = await dmService.getConversations(currentWorkspace.id);
      const total = conversations.reduce(
        (sum, conversation) => sum + (conversation.unreadCount ?? 0),
        0,
      );
      setTotalUnread(total);
    } catch {
      setTotalUnread(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    const handleFocus = () => {
      void refreshUnread();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUnread]);

  return {
    totalUnread,
    isLoading,
    refreshUnread,
  };
}
