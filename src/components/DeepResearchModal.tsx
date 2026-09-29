import React, { useState } from "react";
import {
  X,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  BookOpen,
  Send,
  FileCheck,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface DeepResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReportToChat: (topic: string, reportContent: string) => void;
}

export const DeepResearchModal: React.FC<DeepResearchModalProps> = ({
  isOpen,
  onClose,
  onSaveReportToChat,
}) => {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [currentStep, setCurrentStep] = useState<string>("");
  const [queries, setQueries] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [report, setReport] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || status === "running") return;

    setStatus("running");
    setErrorMsg(null);
    setQueries([]);
    setActiveQuery("");
    setReport("");
    setCurrentStep("Deconstructing research topic & formulating exploration plan...");

    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Research request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream available.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.replace("data: ", "").trim();
          if (jsonStr === "[DONE]") {
            setStatus("completed");
            break;
          }

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              setErrorMsg(data.error);
              setStatus("error");
              break;
            }

            if (data.step === "planning") {
              setCurrentStep(data.message || "Planning investigation...");
            } else if (data.step === "queries_planned") {
              setQueries(data.queries || []);
            } else if (data.step === "searching") {
              setActiveQuery(data.query || "");
              setCurrentStep(`Searching Axis ${data.index}/${data.total}: "${data.query}"`);
            } else if (data.step === "synthesizing") {
              setCurrentStep("Synthesizing multi-source intelligence report...");
            } else if (data.step === "report_chunk") {
              setReport((prev) => prev + (data.text || ""));
            } else if (data.step === "complete") {
              setStatus("completed");
              setCurrentStep("Deep research briefing compiled successfully.");
            }
          } catch {
            // ignore partial JSON parse errors
          }
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "An unexpected error occurred during deep research.");
      setStatus("error");
    }
  };

  const handleInsertReport = () => {
    if (!report) return;
    onSaveReportToChat(topic, report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-100">Autonomous Deep Research Agent</h3>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Multi-Axis Grounding
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Executes multi-step web exploration, extracts facts, and synthesizes structured master reports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Research Input Form */}
          <form onSubmit={handleStartResearch} className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">
              Research Objective / Complex Query
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Commercial feasibility and technical bottlenecks of humanoid robots in 2026..."
                  disabled={status === "running"}
                  className="w-full pl-3.5 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === "running" || !topic.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {status === "running" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <span>Run Deep Research</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          {status === "idle" && (
            <div className="space-y-2">
              <span className="text-xs text-zinc-500">Popular Research Vectors:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "State of Quantum Computing & Error Correction in 2026",
                  "Semiconductor EUV vs High-NA Lithography Roadmap",
                  "Autonomous Agent Architectures in Enterprise Workflows",
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTopic(sug);
                    }}
                    className="text-xs text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 px-3 py-1.5 rounded-md transition-colors cursor-pointer text-left"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Execution Progress Trace */}
          {status !== "idle" && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Agent Progress Trace</span>
                <span className="text-zinc-500">
                  {status === "running" && "Execution in progress"}
                  {status === "completed" && "Finished"}
                  {status === "error" && "Encountered issue"}
                </span>
              </div>

              {/* Current Status Pill */}
              <div className="flex items-center gap-2.5 p-2.5 rounded bg-zinc-950/80 border border-zinc-800/60 text-xs">
                {status === "running" ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                ) : status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="text-zinc-200 font-mono text-[12px]">{currentStep}</span>
              </div>

              {/* Sub-queries Planned */}
              {queries.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold text-zinc-400">Target Investigation Axes:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {queries.map((q, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-xs font-mono transition-colors ${
                          activeQuery === q
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
                        }`}
                      >
                        <div className="text-[10px] text-zinc-500 font-sans">Axis {idx + 1}</div>
                        <div className="truncate">{q}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Generated Research Report Preview */}
          {report && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-zinc-200">
                    Grounded Master Report
                  </span>
                </div>
                {status === "completed" && (
                  <button
                    onClick={handleInsertReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Insert into Chat Session</span>
                  </button>
                )}
              </div>
              <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm max-h-[420px] overflow-y-auto">
                <MarkdownRenderer content={report} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
