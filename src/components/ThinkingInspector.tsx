import React from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

interface ThinkingInspectorProps {
  thoughtText?: string;
  isStreaming?: boolean;
  durationMs?: number;
}

export const ThinkingInspector: React.FC<ThinkingInspectorProps> = ({ thoughtText, isStreaming }) => {
  if (thoughtText) {
    return (
      <div className="mb-3 rounded-xl border border-indigo-300/20 bg-slate-950/70 px-3.5 py-3 text-xs text-zinc-300">
        <div className="mb-1.5 flex items-center gap-2 font-medium text-indigo-200"><Sparkles className="h-3.5 w-3.5" />Response summary</div>
        <p className="whitespace-pre-wrap leading-relaxed">{thoughtText}</p>
      </div>
    );
  }
  if (!isStreaming) return null;
  return (
    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-slate-950/65 px-3 py-1.5 text-[11px] text-indigo-200">
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      Generating response
    </div>
  );
};
