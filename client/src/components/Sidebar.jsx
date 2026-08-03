import React, { useState } from "react";
import { Plus, Search, LogOut, Lock, Globe, MessageSquare, Shield } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  rooms,
  joinedRooms,
  activeRoom,
  onSelectRoom,
  onJoinRoom,
  onLeaveRoom,
  onOpenCreateModal,
  onOpenProfile,
  unreadCounts = {},
}) {
  const [search, setSearch] = useState("");
  const { user, logout } = useAuth();

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const availableRooms = filteredRooms.filter(
    (r) => !joinedRooms.some((jr) => jr._id === r._id)
  );

  const filteredJoinedRooms = joinedRooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0 select-none">
      {/* App & User Profile Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-800 rounded-xl transition-colors max-w-[200px]"
          title="Click to view profile"
        >
          <Avatar
            name={user?.name || "User"}
            avatarUrl={user?.avatarUrl}
            status="online"
            size="md"
          />
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white truncate">
              {user?.name || "SyncSpace User"}
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Create Room Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onOpenCreateModal}
          className="w-full py-2 px-3 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" /> Create Room
        </button>
      </div>

      {/* Navigation Lists Container */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 py-2">
        {/* Joined Rooms */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Joined Rooms ({joinedRooms.length})
            </span>
          </div>

          {filteredJoinedRooms.length === 0 ? (
            <p className="text-xs text-slate-500 px-2 py-1">No joined rooms yet</p>
          ) : (
            <div className="space-y-1">
              {filteredJoinedRooms.map((room) => {
                const isActive = activeRoom === room._id;
                const unread = unreadCounts[room._id] || 0;
                const isCreator = !room.creator || (user && (room.creator._id === user._id || room.creator === user._id));

                return (
                  <div
                    key={room._id}
                    onClick={() => onSelectRoom(room._id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {room.type === "private" ? (
                        <Lock className={`w-4 h-4 ${isActive ? "text-white" : "text-amber-400"}`} />
                      ) : (
                        <MessageSquare className={`w-4 h-4 ${isActive ? "text-white" : "text-indigo-400"}`} />
                      )}
                      <span className="text-xs font-semibold truncate">
                        {room.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {unread > 0 && !isActive && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                          {unread}
                        </span>
                      )}
                      {!isCreator && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeaveRoom(room._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-400 hover:bg-rose-500/20 px-1.5 py-0.5 rounded transition-all"
                          title="Leave Room"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Rooms */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Available Rooms ({availableRooms.length})
            </span>
          </div>

          {availableRooms.length === 0 ? (
            <p className="text-xs text-slate-500 px-2 py-1">No other rooms available</p>
          ) : (
            <div className="space-y-1">
              {availableRooms.map((room) => (
                <div
                  key={room._id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700/50"
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      {room.type === "private" ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {room.name}
                      </span>
                    </div>
                    {room.description && (
                      <p className="text-[10px] text-slate-500 truncate pl-5">
                        {room.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onJoinRoom(room)}
                    className="ml-2 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/30 transition-all flex-shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
