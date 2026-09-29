import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Palette,
  FileAudio,
  Wand2,
  ShieldCheck,
} from "lucide-react";
import { ChatSession, AgentMode } from "../types";
import { PROMPT_TEMPLATES } from "../constants/agentPersonas";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onSelectPromptTemplate: (prompt: string, mode: AgentMode) => void;
  onOpenCreativeStudio?: () => void;
  onOpenDeepResearch?: () => void;
  onOpenTranscribe?: () => void;
  onOpenAdminInfo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onSelectPromptTemplate,
  onOpenCreativeStudio,
  onOpenDeepResearch,
  onOpenTranscribe,
  onOpenAdminInfo,
}) => {
  const [activeTab, setActiveTab] = useState<"history" | "templates">("history");

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`nova-sidebar fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-zinc-950 border-r border-zinc-800/80 transition-all duration-200 ${
          isOpen ? "w-64" : "w-0 lg:w-16"
        } overflow-hidden select-none`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800/80 h-13">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img className="nova-mark h-7 w-7 rounded-[10px]" src="/nova-mark.svg" alt="" />
                <span className="font-semibold text-xs tracking-tight text-zinc-200">
                  Nova workspace
                </span>
              </div>
              <button
                onClick={onToggle}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Chat Primary Button */}
        <div className="p-2.5 space-y-1.5">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer ${
              !isOpen && "px-0"
            }`}
            title="Create new conversation"
          >
            <Plus className="w-4 h-4" />
            {isOpen && <span>New Session</span>}
          </button>
        </div>

        {/* Workspace Tools Quick Navigation */}
        {isOpen ? (
          <div className="px-2.5 pb-2 border-b border-zinc-850">
            <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Autonomous Tools
            </div>
            <div className="space-y-0.5">
              {onOpenCreativeStudio && (
                <button
                  onClick={onOpenCreativeStudio}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>Creative Studio</span>
                </button>
              )}
              {onOpenDeepResearch && (
                <button
                  onClick={onOpenDeepResearch}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deep Research</span>
                </button>
              )}
              {onOpenTranscribe && (
                <button
                  onClick={onOpenTranscribe}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                >
                  <FileAudio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audio Transcribe</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-zinc-850">
            {onOpenCreativeStudio && (
              <button
                onClick={onOpenCreativeStudio}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Creative Studio"
              >
                <Palette className="w-4 h-4" />
              </button>
            )}
            {onOpenDeepResearch && (
              <button
                onClick={onOpenDeepResearch}
                className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Deep Research"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tab switchers if expanded */}
        {isOpen && (
          <div className="flex items-center px-2.5 pt-2 mb-1.5">
            <div className="w-full grid grid-cols-2 p-0.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab("history")}
                className={`py-1 text-center font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === "history"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`py-1 text-center font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === "templates"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Workflows
              </button>
            </div>
          </div>
        )}

        {/* Main List Area */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {isOpen ? (
            activeTab === "history" ? (
              sessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">No past conversations</div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => onSelectSession(sess.id)}
                      className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isActive
                          ? "bg-zinc-800/80 text-white font-medium border border-zinc-700/60"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                        <span className="truncate">{sess.title || "Untitled Session"}</span>
                      </div>
                      {sessions.length > 1 && (
                        <button
                          onClick={(e) => onDeleteSession(sess.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-zinc-500 transition-opacity cursor-pointer"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              // Workflow prompt templates
              <div className="space-y-1 py-1">
                {PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPromptTemplate(tmpl.prompt, tmpl.agentMode)}
                    className="w-full text-left p-2 rounded-lg hover:bg-zinc-900 transition-colors text-xs cursor-pointer border border-transparent hover:border-zinc-800"
                  >
                    <div className="flex items-center justify-between text-zinc-300 font-medium">
                      <span>{tmpl.title}</span>
                      <Wand2 className="w-3 h-3 text-indigo-400" />
                    </div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{tmpl.category}</div>
                  </button>
                ))}
              </div>
            )
          ) : (
            // Collapsed Icons
            <div className="flex flex-col items-center gap-2 pt-2">
              {sessions.slice(0, 8).map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => onSelectSession(sess.id)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    sess.id === activeSessionId
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                  title={sess.title}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Creator & Admin Attribution */}
        {isOpen ? (
          <div className="p-2 border-t border-zinc-800/80 bg-zinc-950">
            <button onClick={onOpenAdminInfo} className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group" title="View Creator & Admin Profile">
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">JS</div>
                <div className="truncate text-left"><div className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">Jyotish Saha</div><div className="text-[10px] text-zinc-400 leading-tight">Creator & Admin</div></div>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-zinc-800 flex justify-center"><button onClick={onOpenAdminInfo} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer" title="Creator & Admin"><div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">JS</div></button></div>
        )}

        {/* Bottom System Status */}
        {isOpen ? (
          <div className="px-3 py-2 border-t border-zinc-850 text-[11px] text-zinc-400 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Multi-model routing</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">v1.0</span>
          </div>
        ) : (
          <div className="py-2 border-t border-zinc-850 flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected"></span>
          </div>
        )}
      </aside>
    </>
  );
};
