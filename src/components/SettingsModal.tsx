import React, { useEffect, useRef, useState } from "react";
import { X, Sliders, ShieldCheck, Cpu, Globe, Brain, MapPin, Database, Upload, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { RagDocument } from "../utils/ragEngine";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: string;
  setModel: (m: string) => void;
  provider: "gemini" | "groq" | "openrouter" | "cloudflare";
  setProvider: (provider: "gemini" | "groq" | "openrouter" | "cloudflare") => void;
  maxResponseTokens: number;
  setMaxResponseTokens: (value: number) => void;
  enableSearch: boolean;
  setEnableSearch: (val: boolean) => void;
  enableMaps: boolean;
  setEnableMaps: (val: boolean) => void;
  thinkingLevel: "MINIMAL" | "LOW" | "HIGH";
  setThinkingLevel: (val: "MINIMAL" | "LOW" | "HIGH") => void;
  customSystemPrompt: string;
  setCustomSystemPrompt: (val: string) => void;
  onOpenAdminInfo?: () => void;
  ragDocuments: RagDocument[];
  onImportKnowledge: (file: File) => Promise<void>;
  onDeleteKnowledge: (id: string) => void;
  ragEnabled: boolean;
  setRagEnabled: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  model,
  setModel,
  provider,
  setProvider,
  maxResponseTokens,
  setMaxResponseTokens,
  enableSearch,
  setEnableSearch,
  enableMaps,
  setEnableMaps,
  thinkingLevel,
  setThinkingLevel,
  customSystemPrompt,
  setCustomSystemPrompt,
  onOpenAdminInfo,
  ragDocuments,
  onImportKnowledge,
  onDeleteKnowledge,
  ragEnabled,
  setRagEnabled,
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [providerStatus, setProviderStatus] = useState<Record<string, { status: string; missing: string[] }>>({});
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/provider-health", { cache: "no-store" }).then((response) => response.json()).then((health) => {
      setProviderStatus(Object.fromEntries((health.providers || []).map((item: { id: string; status: string; missing?: string[] }) => [item.id, { status: item.status, missing: item.missing || [] }])));
    }).catch(() => setProviderStatus({}));
  }, [isOpen]);
  const providerIds = ["gemini", "groq", "openrouter", "cloudflare"] as const;
  const providerChecksComplete = providerIds.every((id) => providerStatus[id] !== undefined);
  const allProvidersConnected = providerChecksComplete && providerIds.every((id) => providerStatus[id].status === "connected");
  const providersNeedingSetup = providerIds.flatMap((id) => providerStatus[id]?.status === "setup_needed" ? providerStatus[id].missing : []);
  const hasRejectedKey = providerIds.some((id) => providerStatus[id]?.status === "invalid_key");
  const hasUnavailableProvider = providerIds.some((id) => providerStatus[id]?.status === "unavailable");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Agent & Model Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Provider selection and quota failover */}
          <section className="space-y-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
            <div className="flex items-center gap-2 text-zinc-200 font-medium"><Cpu className="w-4 h-4 text-violet-400" /><span>AI provider & automatic quota fallback</span></div>
            <p className="text-[11px] text-zinc-400">Choose a preferred provider. If it is rate limited or unavailable before streaming starts, Nova tries the other configured providers automatically.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                ["gemini", "Google Gemini", "GEMINI_API_KEY"],
                ["groq", "Groq", "GROQ_API_KEY"],
                ["openrouter", "OpenRouter", "OPENROUTER_API_KEY"],
                ["cloudflare", "Cloudflare Workers AI", "CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID"],
              ] as const).map(([id, name, envName]) => (
                <button key={id} type="button" onClick={() => setProvider(id)} className={`rounded-lg border p-2.5 text-left transition-colors ${provider === id ? "border-violet-400/60 bg-violet-500/10" : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900"}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-zinc-100">{name}</span><span className={`h-2 w-2 rounded-full ${providerStatus[id]?.status === "connected" ? "bg-emerald-400" : providerStatus[id]?.status === "invalid_key" || providerStatus[id]?.status === "unavailable" ? "bg-rose-400" : "bg-amber-400"}`} title={providerStatus[id]?.status || "Not checked"} /></div>
                  <div className="mt-1 text-[10px] text-zinc-500">{providerStatus[id]?.status === "connected" ? "Connected and ready" : providerStatus[id]?.status === "invalid_key" ? "Key rejected · replace it" : providerStatus[id]?.status === "unavailable" ? "Provider check failed · retry" : providerStatus[id]?.status === "setup_needed" ? `Missing ${providerStatus[id].missing.join(" + ")}` : `Needs ${envName}`}</div>
                </button>
              ))}
            </div>
            {allProvidersConnected ? (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-[10px] leading-relaxed text-emerald-900">
                All four providers are connected and ready. Credentials are loaded from Nova’s server environment.
              </div>
            ) : (
              <div className="rounded-lg border border-amber-400/15 bg-amber-300/[0.05] p-2.5 text-[10px] leading-relaxed text-zinc-400">
                {!providerChecksComplete ? <><strong className="text-amber-200">Checking provider setup…</strong> Status appears here as soon as the server check completes.</> : <>
                  <strong className="text-amber-200">Provider setup needs attention.</strong>{" "}
                  {providersNeedingSetup.length > 0 && <>Missing server variable{providersNeedingSetup.length > 1 ? "s" : ""}: {providersNeedingSetup.map((name) => <code key={name} className="text-zinc-200">{name} </code>)}. Add the values to Nova’s local <code className="text-zinc-200">.env</code> file and restart the server. </>}
                  {hasRejectedKey && <>At least one provider rejected its key; replace that credential in <code className="text-zinc-200">.env</code> and restart Nova. </>}
                  {hasUnavailableProvider && <>At least one provider could not be reached; check connectivity and refresh the health check. </>}
                  Keep <code className="text-zinc-200">.env</code> private and never commit it.
                </>}
              </div>
            )}
            <p className="text-[10px] text-zinc-500">Quota visibility depends on the provider: OpenRouter reports remaining key credits; Groq reports its current rate window after a chat request; Gemini and Cloudflare expose usage in their dashboards, not a live token balance through this API.</p>
          </section>

          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>{provider === "gemini" ? "Google Gemini models" : provider === "groq" ? "Groq model" : provider === "openrouter" ? "OpenRouter model" : "Cloudflare model"}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {provider !== "gemini" && (() => {
                const options: string[][] = provider === "groq" ? [["openai/gpt-oss-120b", "GPT OSS 120B", "Long context · up to 65K output tokens"], ["openai/gpt-oss-20b", "GPT OSS 20B", "Fast reasoning · up to 65K output tokens"], ["llama-3.3-70b-versatile", "Llama 3.3 70B", "Strong general-purpose chat"]] : provider === "openrouter" ? [["nvidia/nemotron-3-super-120b-a12b:free", "Nemotron 3 Super · Free", "Pinned model for consistent replies · tested"], ["openrouter/free", "OpenRouter Free Router", "Randomly selects a free model; replies may vary"]] : [["@cf/openai/gpt-oss-120b", "GPT OSS 120B", "128K context · high reasoning"], ["@cf/openai/gpt-oss-20b", "GPT OSS 20B", "128K context · lower latency"]];
                return options.map(([id, name, detail]) => <label key={id} onClick={() => setModel(id)} className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer ${model === id ? "bg-indigo-500/10 border-indigo-500/50" : "bg-zinc-900/60 border-zinc-800"}`}><div><div className="font-semibold text-zinc-100">{name}</div><div className="text-[11px] text-zinc-400 mt-0.5">{detail}</div></div><input type="radio" name="model" checked={model === id} onChange={() => setModel(id)} className="mt-1" /></label>);
              })()}
              {provider === "gemini" && <>
              <label
                onClick={() => setModel("gemini-3.1-flash-lite")}
                className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  model === "gemini-3.1-flash-lite"
                    ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-200"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <div>
                  <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>Nova Neural Engine Fast</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">Fast</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Low-latency chat for everyday tasks. Google AI plan limits apply.
                  </div>
                </div>
                <input
                  type="radio"
                  name="model"
                  checked={model === "gemini-3.1-flash-lite"}
                  onChange={() => setModel("gemini-3.1-flash-lite")}
                  className="mt-1 text-indigo-500"
                />
              </label>

              <label
                onClick={() => setModel("gemini-3.8-flash")}
                className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  model === "gemini-3.8-flash"
                    ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-200"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <div>
                  <div className="font-semibold text-zinc-100">Nova Neural Engine Ultra</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Higher reasoning depth with Google Search grounding support.
                  </div>
                </div>
                <input
                  type="radio"
                  name="model"
                  checked={model === "gemini-3.8-flash"}
                  onChange={() => setModel("gemini-3.8-flash")}
                  className="mt-1 text-indigo-500"
                />
              </label>
              </>}
            </div>
          </div>

          <section className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="flex items-center gap-2 text-zinc-200 font-medium"><Brain className="w-4 h-4 text-indigo-400" /><span>Maximum response length</span></div>
            <div className="grid grid-cols-4 gap-1.5">
              {[4096, 8192, 16384, 32768].map((value) => <button key={value} type="button" onClick={() => setMaxResponseTokens(value)} className={`rounded-lg border py-2 text-[11px] font-semibold transition-colors ${maxResponseTokens === value ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"}`}>{value >= 1000 ? `${value / 1024}K` : value}</button>)}
            </div>
            <p className="text-[10px] text-zinc-500">Output ceiling per answer. Provider context windows, plan quotas, and model output limits still apply.</p>
          </section>

          {/* Reasoning & Thinking Level */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Thinking & Reasoning Level</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["MINIMAL", "LOW", "HIGH"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setThinkingLevel(lvl)}
                  className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                    thinkingLevel === lvl
                      ? "bg-purple-500/10 border-purple-500/50 text-purple-300 font-semibold"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  <div className="text-xs">{lvl}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {lvl === "HIGH" ? "Deep Chain" : lvl === "LOW" ? "Balanced" : "Fastest"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Local semantic knowledge library */}
          <section className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-medium text-zinc-200">
                <Database className="h-4 w-4 text-indigo-400" />
                <span>Private Knowledge (RAG)</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={ragEnabled} onChange={(event) => setRagEnabled(event.target.checked)} className="sr-only peer" />
                <div className="h-5 w-9 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all peer-checked:bg-indigo-500 peer-checked:after:translate-x-full" />
              </label>
            </div>
            <p className="text-[11px] text-zinc-400">Add text and Markdown files. Relevant passages are embedded and retrieved for this chat. Library is stored in this browser.</p>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.html,.css,.ts,.tsx,.js,.py,text/*" className="hidden" onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setImportError(""); setIsImporting(true);
              try { await onImportKnowledge(file); } catch (error) { setImportError(error instanceof Error ? error.message : "Could not import this document."); }
              finally { setIsImporting(false); }
            }} />
            <button type="button" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">
              <Upload className="h-3.5 w-3.5" /> {isImporting ? "Embedding document…" : "Add a text document"}
            </button>
            {importError && <p role="alert" className="text-[11px] text-rose-300">{importError}</p>}
            {ragDocuments.length > 0 ? <ul className="max-h-28 space-y-1 overflow-y-auto">
              {ragDocuments.map((document) => <li key={document.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/70 px-2 py-1.5 text-[11px] text-zinc-300">
                <span className="min-w-0 truncate">{document.title} <span className="text-zinc-500">· {document.chunkCount} passages</span></span>
                <button type="button" onClick={() => onDeleteKnowledge(document.id)} aria-label={`Remove ${document.title}`} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>)}
            </ul> : <p className="text-[11px] text-zinc-500">No documents added yet.</p>}
          </section>

          {/* Google Search Grounding */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium text-zinc-200">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Google Search Web Grounding</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Augment answers with live real-time web citations and sources.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => {
                  setEnableSearch(e.target.checked);
                  if (e.target.checked) setEnableMaps(false);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Google Maps Grounding */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium text-zinc-200">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Google Maps Grounding</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Ground locations, places, and spatial routing data.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableMaps}
                onChange={(e) => {
                  setEnableMaps(e.target.checked);
                  if (e.target.checked) setEnableSearch(false);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-medium">Custom System Prompt Override</label>
            <textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="Leave blank to use default Persona prompt instructions..."
              rows={3}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Creator & Admin Attribution */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white">JS</div>
              <div><div className="font-semibold text-zinc-200">Jyotish Saha</div><div className="text-zinc-500">System Architect & Creator of Nova</div></div>
            </div>
            {onOpenAdminInfo && <button onClick={() => { onClose(); onOpenAdminInfo(); }} className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 hover:text-white transition-colors cursor-pointer text-xs font-medium">Contact Admin</button>}
          </div>

          {/* Auth & Database Status */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-300">Firebase & Firestore Integration:</span>
              <div className="mt-0.5">{currentUser ? `Signed in as ${currentUser.email} (${currentUser.uid.slice(0, 8)}...). Sessions synced to Cloud Firestore.` : "Running in local memory mode. Sign in with Google to sync sessions to your Firestore database."}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
