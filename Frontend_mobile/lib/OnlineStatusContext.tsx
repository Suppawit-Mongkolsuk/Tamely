import React, { createContext, useContext, useState, useCallback } from 'react';

interface OnlineStatusContextValue {
  onlineUserIds: Set<string>;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  isOnline: (userId: string) => boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextValue>({
  onlineUserIds: new Set(),
  setUserOnline: () => {},
  setUserOffline: () => {},
  isOnline: () => false,
});

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const setUserOnline = useCallback((userId: string) => {
    setOnlineUserIds((prev) => new Set(prev).add(userId));
  }, []);

  const setUserOffline = useCallback((userId: string) => {
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const isOnline = useCallback(
    (userId: string) => onlineUserIds.has(userId),
    [onlineUserIds],
  );

  return (
    <OnlineStatusContext.Provider value={{ onlineUserIds, setUserOnline, setUserOffline, isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}
