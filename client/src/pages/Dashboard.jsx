import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MembersSidebar from "../components/MembersSidebar";
import CreateRoomModal from "../components/CreateRoomModal";
import RoomSettingsModal from "../components/RoomSettingsModal";
import UserProfileModal from "../components/UserProfileModal";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api/axios";

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [roomMembersMap, setRoomMembersMap] = useState({});
  const [typingUsersMap, setTypingUsersMap] = useState({});
  const [unreadCountsMap, setUnreadCountsMap] = useState({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ message: "", type: "info" });

  const { user, token } = useAuth();
  const { socket, onlineUsers, isConnected } = useSocket();

  // Fetch all available rooms & joined rooms on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsRes, joinedRes] = await Promise.all([
          api.get("/rooms"),
          token ? api.get("/rooms/joined") : Promise.resolve({ data: [] }),
        ]);

        if (Array.isArray(roomsRes.data)) setRooms(roomsRes.data);
        if (Array.isArray(joinedRes.data)) setJoinedRooms(joinedRes.data);
      } catch (err) {
        console.error("Failed to load rooms:", err);
      }
    };

    loadData();
  }, [token]);

  // Automatically join sockets for persisted rooms
  // Re-runs when socket reconnects (isConnected changes) to re-join all rooms
  useEffect(() => {
    if (!socket || !user || !isConnected) return;
    joinedRooms.forEach((room) => {
      socket.emit("joinRoom", { roomId: room._id });
    });

    if (joinedRooms.length > 0 && !activeRoomId) {
      setActiveRoomId(joinedRooms[0]._id);
    }
  }, [socket, joinedRooms, user, isConnected, activeRoomId]);

  // Load messages & members when active room changes
  useEffect(() => {
    if (!activeRoomId) return;

    const loadRoomData = async () => {
      try {
        const [messagesRes, membersRes] = await Promise.all([
          api.get(`/messages/${activeRoomId}`),
          api.get(`/rooms/${activeRoomId}/members`),
        ]);

        if (Array.isArray(messagesRes.data)) {
          setMessagesMap((prev) => ({ ...prev, [activeRoomId]: messagesRes.data }));
        }
        if (Array.isArray(membersRes.data)) {
          setRoomMembersMap((prev) => ({ ...prev, [activeRoomId]: membersRes.data }));
        }
      } catch (err) {
        console.error("Failed to load room data:", err);
      }
    };

    loadRoomData();

    // Clear unread count for active room
    setUnreadCountsMap((prev) => ({ ...prev, [activeRoomId]: 0 }));
  }, [activeRoomId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      if (!msg || !msg.roomId) return;

      // Prevent duplicate messages
      setMessagesMap((prev) => {
        const existing = prev[msg.roomId] || [];
        if (existing.some((m) => m._id === msg._id)) return prev;
        return { ...prev, [msg.roomId]: [...existing, msg] };
      });

      // Increment unread count if not active room
      if (msg.roomId !== activeRoomId) {
        setUnreadCountsMap((prev) => ({
          ...prev,
          [msg.roomId]: (prev[msg.roomId] || 0) + 1,
        }));
      }
    };

    const handleUserJoined = ({ message }) => {
      if (message) setToast({ message, type: "info" });
    };

    const handleUserLeft = ({ message }) => {
      if (message) setToast({ message, type: "info" });
    };

    const handleUserTyping = ({ roomId, user: typingUser }) => {
      if (!typingUser || !typingUser.name) return;
      setTypingUsersMap((prev) => {
        const current = prev[roomId] || [];
        if (!current.includes(typingUser.name)) {
          return { ...prev, [roomId]: [...current, typingUser.name] };
        }
        return prev;
      });
    };

    const handleUserStopTyping = ({ roomId, user: typingUser }) => {
      if (!typingUser || !typingUser.name) return;
      setTypingUsersMap((prev) => {
        const current = prev[roomId] || [];
        return { ...prev, [roomId]: current.filter((n) => n !== typingUser.name) };
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
    };
  }, [socket, activeRoomId]);

  // Join Room Handler
  const handleJoinRoom = async (room) => {
    let password;
    if (room.type === "private") {
      password = prompt("Enter room password:");
      if (!password) return;
    }

    try {
      const { data } = await api.post("/rooms/join", {
        roomId: room._id,
        password,
      });

      if (socket) {
        socket.emit("joinRoom", { roomId: room._id });
      }

      const joinedRoom = data.room || room;
      if (!joinedRooms.some((r) => r._id === joinedRoom._id)) {
        setJoinedRooms((prev) => [...prev, joinedRoom]);
      }
      setActiveRoomId(joinedRoom._id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to join room");
    }
  };

  // Leave Room Handler
  const handleLeaveRoom = async (roomId) => {
    try {
      await api.post("/rooms/leave", { roomId });

      if (socket) {
        socket.emit("leaveRoom", { roomId });
      }

      setJoinedRooms((prev) => prev.filter((r) => r._id !== roomId));
      if (activeRoomId === roomId) {
        const remaining = joinedRooms.filter((r) => r._id !== roomId);
        setActiveRoomId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to leave room";
      setToast({ message, type: "error" });
    }
  };

  // Send Message Handler
  const handleSendMessage = (msgData) => {
    if (!activeRoomId || !socket) return;

    socket.emit("sendMessage", {
      roomId: activeRoomId,
      message: msgData.content || "",
      messageType: msgData.messageType || "text",
      fileUrl: msgData.fileUrl || "",
      fileName: msgData.fileName || "",
      fileSize: msgData.fileSize || 0,
    });
  };

  const handleTyping = () => {
    if (socket && activeRoomId) {
      socket.emit("typing", { roomId: activeRoomId });
    }
  };

  const handleStopTyping = () => {
    if (socket && activeRoomId) {
      socket.emit("stopTyping", { roomId: activeRoomId });
    }
  };

  const activeRoom = joinedRooms.find((r) => r._id === activeRoomId) || rooms.find((r) => r._id === activeRoomId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        rooms={rooms}
        joinedRooms={joinedRooms}
        activeRoom={activeRoomId}
        onSelectRoom={(id) => setActiveRoomId(id)}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenProfile={() => setSelectedUserForProfile(user)}
        unreadCounts={unreadCountsMap}
      />

      {/* Center Chat Area */}
      <ChatArea
        room={activeRoom}
        messages={messagesMap[activeRoomId] || []}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        typingUsers={typingUsersMap[activeRoomId] || []}
        onSelectUser={(u) => setSelectedUserForProfile(u)}
      />

      {/* Right Members Sidebar */}
      {activeRoom && (
        <MembersSidebar
          room={activeRoom}
          members={roomMembersMap[activeRoomId] || []}
          onlineUsers={onlineUsers}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onSelectUser={(u) => setSelectedUserForProfile(u)}
        />
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={(newRoom) => {
          setRooms((prev) => [newRoom, ...prev]);
          setJoinedRooms((prev) => {
            if (prev.some((r) => r._id === newRoom._id)) return prev;
            return [newRoom, ...prev];
          });
          setActiveRoomId(newRoom._id);
          if (socket) {
            socket.emit("joinRoom", { roomId: newRoom._id });
          }
        }}
      />

      <RoomSettingsModal
        room={activeRoom}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onRoomUpdated={(updatedRoom) => {
          setRooms((prev) => prev.map((r) => (r._id === updatedRoom._id ? updatedRoom : r)));
          setJoinedRooms((prev) => prev.map((r) => (r._id === updatedRoom._id ? updatedRoom : r)));
        }}
        onRoomDeleted={(deletedRoomId) => {
          setRooms((prev) => prev.filter((r) => r._id !== deletedRoomId));
          setJoinedRooms((prev) => prev.filter((r) => r._id !== deletedRoomId));
          setActiveRoomId(null);
        }}
      />

      <UserProfileModal
        user={selectedUserForProfile}
        onClose={() => setSelectedUserForProfile(null)}
      />

      {/* Toast Overlay */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </div>
  );
}