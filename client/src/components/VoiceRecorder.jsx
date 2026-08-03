import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Use relative URL so Vite proxy handles the request (no CORS issues)
const API_URL = import.meta.env.VITE_API_URL || "";

export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Unable to access microphone. Please check permissions.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, `voice-note-${Date.now()}.webm`);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onSendVoice({
          fileUrl: data.fileUrl,
          fileName: "Voice Note",
          fileSize: data.fileSize,
          messageType: "voice",
        });
      } else {
        alert(data.message || "Failed to upload voice note");
      }
    } catch (err) {
      console.error("Voice upload error:", err);
      alert("Failed to upload voice note");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl animate-fade-in w-full">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          {isRecording && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecording ? "bg-rose-500" : "bg-emerald-500"}`} />
        </span>
        <span className="text-xs font-semibold text-slate-300">
          {isRecording ? `Recording: ${formatTime(recordingTime)}` : "Preview Audio"}
        </span>
      </div>

      {audioUrl && !isRecording && (
        <audio src={audioUrl} controls className="h-8 max-w-xs text-xs" />
      )}

      <div className="flex items-center gap-2 ml-auto">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
            title="Stop Recording"
          >
            <Square className="w-4 h-4 fill-white" /> Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isUploading}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Send className="w-4 h-4" /> {isUploading ? "Sending..." : "Send"}
          </button>
        )}

        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
          title="Cancel"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
