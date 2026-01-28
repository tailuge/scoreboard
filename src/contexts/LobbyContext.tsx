import React, { createContext, useContext, useEffect, useState } from 'react';
import { NchanSub } from '@/nchan/nchansub';

interface LobbyContextType {
  lastMessage: any;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export function LobbyProvider({ children }: { children: React.ReactNode }) {
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const sub = new NchanSub("lobby", (msg) => {
      try {
        setLastMessage(JSON.parse(msg));
      } catch {
        // Ignore non-JSON messages or handle them if necessary
      }
    });
    sub.start();
    return () => sub.stop();
  }, []);

  return (
    <LobbyContext.Provider value={{ lastMessage }}>
      {children}
    </LobbyContext.Provider>
  );
}

export function useLobbyContext() {
  const context = useContext(LobbyContext);
  if (context === undefined) {
    throw new Error('useLobbyContext must be used within a LobbyProvider');
  }
  return context;
}
