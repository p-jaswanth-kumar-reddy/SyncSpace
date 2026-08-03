import React, { useState } from "react";
import { X, Mail, Calendar, Edit2, Check } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function UserProfileModal({ user, onClose }) {
  const { user: currentUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const isSelf = currentUser && (currentUser._id === user._id || currentUser.name === user.name);

  const handleSave = async () => {
    setError("");
    setIsSaving(true);
    try {
      const { data } = await api.put("/users/profile", { name, avatarUrl });

      if (isSelf) {
        updateUser(data.user);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden glass-panel">
        {/* Banner Header */}
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Card Info */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-12 mb-4 flex justify-between items-end">
            <div className="p-1 rounded-full bg-slate-900">
              <Avatar
                name={user.name}
                avatarUrl={isSelf ? avatarUrl : user.avatarUrl}
                status={user.status || "online"}
                size="xl"
              />
            </div>
            {isSelf && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {user.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.status === "online" ? "🟢 Currently Online" : `Last seen: ${user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString() : "recently"}`}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>{user.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Member of SyncSpace</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}