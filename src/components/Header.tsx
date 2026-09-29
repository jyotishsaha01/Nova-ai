import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Sliders,
  PanelRight,
  Plus,
  Search,
  Code2,
  LineChart,
  Feather,
  ChevronDown,
  Brain,
  FileAudio,
  LogOut,
  Palette,
  Layers,
  Check,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { AgentMode, AnimatedTheme } from "../types";
import { AGENT_PERSONAS } from "../constants/agentPersonas";
import { ThemeSelector } from "./ThemeSelector";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  currentMode: AgentMode;
  onSelectMode: (mode: AgentMode) => void;
  model: string;
  provider?: "gemini" | "groq" | "openrouter" | "cloudflare";
  providerHealthRefreshKey?: number;
  latestResponseText?: string;
  maxResponseTokens: number;
  onSelectProvider?: (provider: "gemini" | "groq" | "openrouter" | "cloudflare") => void;
  onSelectModel?: (model: string) => void;
  currentTheme?: AnimatedTheme;
  onSelectTheme?: (theme: AnimatedTheme) => void;
  hasArtifacts: boolean;
  artifactCount: number;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenDeepResearch: () => void;
  onOpenTranscribe: () => void;
  onOpenCreativeStudio: () => void;
  enableSearch: boolean;
  onOpenAdminInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  model,
  provider = "gemini",
  providerHealthRefreshKey = 0,
  latestResponseText = "",
  maxResponseTokens,
  onSelectProvider,
  onSelectModel,
  currentTheme = "space",
  onSelectTheme,
  hasArtifacts,
  artifactCount,
  isCanvasOpen,
  onToggleCanvas,
  onNewChat,
  onOpenSettings,
  onOpenDeepResearch,
  onOpenTranscribe,
  onOpenCreativeStudio,
  onOpenAdminInfo,
}) => {
  const { currentUser, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [providerHealth, setProviderHealth] = useState<Array<{ id: string; name: string; status: string; configured: boolean; missing: string[]; quota: { kind?: string; remaining?: number | null; limit?: number | null; used?: number | null; reset?: string; remainingTokens?: number | null; tokenLimit?: number | null; remainingRequests?: number | null; resetTokens?: string | null; resetRequests?: string | null; observedAt?: string } | null; checkedAt?: string }>>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  const personaRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);

  const refreshProviderHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch("/api/provider-health", { cache: "no-store" });
      if (!response.ok) throw new Error("Provider check failed");
      const data = await response.json();
      setProviderHealth(data.providers || []);
    } catch {
      setProviderHealth([]);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => { void refreshProviderHealth(); }, [providerHealthRefreshKey]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setShowPersonaMenu(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) setProviderMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPersona = AGENT_PERSONAS[currentMode] || AGENT_PERSONAS.general;

  const modeIcons: Record<string, React.ReactNode> = {
    general: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
    deep_research: <Search className="w-3.5 h-3.5 text-emerald-400" />,
    code_architect: <Code2 className="w-3.5 h-3.5 text-violet-400" />,
    analyst: <LineChart className="w-3.5 h-3.5 text-amber-400" />,
    creative: <Feather className="w-3.5 h-3.5 text-rose-400" />,
  };

  const providerNames = { gemini: "Gemini", groq: "Groq", openrouter: "OpenRouter", cloudflare: "Cloudflare" };
  const modelNames: Record<string, string> = {
    "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
    "gemini-3.8-flash": "Gemini 3.8 Flash",
    "openai/gpt-oss-120b": "GPT OSS 120B",
    "openai/gpt-oss-20b": "GPT OSS 20B",
    "llama-3.3-70b-versatile": "Llama 3.3 70B",
    "openrouter/free": "OpenRouter Free",
    "nvidia/nemotron-3-super-120b-a12b:free": "Nemotron 3 Super · Free",
    "@cf/openai/gpt-oss-120b": "GPT OSS 120B",
    "@cf/openai/gpt-oss-20b": "GPT OSS 20B",
  };
  const modelLabel = modelNames[model] || model;
  const selectedHealth = providerHealth.find((item) => item.id === provider);
  const providerDisplayStatus = selectedHealth?.status === "connected" ? "Connected" : selectedHealth?.status === "invalid_key" ? "Key invalid" : selectedHealth?.status === "unavailable" ? "Unavailable" : selectedHealth?.status === "setup_needed" ? "Setup needed" : "Check status";
  const formatCredit = (value: number | null | undefined) => value == null ? "not reported" : `$${value.toFixed(2)}`;
  const quota = selectedHealth?.quota;
  const providerQuotaPercent = quota?.kind === "rate_limit" && quota.remainingTokens != null && quota.tokenLimit
    ? Math.min(100, Math.max(0, (quota.remainingTokens / quota.tokenLimit) * 100))
    : quota?.kind === "credits" && quota.remaining != null && quota.limit
      ? Math.min(100, Math.max(0, (quota.remaining / quota.limit) * 100))
      : null;
  const estimatedResponseTokens = Math.ceil(latestResponseText.length / 4);
  const estimatedTokensRemaining = Math.max(0, maxResponseTokens - estimatedResponseTokens);
  const estimatedResponseRemainingPercent = Math.max(0, 100 - (estimatedResponseTokens / maxResponseTokens) * 100);
  const quotaPercent = providerQuotaPercent ?? estimatedResponseRemainingPercent;
  const providerQuotaNote = quota?.kind === "rate_limit" && quota.remainingTokens != null
    ? `${quota.remainingTokens.toLocaleString()} tokens/min remain${quota.tokenLimit == null ? "" : ` of ${quota.tokenLimit.toLocaleString()}`}${quota.resetTokens ? ` · resets in ${quota.resetTokens}` : ""}. `
    : quota?.kind === "credits" && quota.remaining != null
      ? `${formatCredit(quota.remaining)} provider credits remain${quota.limit == null ? " (provider did not report a total limit)" : ` of ${formatCredit(quota.limit)}`}. `
      : `Live token balance is not exposed by ${providerNames[provider]}'s API. `;
  const quotaText = providerQuotaPercent != null
    ? quota?.kind === "rate_limit"
      ? `${quota.remainingTokens?.toLocaleString()} tokens/min remaining of ${quota.tokenLimit?.toLocaleString()}.`
      : `${formatCredit(quota?.remaining)} credits remaining of ${formatCredit(quota?.limit)}.`
    : `${providerQuotaNote}Estimated latest answer: ~${estimatedResponseTokens.toLocaleString()} of ${maxResponseTokens.toLocaleString()} response tokens used; ~${estimatedTokensRemaining.toLocaleString()} remain. Estimate uses about 4 characters per token and is not an account quota.`;
  const quotaFillColor = quotaPercent < 15 ? "#ef4444" : quotaPercent < 35 ? "#f59e0b" : "#10b981";
  const providerOptions = [
    { id: "gemini", name: "Google Gemini" },
    { id: "groq", name: "Groq" },
    { id: "openrouter", name: "OpenRouter" },
    { id: "cloudflare", name: "Cloudflare Workers AI" },
  ] as const;

  return (
    <header className="nova-header h-13 px-3.5 md:px-5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: Brand + Unified Persona/Model Selector */}
      <div className="flex items-center gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 font-bold text-sm text-zinc-100 tracking-tight">
          <img className="nova-mark h-7 w-7 rounded-[10px]" src="/nova-mark.svg" alt="" />
          <span className="hidden sm:inline font-semibold text-zinc-100">Nova</span>
        </div>

        {/* Separator */}
        <span className="hidden sm:inline text-zinc-700" aria-hidden="true">/</span>

        {/* Unified Mode & Model Selector Dropdown */}
        <div className="relative" ref={personaRef}>
          <button
            onClick={() => {
              setShowPersonaMenu(!showPersonaMenu);
              setShowToolsMenu(false);
              setShowUserMenu(false);
            }}
            className="nova-persona-button flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/90 text-xs text-zinc-200 transition-colors cursor-pointer"
            title="Configure intelligence mode and neural engine"
          >
            {modeIcons[currentMode]}
            <span className="nova-persona-name font-medium text-zinc-200">{currentPersona.name}</span>
            <span className="nova-model-label text-[11px] font-mono text-zinc-400">· {modelLabel}</span>
            <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-150 ${showPersonaMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Flyout Menu */}
          {showPersonaMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-72 p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Persona Options */}
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Agent Intelligence Persona
              </div>
              <div className="space-y-0.5 mb-2">
                {Object.values(AGENT_PERSONAS).map((persona) => {
                  const isSelected = currentMode === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        onSelectMode(persona.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-zinc-800 text-white font-medium"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0">{modeIcons[persona.id]}</div>
                        <div className="truncate">
                          <div className="text-xs">{persona.name}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{persona.tagline}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Model Speed / Engine Selector */}
              {onSelectModel && provider === "gemini" && (
                <>
                  <div className="border-t border-zinc-800/80 pt-2 px-2 pb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Neural Engine
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    <button
                      onClick={() => {
                        onSelectModel("gemini-3.1-flash-lite");
                        setShowPersonaMenu(false);
                      }}
                      className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                        model === "gemini-3.1-flash-lite"
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-200"
                          : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center gap-1">
                        <Brain className="w-3 h-3 text-indigo-400" />
                        <span>Fast Engine</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Instant low-latency</div>
                    </button>

                    <button
                      onClick={() => {
                        onSelectModel("gemini-3.8-flash");
                        setShowPersonaMenu(false);
                      }}
                      className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                        model === "gemini-3.8-flash"
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-200"
                          : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span>Ultra Engine</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Deep multi-step reasoning</div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary provider switcher and live provider health */}
      <div className="nova-provider-control relative hidden md:block" ref={providerMenuRef}>
        <button type="button" onClick={() => { const next = !providerMenuOpen; setProviderMenuOpen(next); if (next) void refreshProviderHealth(); }} className="nova-provider-control-button flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/90" aria-expanded={providerMenuOpen} title={`${providerNames[provider]} · ${providerDisplayStatus}. Select AI provider and view health.`}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${selectedHealth?.status === "connected" ? "bg-emerald-400" : selectedHealth?.status === "unavailable" || selectedHealth?.status === "invalid_key" ? "bg-rose-400" : "bg-amber-400"}`} />
          <span>{providerNames[provider]}</span>
          <span className="nova-quota-meter" role="img" aria-label={quotaText} title={quotaText}>
            <span className="nova-quota-meter-fill" style={{ width: `${quotaPercent ?? 0}%`, backgroundColor: quotaFillColor }} />
          </span>
          <span className="nova-quota-meter-label" title={quotaText}>{providerQuotaPercent == null ? `~${Math.round(quotaPercent)}%` : `${Math.round(quotaPercent)}%`}</span>
          <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${providerMenuOpen ? "rotate-180" : ""}`} />
        </button>
        {providerMenuOpen && <div className="nova-provider-popover absolute left-1/2 top-full z-50 mt-2 w-[min(390px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3"><div><div className="text-xs font-semibold text-zinc-100">AI provider health</div><div className="mt-0.5 text-[10px] text-zinc-500">Choose the provider for your chats</div></div><button type="button" onClick={() => void refreshProviderHealth()} disabled={healthLoading} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Refresh provider health"><RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? "animate-spin" : ""}`} /></button></div>
          <div className="space-y-1 p-2">{providerOptions.map((option) => {
            const item = providerHealth.find((entry) => entry.id === option.id);
            const isSelected = provider === option.id;
            const status = item?.status || (healthLoading ? "checking" : "unknown");
            const statusLabel = status === "connected" ? "Connected" : status === "setup_needed" ? `Needs ${item?.missing.join(" + ") || "server credentials"}` : status === "invalid_key" ? "Credential rejected" : status === "unavailable" ? "Could not reach provider" : status === "checking" ? "Checking…" : "Not checked";
            const quotaLabel = item?.quota?.kind === "credits" ? `Credits remaining: ${formatCredit(item.quota.remaining)}${item.quota.limit == null ? "" : ` of ${formatCredit(item.quota.limit)}`}${item.quota.reset ? ` · resets ${item.quota.reset}` : ""}` : item?.quota?.kind === "rate_limit" && item.quota.remainingTokens != null ? `${item.quota.remainingTokens.toLocaleString()} tokens/min remaining${item.quota.tokenLimit == null ? "" : ` of ${item.quota.tokenLimit.toLocaleString()}`}${item.quota.resetTokens ? ` · resets in ${item.quota.resetTokens}` : ""}` : option.id === "gemini" ? "Quota: Google AI Studio (not exposed as a live key balance)" : option.id === "cloudflare" ? "10K free neurons/day; live usage in Cloudflare dashboard" : "Rate-limit balance appears after a successful request";
            return <button key={option.id} type="button" onClick={() => { onSelectProvider?.(option.id); setProviderMenuOpen(false); }} className={`w-full rounded-xl border p-2.5 text-left transition-colors ${isSelected ? "border-indigo-400/40 bg-indigo-400/10" : "border-transparent hover:bg-zinc-900"}`}>
              <span className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-semibold text-zinc-100">{status === "connected" ? <CircleCheck className="h-3.5 w-3.5 text-emerald-400" /> : <CircleAlert className={`h-3.5 w-3.5 ${status === "invalid_key" || status === "unavailable" ? "text-rose-400" : "text-amber-300"}`} />}{option.name}</span><span className="text-[10px] font-medium text-zinc-400">{isSelected ? "SELECTED" : "SELECT"}</span></span>
              <span className="mt-1 block pl-[22px] text-[10px] text-zinc-400">{statusLabel}</span><span className="mt-0.5 block pl-[22px] text-[10px] text-zinc-500">{quotaLabel}</span>
            </button>;
          })}</div>
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5"><span className="text-[10px] text-zinc-500">Exact free quota is provider/model specific.</span><button type="button" onClick={() => { setProviderMenuOpen(false); onOpenSettings(); }} className="text-[10px] font-semibold text-indigo-300 hover:text-indigo-200">Setup & models <ExternalLink className="ml-1 inline h-3 w-3" /></button></div>
        </div>}
      </div>

      {/* Right Controls: Unified Capabilities Menu, Canvas, New Chat, Settings & Profile */}
      <div className="nova-header-controls flex items-center gap-1.5 sm:gap-2">
        {/* Unified Capabilities / Tools Menu */}
        <div className="relative" ref={toolsRef}>
          <button
            onClick={() => {
              setShowToolsMenu(!showToolsMenu);
              setShowPersonaMenu(false);
              setShowUserMenu(false);
            }}
            className={`nova-tools-button flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showToolsMenu
                ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                : "bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-zinc-100"
            }`}
            title="Access Creative Studio, Deep Research, and Audio tools"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="nova-tools-label font-medium">Tools</span>
            <ChevronDown className={`nova-tools-chevron w-3 h-3 text-zinc-500 transition-transform duration-150 ${showToolsMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Tools Flyout Cards Dropdown */}
          {showToolsMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-76 p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Autonomous Capabilities
              </div>
              <div className="space-y-1">
                {/* 1. Creative Studio */}
                <button
                  onClick={() => {
                    onOpenCreativeStudio();
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-500/25">
                    <Palette className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                      Creative Studio
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                      Generate visual artwork, soundscapes & media concepts
                    </div>
                  </div>
                </button>

                {/* 2. Deep Research */}
                <button
                  onClick={() => {
                    onOpenDeepResearch();
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500/25">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                      Deep Research Agent
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                      Multi-step autonomous web research with comprehensive synthesis
                    </div>
                  </div>
                </button>

                {/* 3. Audio Transcription */}
                <button
                  onClick={() => {
                    onOpenTranscribe();
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500/25">
                    <FileAudio className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                      Audio Transcription
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                      Transcribe speech recordings and voice memos into text
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3D Animated Theme Selector */}
        {onSelectTheme && (
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />
        )}

        {/* Artifacts Canvas Toggle */}
        <button
          onClick={onToggleCanvas}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isCanvasOpen
              ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200"
              : hasArtifacts
              ? "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-600"
              : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
          }`}
          title="Toggle interactive code canvas sandbox"
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Canvas</span>
          {artifactCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
              {artifactCount}
            </span>
          )}
        </button>

        {/* New Chat Primary Action */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Settings & System Configuration"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {onOpenAdminInfo && (
          <button onClick={onOpenAdminInfo} className="nova-admin-control p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-indigo-300 transition-colors cursor-pointer" title="System Architect & Admin Profile">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {currentUser && <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowToolsMenu(false); setShowPersonaMenu(false); }}
            className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 cursor-pointer transition-colors"
            title={currentUser.displayName || currentUser.email || "Account"}
          >
            {currentUser.photoURL ? <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-medium">{(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}</div>}
          </button>
          {showUserMenu && <div className="absolute right-0 top-full mt-1.5 w-52 p-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="px-2 py-1.5 border-b border-zinc-800 mb-1">
              <div className="font-semibold text-zinc-100 truncate">{currentUser.displayName || "Authenticated User"}</div>
              <div className="text-[11px] text-zinc-400 truncate">{currentUser.email}</div>
            </div>
            {onOpenAdminInfo && <button onClick={() => { onOpenAdminInfo(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors mb-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /><span>Admin & Creator Info</span></button>}
            <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg text-rose-400 hover:bg-zinc-800 cursor-pointer transition-colors"><LogOut className="w-3.5 h-3.5" /><span>Sign Out</span></button>
          </div>}
        </div>}

      </div>
    </header>
  );
};
