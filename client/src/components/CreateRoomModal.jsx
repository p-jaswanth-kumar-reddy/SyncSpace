import React, { useState } from "react";
import { X, Lock, Globe, Plus } from "lucide-react";
import api from "../api/axios";

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("public");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === "private" && !password.trim()) {
      setError("Password is required for private rooms");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const { data } = await api.post("/rooms", {
        name: name.trim(),
        type,
        password: type === "private" ? password : undefined,
        description: description.trim(),
      });

      onRoomCreated(data);
      setName("");
      setPassword("");
      setDescription("");
      setType("public");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Create a New Room</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="general-chat"
                required
                className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this room about?"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("public")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === "public"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" /> Public Room
              </button>
              <button
                type="button"
                onClick={() => setType("private")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === "private"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400" /> Private Room
              </button>
            </div>
          </div>

          {type === "private" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Room Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a secret password"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
            >
              {isSubmitting ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}