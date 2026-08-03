import React from "react";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "😜",
  "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞",
  "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢",
  "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱",
  "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤟",
  "🤘", "💪", "🔥", "✨", "🎉", "❤️", "💖", "💯", "🚀", "💡"
];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  return (
    <div className="absolute bottom-14 left-0 z-50 w-72 p-3 rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl animate-fade-in glass-panel">
      <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-400">Emojis</span>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto pr-1">
        {EMOJI_LIST.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-lg transition-transform hover:scale-110 flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
