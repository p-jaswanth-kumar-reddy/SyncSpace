import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Search,
  X,
  FileText,
  Download,
  Image as ImageIcon,
  CheckCheck,
  Volume2
} from "lucide-react";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// Use relative URL so Vite proxy handles the request (no CORS issues)
const API_URL = import.meta.env.VITE_API_URL || "";

export default function ChatArea({
  room,
  messages = [],
  onSendMessage,
  onTyping,
  onStopTyping,
  typingUsers = [],
  onUploadFile,
  onSelectUser,
}) {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user: currentUser, token } = useAuth();

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Handle typing status
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (onTyping) onTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) onStopTyping();
    }, 2000);
  };

  // Submit text message
  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({ content: inputText.trim(), messageType: "text" });
    setInputText("");
    if (onStopTyping) onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file select
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadSelectedFile(file);
    // Reset input so selecting the same file again triggers change event
    e.target.value = "";
  };

  const uploadSelectedFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onSendMessage({
          content: data.fileName,
          messageType: data.messageType,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
        });
      } else {
        alert(data.message || "File upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Highlight search matching text
  const renderMessageContent = (msg) => {
    const text = msg.content || "";
    if (isSearching && searchQuery.trim()) {
      // Escape regex special characters to prevent injection/crash
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
      return (
        <span>
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-amber-400 text-slate-900 rounded px-1 font-semibold">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    }

    if (msg.messageType === "image" && msg.fileUrl) {
      return (
        <div className="space-y-1">
          <img
            src={msg.fileUrl}
            alt={msg.fileName || "Shared image"}
            onClick={() => setPreviewMedia(msg.fileUrl)}
            className="max-w-xs max-h-60 rounded-xl object-cover cursor-pointer border border-slate-700/60 hover:opacity-90 transition-opacity"
          />
          {text && text !== msg.fileName && <p className="text-sm mt-1">{text}</p>}
        </div>
      );
    }

    if (msg.messageType === "pdf" && msg.fileUrl) {
      return (
        <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 max-w-xs">
          <FileText className="w-8 h-8 text-rose-400 flex-shrink-0" />
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold truncate text-white">{msg.fileName || "PDF Document"}</p>
            <span className="text-[10px] text-slate-400">PDF File</span>
          </div>
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      );
    }

    if (msg.messageType === "voice" && msg.fileUrl) {
      return (
        <div className="flex items-center gap-2 p-2 bg-slate-800/90 rounded-xl border border-slate-700 max-w-xs">
          <Volume2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <audio src={msg.fileUrl} controls className="h-8 w-56 text-xs" />
        </div>
      );
    }

    if (msg.messageType === "file" && msg.fileUrl) {
      return (
        <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 max-w-xs">
          <FileText className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold truncate text-white">{msg.fileName || "File Attachment"}</p>
          </div>
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>;
  };

  const filteredMessages = isSearching && searchQuery.trim()
    ? messages.filter((m) => (m.content || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!room) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-300">Welcome to SyncSpace</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Select a room from the left sidebar or create a new public/private room to start collaborating.
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 bg-slate-950 flex flex-col h-full relative overflow-hidden"
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-indigo-600/20 backdrop-blur-sm border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center text-indigo-200 animate-fade-in pointer-events-none">
          <Paperclip className="w-12 h-12 mb-2 animate-bounce" />
          <p className="text-lg font-bold">Drop file to upload</p>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 glass-panel">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-indigo-400">#</span> {room.name}
          </h2>
          <p className="text-xs text-slate-400">
            {room.description || "Real-time chat room"}
          </p>
        </div>

        {/* Search Bar Toggle */}
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search room messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-44"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearching(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Search Messages"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10">
            {isSearching ? "No matching messages found." : "No messages yet. Send the first message!"}
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const senderObj = typeof msg.sender === "object" && msg.sender ? msg.sender : {};
            const senderName = senderObj.name || msg.senderName || (typeof msg.sender === "string" ? msg.sender : "User");
            const senderAvatar = senderObj.avatarUrl;
            const senderId = senderObj._id || (typeof msg.sender === "string" ? msg.sender : null);

            const isOwnMessage =
              (currentUser && senderId === currentUser._id) ||
              (currentUser && senderName === currentUser.name);

            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div
                key={msg._id || index}
                className={`flex gap-3 animate-fade-in ${
                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  onClick={() => senderObj && onSelectUser && onSelectUser(senderObj)}
                  className="cursor-pointer flex-shrink-0"
                >
                  <Avatar name={senderName} avatarUrl={senderAvatar} size="md" />
                </div>

                <div className={`max-w-[75%] space-y-1 ${isOwnMessage ? "items-end text-right" : "items-start text-left"}`}>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{senderName}</span>
                    <span>{timeStr}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl shadow-sm text-white ${
                      isOwnMessage
                        ? "bg-indigo-600 rounded-tr-none"
                        : "bg-slate-800/90 border border-slate-700/80 rounded-tl-none"
                    }`}
                  >
                    {renderMessageContent(msg)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-indigo-400 animate-pulse font-medium flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-100"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-200"></span>
          </span>
          <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80 relative glass-panel">
        {showVoiceRecorder ? (
          <VoiceRecorder
            onSendVoice={(voiceData) => {
              onSendMessage(voiceData);
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 rounded-2xl px-3 py-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
              title="Attach File / Image / PDF"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message #room... (Enter to send, Shift+Enter for newline)"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none max-h-24 overflow-y-auto"
            />

            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <EmojiPicker
            onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      {/* Lightbox Media Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 p-2 text-white bg-slate-800/80 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={previewMedia} alt="Preview" className="max-w-full max-h-[90vh] rounded-2xl" />
        </div>
      )}
    </div>
  );
}
