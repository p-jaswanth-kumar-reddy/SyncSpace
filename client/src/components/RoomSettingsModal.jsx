import React, { useState } from "react";
import { X, Settings, Trash2, UserPlus, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function RoomSettingsModal({ room, isOpen, onClose, onRoomUpdated, onRoomDeleted }) {
  const [name, setName] = useState(room?.name || "");
  const [description, setDescription] = useState(room?.description || "");
  const [password, setPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  if (!isOpen || !room) return null;

  const isCreator = !room.creator || (user && (room.creator._id === user._id || room.creator === user._id));

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const { data } = await api.put(`/rooms/${room._id}`, {
        name,
        description,
        type: room.type,
        password: password || undefined,
      });

      onRoomUpdated(data.room);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update room");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;

    try {
      await api.delete(`/rooms/${room._id}`);
      onRoomDeleted(room._id);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      alert(data?.message || "Failed to delete room");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteStatus("");

    try {
      const { data } = await api.post(`/rooms/${room._id}/invite`, {
        email: inviteEmail,
      });

      setInviteStatus(`✅ ${data.message}`);
      setInviteEmail("");
    } catch (err) {
      setInviteStatus(`❌ ${err.response?.data?.message || "Failed to invite user"}`);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Room Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Invite Section */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Invite Users
            </h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isInviting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isInviting ? "Sending..." : "Invite"}
              </button>
            </form>
            {inviteStatus && <p className="text-xs mt-2">{inviteStatus}</p>}
          </div>

          {/* Edit Form */}
          {isCreator ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {room.type === "private" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Change Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Only the creator of this room can modify its settings or delete it.
            </p>
          )}

          {/* Delete Danger Zone */}
          {isCreator && (
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                Danger Zone
              </h3>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}