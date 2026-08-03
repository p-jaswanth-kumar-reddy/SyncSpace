import React from "react";

const bgColors = [
  "bg-indigo-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-pink-600",
  "bg-teal-600",
];

function getColorForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % bgColors.length;
  return bgColors[index];
}

export default function Avatar({ name = "User", avatarUrl, status, size = "md" }) {
  const initial = name ? name.charAt(0).toUpperCase() : "U";
  const colorClass = getColorForName(name);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base font-semibold",
    xl: "w-16 h-16 text-2xl font-bold",
  };

  const statusDotSizes = {
    sm: "w-2 h-2 bottom-0 right-0",
    md: "w-2.5 h-2.5 bottom-0 right-0",
    lg: "w-3.5 h-3.5 bottom-0.5 right-0.5",
    xl: "w-4 h-4 bottom-1 right-1",
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-slate-700`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${colorClass} text-white rounded-full flex items-center justify-center font-medium shadow-sm`}
        >
          {initial}
        </div>
      )}

      {status && (
        <span
          className={`absolute rounded-full border-2 border-slate-900 ${
            statusDotSizes[size]
          } ${status === "online" ? "bg-emerald-500" : "bg-slate-500"}`}
        />
      )}
    </div>
  );
}
