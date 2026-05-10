import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000", {
      transports: ["websocket"],
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}

