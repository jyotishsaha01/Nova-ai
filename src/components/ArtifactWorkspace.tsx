import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Code2,
  Copy,
  Check,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  FileText,
  Sparkles,
  Layers,
} from "lucide-react";
import { Artifact } from "../types";
import { buildSandboxedHtml } from "../utils/artifactDetector";

interface ArtifactWorkspaceProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
  onClose: () => void;
}

export const ArtifactWorkspace: React.FC<ArtifactWorkspaceProps> = ({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0];

  useEffect(() => {
    // If artifact changes and is markdown or python, default to code or preview appropriately
    if (activeArtifact) {
      if (activeArtifact.type === "python" || activeArtifact.type === "json") {
        setActiveTab("code");
      } else {
        setActiveTab("preview");
      }
    }
  }, [activeArtifactId]);

  if (!activeArtifact) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      html: "html",
      react: "tsx",
      svg: "svg",
      python: "py",
      json: "json",
      markdown: "md",
      javascript: "js",
    };
    const ext = extMap[activeArtifact.type] || "txt";
    const filename = `${activeArtifact.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${ext}`;
    const blob = new Blob([activeArtifact.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const sandboxedHtml = buildSandboxedHtml(activeArtifact);
  const linesCount = activeArtifact.content.split("\n").length;

  return (
    <div
      className={`flex flex-col bg-zinc-950 border-l border-zinc-800 transition-all duration-200 z-30 ${
        isFullScreen
          ? "fixed inset-0 w-full h-full z-50"
          : "w-full lg:w-[500px] xl:w-[600px] 2xl:w-[680px] shrink-0 h-full"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100 truncate">{activeArtifact.title}</h2>
              <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">
                v{activeArtifact.version}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="uppercase">{activeArtifact.type}</span>
              <span>·</span>
              <span>{linesCount} lines</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Preview / Code Tab Switcher */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 mr-1">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === "preview"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === "code"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          {activeTab === "preview" && (
            <button
              onClick={handleReload}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Reload sandbox preview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Download artifact file"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:block"
            title={isFullScreen ? "Exit Fullscreen" : "Maximize Canvas"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Artifacts Selector Tabs (if multiple artifacts exist) */}
      {artifacts.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-950 overflow-x-auto">
          <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {artifacts.map((art) => (
            <button
              key={art.id}
              onClick={() => onSelectArtifact(art.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors cursor-pointer ${
                art.id === activeArtifact.id
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60"
              }`}
            >
              <span>{art.title}</span>
              <span className="text-[10px] text-zinc-500">v{art.version}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-hidden relative bg-zinc-950">
        {activeTab === "preview" ? (
          <iframe
            key={iframeKey}
            srcDoc={sandboxedHtml}
            title={activeArtifact.title}
            sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
            className="w-full h-full border-0 bg-zinc-950"
          />
        ) : (
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs text-zinc-200 leading-relaxed bg-zinc-950">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80 text-[11px] text-zinc-500">
              <span>File: {activeArtifact.title}</span>
              <span>Syntax: {activeArtifact.language}</span>
            </div>
            <pre className="overflow-x-auto">
              <code>{activeArtifact.content}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/60 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Live Interactive Sandbox</span>
        </div>
        <div>Press Esc or Close to return to chat</div>
      </div>
    </div>
  );
};
