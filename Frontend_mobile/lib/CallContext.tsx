import React, { createContext, useContext } from 'react';

interface CallContextValue {
  startCall: (targetUserId: string, conversationId: string, peerName?: string, peerAvatarUrl?: string | null) => Promise<void>;
}

const CallContext = createContext<CallContextValue>({
  startCall: async () => {},
});

export const CallProvider = CallContext.Provider;
export const useCall = () => useContext(CallContext);
