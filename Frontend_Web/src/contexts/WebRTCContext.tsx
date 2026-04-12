import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthContext } from './AuthContext';
import { useWebRTC, type UseWebRTCReturn } from '@/hooks/useWebRTC';

const WebRTCContext = createContext<UseWebRTCReturn | null>(null);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isSessionReady } = useAuthContext();

  useEffect(() => {
    if (!isSessionReady) return;

    if (isAuthenticated) {
      connectSocket();
      return;
    }

    disconnectSocket();
  }, [isAuthenticated, isSessionReady]);

  const value = useWebRTC({
    socket: isAuthenticated ? getSocket() : null,
    currentUserId: user?.id ?? '',
  });

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTCContext() {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within WebRTCProvider');
  }
  return context;
}
