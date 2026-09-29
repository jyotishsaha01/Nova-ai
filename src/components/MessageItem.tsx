import React, { useState } from "react";
import {
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileCode,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Message, Artifact } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ThinkingInspector } from "./ThinkingInspector";
import { AgentActivity } from "./AgentActivity";
import { GroundingCitations } from "./GroundingCitations";

interface MessageItemProps {
  message: Message;
  artifacts: Artifact[];
  onOpenArtifact: (artifact: Artifact) => void;
  agentModeName?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  artifacts,
  onOpenArtifact,
  agentModeName,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Find interactive app artifacts created by or referenced in this message
  const relevantArtifacts = artifacts.filter(
    (a) =>
      (a.type === "html" || a.type === "react") &&
      ((message.artifactIds && message.artifactIds.includes(a.id)) ||
        message.content.includes(a.title) ||
        message.content.includes(a.content.slice(0, 40)))
  );

  return (
    <div
      className={`nova-message py-6 px-4 md:px-6 transition-colors group ${
        isUser ? "nova-message--user" : "nova-message--assistant"
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5 select-none">
          {isUser ? (
            <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700/70 flex items-center justify-center text-zinc-300 shadow-xs">
              <User className="w-3.5 h-3.5" />
            </div>
          ) : (
            <img src="/nova-mark.svg" className="w-7 h-7 rounded-xl shadow-md" alt="Nova" />
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Metadata */}
          <div className="flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">
                {isUser ? "You" : agentModeName || "Nova"}
              </span>
              <span className="text-zinc-500 text-[11px] font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Quick Action buttons (Copy, TTS) visible on hover or active */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {!isUser && (
                <button
                  onClick={handleSpeech}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  title={isSpeaking ? "Stop voice playback" : "Read message aloud"}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Attachments (if user turn) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 max-w-sm shadow-xs"
                >
                  {att.type.startsWith("image/") ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-14 h-14 rounded-lg object-cover border border-zinc-800"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-1.5">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono text-[11px] truncate max-w-[140px]">{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Assistant Thinking / Reasoning Inspector */}
          {!isUser && (
            message.toolCalls?.length ? <AgentActivity steps={message.toolCalls} /> : <ThinkingInspector
                thoughtText={message.thought}
                isStreaming={message.isStreaming}
              />
          )}

          {/* Message Body */}
          <div className="text-sm">
            {isUser ? (
              <p className="whitespace-pre-wrap text-zinc-100 leading-relaxed font-normal">{message.content}</p>
            ) : (
              <MarkdownRenderer
                content={message.content}
                onOpenArtifact={onOpenArtifact}
                detectedArtifacts={artifacts}
              />
            )}
          </div>

          {/* Assistant Grounding Web Citations */}
          {!isUser && <GroundingCitations metadata={message.groundingMetadata} />}

          {/* Prominent Artifact Sandbox Cards */}
          {!isUser && relevantArtifacts.length > 0 && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {relevantArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onOpenArtifact(art)}
                  className="flex items-center justify-between p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all group cursor-pointer shadow-sm hover:border-indigo-500/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-200 truncate">
                        {art.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {art.type.toUpperCase()} · v{art.version} · Click to run
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
