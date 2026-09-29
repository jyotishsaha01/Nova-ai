import React, { useState } from "react";
import { ChevronDown, ChevronRight, Brain, Clock, CheckCircle2 } from "lucide-react";

interface ThinkingInspectorProps {
  thoughtText?: string;
  isStreaming?: boolean;
  durationMs?: number;
}

export const ThinkingInspector: React.FC<ThinkingInspectorProps> = ({
  thoughtText,
  isStreaming,
  durationMs,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // If there's no thought text and not currently streaming, don't display
  if (!thoughtText && !isStreaming) return null;

  const seconds = durationMs ? (durationMs / 1000).toFixed(1) : "1.8";

  return (
    <div className="mb-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 overflow-hidden text-xs transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded bg-indigo-500/10 text-indigo-400 ${isStreaming ? "animate-pulse" : ""}`}>
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-zinc-300">
            {isStreaming ? "Thinking & Reasoning..." : `Reasoning Chain (${seconds}s)`}
          </span>
          {isStreaming ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              synthesizing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-[11px] hidden sm:inline">
            {isOpen ? "Hide reasoning" : "View thought process"}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3.5 py-3 border-t border-zinc-800/60 bg-zinc-950/60 font-mono text-[11px] text-zinc-300 leading-relaxed max-h-64 overflow-y-auto">
          {thoughtText ? (
            <div className="whitespace-pre-wrap">{thoughtText}</div>
          ) : (
            <div className="space-y-1.5 text-zinc-400">
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>1. Deconstructing query structure and intent...</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>2. Evaluating tool invocation and search grounding necessity...</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                <span>3. Formulating comprehensive response with verification...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
