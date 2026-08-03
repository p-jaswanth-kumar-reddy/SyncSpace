import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

// Use relative URL so Vite proxy handles the connection (no CORS issues)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || !user) return;

    // Connect with JWT auth in handshake
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      withCredentials: true,
      // Auto-reconnect with exponential backoff
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attempt) => {
      console.log(`🔄 Socket reconnected after ${attempt} attempts`);
      setIsConnected(true);
    });

    newSocket.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnection attempt #${attempt}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user]);

  // Presence tracking
  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = ({ onlineUsers: users }) => {
      if (users) setOnlineUsers(users);
    };

    socket.on("presenceUpdate", handlePresenceUpdate);

    return () => {
      socket.off("presenceUpdate", handlePresenceUpdate);
    };
  }, [socket]);

  const value = useMemo(
    () => ({ socket, onlineUsers, isConnected }),
    [socket, onlineUsers, isConnected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};