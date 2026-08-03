import React from "react";
import { Users, Settings, Lock, Globe, ShieldCheck } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

export default function MembersSidebar({
  room,
  members = [],
  onlineUsers = [],
  onOpenSettings,
  onSelectUser,
}) {
  const { user: currentUser } = useAuth();

  if (!room) return null;

  const isCreator = !room.creator || (currentUser && (room.creator._id === currentUser._id || room.creator === currentUser._id));

  // Determine online status for members
  const memberListWithStatus = members.map((m) => {
    const memUser = m.user || m;
    const isOnline = onlineUsers.includes(memUser._id);
    return {
      ...memUser,
      role: m.role || "member",
      isOnline,
    };
  });

  const onlineMembers = memberListWithStatus.filter((m) => m.isOnline);
  const offlineMembers = memberListWithStatus.filter((m) => !m.isOnline);

  return (
    <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full flex-shrink-0 select-none">
      {/* Room Summary Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 overflow-hidden">
            {room.type === "private" ? (
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <h3 className="text-sm font-bold text-white truncate">{room.name}</h3>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Room Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {room.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
        )}
      </div>

      {/* Members Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Online Members */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Online — {onlineMembers.length}</span>
          </div>

          <div className="space-y-1">
            {onlineMembers.map((member) => (
              <div
                key={member._id}
                onClick={() => onSelectUser(member)}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <Avatar
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                  status="online"
                  size="sm"
                />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {member.name}
                    </span>
                    {member.role === "owner" && (
                      <ShieldCheck className="w-3 h-3 text-indigo-400 flex-shrink-0" title="Room Owner" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>Offline — {offlineMembers.length}</span>
            </div>

            <div className="space-y-1">
              {offlineMembers.map((member) => (
                <div
                  key={member._id}
                  onClick={() => onSelectUser(member)}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors opacity-70 hover:opacity-100"
                >
                  <Avatar
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    status="offline"
                    size="sm"
                  />
                  <div className="overflow-hidden">
                    <span className="text-xs font-medium text-slate-300 truncate block">
                      {member.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
