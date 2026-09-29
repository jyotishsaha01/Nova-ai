import React, { useState, useRef } from "react";
import {
  X,
  Mic,
  MicOff,
  Upload,
  FileAudio,
  Loader2,
  Copy,
  Check,
  Send,
  Sparkles,
} from "lucide-react";

interface AudioTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (transcription: string) => void;
}

export const AudioTranscribeModal: React.FC<AudioTranscribeModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // stop mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setErrorMsg("Failed to access microphone. Please grant permission or upload an audio file.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handleTranscribe = async () => {
    if (!audioBlob || isTranscribing) return;

    setIsTranscribing(true);
    setErrorMsg(null);
    setTranscription("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: audioBlob.type || "audio/webm",
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to transcribe audio.");
        }

        const data = await response.json();
        setTranscription(data.text || "No speech detected in audio.");
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error("Transcription error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during transcription.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!transcription) return;
    onInsertToChat(transcription);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileAudio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Audio Transcription</h3>
              <p className="text-[11px] text-zinc-400">High-Precision Neural Transcription</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Audio Input Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Record Live */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                isRecording
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse"
                  : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5 mb-2 text-rose-400" /> : <Mic className="w-5 h-5 mb-2 text-indigo-400" />}
              <span className="font-semibold">{isRecording ? "Stop Recording" : "Record Mic"}</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {isRecording ? "Listening..." : "Click to record voice"}
              </span>
            </button>

            {/* Upload File */}
            <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 text-center transition-all cursor-pointer">
              <Upload className="w-5 h-5 mb-2 text-indigo-400" />
              <span className="font-semibold">Upload Audio</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">.mp3, .wav, .webm, .m4a</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Audio Player Preview */}
          {audioUrl && (
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Selected Audio:</span>
                <button
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              </div>
              <audio src={audioUrl} controls className="w-full h-8" />
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcribing Audio Recording...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Transcribe Audio</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Transcription Output */}
          {transcription && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-zinc-300 font-semibold">
                <span>Transcribed Result:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleInsert}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send to Chat</span>
                  </button>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 leading-relaxed font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                {transcription}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
