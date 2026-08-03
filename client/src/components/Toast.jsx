import React, { useEffect } from "react";
import { Info, CheckCircle, AlertCircle, X } from "lucide-react";

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    info: <Info className="w-5 h-5 text-indigo-400" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
  };

  const borders = {
    info: "border-indigo-500/30 bg-slate-800/90 text-indigo-100",
    success: "border-emerald-500/30 bg-slate-800/90 text-emerald-100",
    error: "border-rose-500/30 bg-slate-800/90 text-rose-100",
  };

  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in flex items-center gap-3 px-4 py-3 rounded-xl border glass-panel shadow-2xl transition-all">
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
