import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  X,
  FileCode,
  StopCircle,
  Bot,
} from "lucide-react";
import { ChatAttachment } from "../types";

interface ChatInputProps {
  onSendMessage: (content: string, attachments: ChatAttachment[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  agenticMode: boolean;
  onToggleAgenticMode: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  enableSearch,
  onToggleSearch,
  agenticMode,
  onToggleAgenticMode,
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto-resize textarea smoothly up to 240px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [content]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechRecognitionRef.current) {
      console.warn("Speech recognition is not supported in this browser environment.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!content.trim() && attachments.length === 0) || isLoading) return;

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(content.trim(), attachments);
    setContent("");
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: file.type || "text/plain",
            size: file.size,
            dataUrl,
          },
        ]);
      };

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const hasInput = content.trim().length > 0 || attachments.length > 0;

  return (
    <div className="nova-composer w-full max-w-3xl mx-auto px-4 pb-4 select-none relative z-10">
      {/* Outer Shimmer Border Wrapper */}
      <div
        className={`relative p-[1px] rounded-2xl transition-all duration-500 ${
          isFocused || isLoading
            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 animate-shimmer-border shadow-2xl shadow-indigo-500/20"
            : "bg-zinc-800/80 hover:bg-zinc-700/80 shadow-xl"
        }`}
      >
        <div className="nova-composer-surface relative rounded-2xl bg-zinc-950/95 backdrop-blur-2xl overflow-hidden">
          {/* Attachment preview pills */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 pb-1 border-b border-zinc-800/80">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 max-w-xs shadow-sm"
                >
                  {att.type.startsWith("image/") ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-9 h-9 rounded-lg object-cover border border-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className="p-1.5 rounded-lg bg-zinc-850 text-indigo-400">
                      <FileCode className="w-4 h-4" />
                    </div>
                  )}
                  <div className="truncate text-[11px] font-mono">{att.name}</div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={agenticMode ? "Describe a task — Nova will plan the work and show each step" : "Ask Nova anything — compare models, research, write, or create"}
            rows={1}
            className="w-full pt-3.5 pb-2 px-4 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none leading-relaxed max-h-56 select-text"
          />

          {/* Bottom Control Bar */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            {/* Left tools: File attach, Web search toggle, Voice dictation */}
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,text/*,.ts,.tsx,.js,.jsx,.py,.html,.css,.json,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Attach documents, images, or code"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Google Search Grounding Toggle */}
              <button
                onClick={onToggleSearch}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  enableSearch
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-xs"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                }`}
                title="Toggle Google Search live web grounding"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search</span>
                {enableSearch && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onToggleAgenticMode}
                aria-pressed={agenticMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  agenticMode
                    ? "bg-violet-500/15 border-violet-400/40 text-violet-200 shadow-xs"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                }`}
                title="Plan and execute a bounded multi-step run with visible progress"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Agent</span>
                {agenticMode && <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />}
              </button>

              {/* Voice Dictation with Animated Waves */}
              <button
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
                title={isListening ? "Stop listening" : "Dictate with voice"}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-0.5 bg-rose-400 rounded-full animate-sound-wave-1" />
                      <span className="w-0.5 bg-rose-400 rounded-full animate-sound-wave-2" />
                      <span className="w-0.5 bg-rose-400 rounded-full animate-sound-wave-3" />
                    </div>
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Right tool: Send or Stop Button */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                Return ↵
              </span>
              {isLoading ? (
                <button
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors cursor-pointer border border-zinc-700/60 shadow-sm"
                  title="Stop response"
                >
                  <StopCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!hasInput}
                  className={`p-2 rounded-xl text-white transition-all duration-300 cursor-pointer ${
                    hasInput
                      ? "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 hover:opacity-95 shadow-lg shadow-indigo-500/30 scale-105 active:scale-95"
                      : "bg-zinc-850 text-zinc-600 cursor-not-allowed opacity-40"
                  }`}
                  title="Send prompt"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
