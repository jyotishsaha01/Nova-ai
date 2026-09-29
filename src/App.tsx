import React, { useState, useEffect, useRef } from "react";
import { Message, ChatSession, Artifact, AgentMode, ChatAttachment, AnimatedTheme, ToolCallItem } from "./types";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MessageItem } from "./components/MessageItem";
import { ChatInput } from "./components/ChatInput";
import { WelcomeHero } from "./components/WelcomeHero";
import { ArtifactWorkspace } from "./components/ArtifactWorkspace";
import { DeepResearchModal } from "./components/DeepResearchModal";
import { SettingsModal } from "./components/SettingsModal";
import { AudioTranscribeModal } from "./components/AudioTranscribeModal";
import { CreativeStudioModal } from "./components/CreativeStudioModal";
import { AdminProfileModal } from "./components/AdminProfileModal";
import { NovaAmbientBackground } from "./components/NovaAmbientBackground";
import { extractArtifactsFromContent } from "./utils/artifactDetector";
import { chunkDocumentText, fetchEmbeddings, RagChunk, RagDocument, searchRagKnowledge } from "./utils/ragEngine";
import { AGENT_PERSONAS } from "./constants/agentPersonas";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { db } from "./firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

const STORAGE_KEY_SESSIONS = "nova_ai_sessions_v1";
const STORAGE_KEY_ACTIVE_ID = "nova_ai_active_id_v1";
const STORAGE_KEY_RAG = "nova_ai_rag_v1";

function createNewSession(mode: AgentMode = "general", model = "gemini-3.1-flash-lite"): ChatSession {
  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    title: "New Session",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    agentMode: mode,
    model: model,
    enableSearch: false,
    enableMaps: false,
    enableRag: true,
    thinkingLevel: "LOW",
  };
}

function MainStudio() {
  const { currentUser } = useAuth();
  // Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [createNewSession("general")];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (saved) return saved;
    } catch {
      // fallback
    }
    return sessions[0]?.id || "";
  });

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isDeepResearchOpen, setIsDeepResearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAudioTranscribeOpen, setIsAudioTranscribeOpen] = useState(false);
  const [isCreativeStudioOpen, setIsCreativeStudioOpen] = useState(false);
  const [isAdminInfoOpen, setIsAdminInfoOpen] = useState(false);
  const [providerHealthRefreshKey, setProviderHealthRefreshKey] = useState(0);
  const [ragDocuments, setRagDocuments] = useState<RagDocument[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_RAG) || "[]"); } catch { return []; }
  });
  const [ragChunks, setRagChunks] = useState<RagChunk[]>(() => {
    try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_RAG}_chunks`) || "[]"); } catch { return []; }
  });

  // Active settings
  const [model, setModel] = useState<string>(() => {
    const saved = localStorage.getItem("nova_model");
    // The random OpenRouter free router can choose inconsistent models; migrate
    // its old default to the stable, tested free Nemotron endpoint.
    if (saved === "openrouter/free") return "nvidia/nemotron-3-super-120b-a12b:free";
    return saved || "gemini-3.1-flash-lite";
  });
  const handleSetModel = (next: string) => { setModel(next); localStorage.setItem("nova_model", next); };
  const [provider, setProvider] = useState<"gemini" | "groq" | "openrouter" | "cloudflare">(() => {
    const saved = localStorage.getItem("nova_provider");
    return saved === "groq" || saved === "openrouter" || saved === "cloudflare" ? saved : "gemini";
  });
  const [maxResponseTokens, setMaxResponseTokens] = useState<number>(() => Math.min(32768, Math.max(4096, Number(localStorage.getItem("nova_max_response_tokens")) || 8192)));
  const handleSetMaxResponseTokens = (value: number) => { setMaxResponseTokens(value); localStorage.setItem("nova_max_response_tokens", String(value)); };
  const handleSelectProvider = (next: "gemini" | "groq" | "openrouter" | "cloudflare") => {
    const defaults = { gemini: "gemini-3.1-flash-lite", groq: "openai/gpt-oss-120b", openrouter: "nvidia/nemotron-3-super-120b-a12b:free", cloudflare: "@cf/openai/gpt-oss-120b" };
    setProvider(next);
    handleSetModel(defaults[next]);
    localStorage.setItem("nova_provider", next);
    localStorage.setItem("nova_model", defaults[next]);
  };
  const [theme, setTheme] = useState<AnimatedTheme>(() => {
    const saved = localStorage.getItem("nova_theme");
    const availableThemes: AnimatedTheme[] = ["space", "moon", "sky", "nebula", "quantum", "ocean", "midnight"];
    if (saved === "cyberpunk") return "midnight";
    if (saved === "aurora") return "nebula";
    return availableThemes.includes(saved as AnimatedTheme) ? saved as AnimatedTheme : "space";
  });

  const handleSelectTheme = (newTheme: AnimatedTheme) => {
    setTheme(newTheme);
    localStorage.setItem("nova_theme", newTheme);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RAG, JSON.stringify(ragDocuments));
      localStorage.setItem(`${STORAGE_KEY_RAG}_chunks`, JSON.stringify(ragChunks));
    } catch (error) {
      console.warn("Could not save the local knowledge library:", error);
    }
  }, [ragDocuments, ragChunks]);

  const handleImportKnowledge = async (file: File) => {
    if (!file.size || file.size > 40_000) throw new Error("Choose a text document smaller than 40 KB to keep its vectors within browser storage limits.");
    const content = await file.text();
    if (!content.trim()) throw new Error("This file has no readable text.");
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pieces = chunkDocumentText(content, 700, 100);
    if (ragChunks.length + pieces.length > 60) {
      throw new Error("This browser knowledge library is at its 60 passage limit. Remove a document before adding this one.");
    }
    const additions: RagChunk[] = [];
    for (let offset = 0; offset < pieces.length; offset += 32) {
      const batch = pieces.slice(offset, offset + 32);
      const vectors = await fetchEmbeddings(batch);
      additions.push(...batch.map((text, index) => ({
        id: `${docId}-${offset + index}`, docId, docTitle: file.name,
        text, index: offset + index, embedding: vectors[index],
      })));
    }
    setRagChunks((previous) => [...previous, ...additions]);
    setRagDocuments((previous) => [{
      id: docId, title: file.name, category: "Imported", content,
      chunkCount: additions.length, createdAt: Date.now(),
    }, ...previous]);
  };

  const handleDeleteKnowledge = (docId: string) => {
    setRagDocuments((previous) => previous.filter((document) => document.id !== docId));
    setRagChunks((previous) => previous.filter((chunk) => chunk.docId !== docId));
  };
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [enableMaps, setEnableMaps] = useState<boolean>(false);
  const [thinkingLevel, setThinkingLevel] = useState<"MINIMAL" | "LOW" | "HIGH">("LOW");
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agenticMode, setAgenticMode] = useState<boolean>(() => localStorage.getItem("nova_agentic_mode") === "true");
  const handleToggleAgenticMode = () => setAgenticMode((previous) => {
    localStorage.setItem("nova_agentic_mode", String(!previous));
    return !previous;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const latestResponseText = [...(activeSession?.messages || [])].reverse().find((message) => message.role === "assistant")?.content || "";

  // Sync with Firestore when a user is authenticated
  useEffect(() => {
    if (!currentUser) return;
    const sessionsCol = collection(db, "users", currentUser.uid, "novaSessions");
    const unsub = onSnapshot(sessionsCol, (snapshot) => {
      if (!snapshot.empty) {
        const remoteSessions: ChatSession[] = [];
        snapshot.forEach((docSnap) => remoteSessions.push(docSnap.data() as ChatSession));
        remoteSessions.sort((a, b) => b.updatedAt - a.updatedAt);
        setSessions(remoteSessions);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Save sessions to local storage and Firestore when signed in.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeSessionId);
    } catch {
      // storage error
    }
    if (currentUser && activeSession) {
      const sessionDocRef = doc(db, "users", currentUser.uid, "novaSessions", activeSession.id);
      setDoc(sessionDocRef, activeSession).catch((err) => console.warn("Could not sync session to Firestore:", err));
    }
  }, [sessions, activeSessionId, currentUser]);

  // Extract artifacts whenever messages in active session change
  useEffect(() => {
    if (!activeSession) return;
    let accumulatedArtifacts: Artifact[] = [];
    for (const msg of activeSession.messages) {
      if (msg.role === "assistant" && msg.content) {
        accumulatedArtifacts = extractArtifactsFromContent(msg.content, accumulatedArtifacts);
      }
    }
    setArtifacts(accumulatedArtifacts);
    if (accumulatedArtifacts.length > 0 && !activeArtifactId) {
      setActiveArtifactId(accumulatedArtifacts[0].id);
    }
  }, [activeSession?.messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isLoading]);

  // Create New Chat
  const handleNewChat = (mode: AgentMode = "general") => {
    const newSess = createNewSession(mode, model);
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setIsCanvasOpen(false);
    setActiveArtifactId(null);
  };

  // Delete Chat
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser) {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "novaSessions", id));
      } catch (err) {
        console.warn("Could not delete from Firestore:", err);
      }
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Switch Persona Mode
  const handleSelectMode = (mode: AgentMode) => {
    if (!activeSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, agentMode: mode } : s))
    );
  };

  // Send Message Handler
  const handleSendMessage = async (content: string, attachments: ChatAttachment[]) => {
    if (!content.trim() && attachments.length === 0) return;
    if (!activeSession) return;
    const useAgenticRun = agenticMode && attachments.length === 0;

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content,
      timestamp: Date.now(),
      attachments,
    };

    const assistantMessageId = `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    const updatedTitle =
      activeSession.messages.length === 0
        ? content.slice(0, 36) + (content.length > 36 ? "..." : "")
        : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMessage, assistantPlaceholder];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let streamedText = "";
    let capturedGrounding: any = null;
    let capturedToolCalls: ToolCallItem[] = [];

    try {
      let ragContext: Array<{ docTitle: string; chunkText: string; similarityScore: number }> = [];
      if (activeSession.enableRag && ragChunks.length > 0) {
        try {
          ragContext = (await searchRagKnowledge(content, ragChunks, 5, 0.2)).map(({ chunk, similarityScore }) => ({
            docTitle: chunk.docTitle, chunkText: chunk.text, similarityScore,
          }));
        } catch (ragError) {
          console.warn("Knowledge search unavailable for this message:", ragError);
        }
      }
      const historyPayload = updatedMessages
        .slice(0, -1)
        .map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        }));

      const response = await fetch(useAgenticRun ? "/api/agent/run" : "/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: useAgenticRun
            ? [...historyPayload.slice(-9).map(({ role, content: historyContent }) => ({ role, content: historyContent })), { role: "user", content }]
            : historyPayload,
          model,
          provider,
          maxResponseTokens,
          agentMode: activeSession.agentMode,
          customSystemPrompt: customSystemPrompt || activeSession.customSystemPrompt,
          enableSearch,
          enableMaps,
          thinkingLevel,
          ragContext,
          agentic: useAgenticRun,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat request failed (${response.status}).`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body available from server stream.");

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
          if (jsonStr === "[DONE]") break;

          try {
            const data = JSON.parse(jsonStr);

            if (Array.isArray(data.agentPlan)) {
              capturedToolCalls = data.agentPlan as ToolCallItem[];
            }

            if (data.agentStep && Number.isInteger(data.agentStep.index)) {
              capturedToolCalls = capturedToolCalls.map((item, index) => index === data.agentStep.index
                ? { ...item, ...data.agentStep }
                : item);
            }

            if (data.notice) streamedText += `*${data.notice}*\n\n`;

            if (data.error) {
              let cleanErr = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
              if (cleanErr.includes("quota") || cleanErr.includes("429") || cleanErr.includes("RESOURCE_EXHAUSTED")) {
                cleanErr = "The neural engine is currently handling high demand. Please try again in a few moments.";
              }
              streamedText = cleanErr;
            }

            if (data.text) {
              streamedText += data.text;
            }

            if (data.groundingMetadata) {
              capturedGrounding = data.groundingMetadata;
            }

            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== activeSessionId) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: streamedText,
                          toolCalls: capturedToolCalls.length ? capturedToolCalls : m.toolCalls,
                          groundingMetadata: capturedGrounding || m.groundingMetadata,
                          isStreaming: true,
                        }
                      : m
                  ),
                };
              })
            );
          } catch {
            // ignore partial JSON parse
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        const activeStep = capturedToolCalls.findIndex((step) => step.status === "running");
        if (activeStep >= 0) capturedToolCalls[activeStep] = { ...capturedToolCalls[activeStep], status: "failed", detail: "Stopped by you." };
        streamedText = streamedText ? `${streamedText}\n\n*Run stopped by you.*` : "Run stopped by you.";
      } else {
        console.error("Stream error:", err);
        streamedText += `\n\n*(Inference interrupted: ${err.message || "Network error"})*`;
      }
    } finally {
      setProviderHealthRefreshKey((key) => key + 1);
      setIsLoading(false);
      abortControllerRef.current = null;

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: streamedText || "I have processed your request.",
                    toolCalls: capturedToolCalls.length ? capturedToolCalls : m.toolCalls,
                    groundingMetadata: capturedGrounding,
                    isStreaming: false,
                  }
                : m
            ),
          };
        })
      );

      const detected = extractArtifactsFromContent(streamedText);
      if (detected.length > 0) {
        setActiveArtifactId(detected[0].id);
        // Kept closed by default to avoid cluttering screen with code blocks
      }
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleOpenArtifact = (artifact: Artifact) => {
    setActiveArtifactId(artifact.id);
    setIsCanvasOpen(true);
  };

  const handleInsertReportToChat = (topic: string, reportContent: string) => {
    if (!activeSession) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: `Conduct deep research on: "${topic}"`,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      content: reportContent,
      timestamp: Date.now() + 1,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: `Research: ${topic.slice(0, 24)}...`,
              updatedAt: Date.now(),
              messages: [...s.messages, userMessage, assistantMessage],
            }
          : s
      )
    );
  };

  const currentPersona = AGENT_PERSONAS[activeSession?.agentMode || "general"];

  return (
    <div className={`nova-shell nova-theme-${theme} flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans`}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={() => handleNewChat(activeSession?.agentMode || "general")}
        onDeleteSession={handleDeleteSession}
        onSelectPromptTemplate={(prompt, mode) => {
          handleSelectMode(mode);
          handleSendMessage(prompt, []);
        }}
        onOpenCreativeStudio={() => setIsCreativeStudioOpen(true)}
        onOpenDeepResearch={() => setIsDeepResearchOpen(true)}
        onOpenTranscribe={() => setIsAudioTranscribeOpen(true)}
        onOpenAdminInfo={() => setIsAdminInfoOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="nova-workspace flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header */}
        <Header
          currentMode={activeSession?.agentMode || "general"}
          onSelectMode={handleSelectMode}
          model={model}
          onSelectModel={handleSetModel}
          provider={provider}
          providerHealthRefreshKey={providerHealthRefreshKey}
          latestResponseText={latestResponseText}
          maxResponseTokens={maxResponseTokens}
          onSelectProvider={handleSelectProvider}
          hasArtifacts={artifacts.length > 0}
          artifactCount={artifacts.length}
          isCanvasOpen={isCanvasOpen}
          onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
          onNewChat={() => handleNewChat(activeSession?.agentMode || "general")}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAdminInfo={() => setIsAdminInfoOpen(true)}
          onOpenDeepResearch={() => setIsDeepResearchOpen(true)}
          onOpenTranscribe={() => setIsAudioTranscribeOpen(true)}
          onOpenCreativeStudio={() => setIsCreativeStudioOpen(true)}
          enableSearch={enableSearch}
          currentTheme={theme}
          onSelectTheme={handleSelectTheme}
        />

        {/* Middle Split: Chat Thread + Artifact Canvas */}
        <div className="nova-main-stage flex-1 flex min-h-0 overflow-hidden relative">
          {/* Chat Messages Feed */}
          <div className="nova-chat-pane flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-zinc-950 relative">
            <NovaAmbientBackground theme={theme} />

            <div className="flex-1 overflow-y-auto relative z-10">
              {activeSession?.messages.length === 0 ? (
                <WelcomeHero
                  currentMode={activeSession?.agentMode || "general"}
                  onOpenDeepResearch={() => setIsDeepResearchOpen(true)}
                />
              ) : (
                <div className="divide-y divide-zinc-850/50">
                  {activeSession?.messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      artifacts={artifacts}
                      onOpenArtifact={handleOpenArtifact}
                      agentModeName={currentPersona.name}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStopGeneration={handleStopGeneration}
              enableSearch={enableSearch}
              onToggleSearch={() => setEnableSearch(!enableSearch)}
              agenticMode={agenticMode}
              onToggleAgenticMode={handleToggleAgenticMode}
            />
          </div>

          {/* Right Artifact Canvas / Sandbox */}
          {isCanvasOpen && (
            <ArtifactWorkspace
              artifacts={artifacts}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={(id) => setActiveArtifactId(id)}
              onClose={() => setIsCanvasOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Autonomous Deep Research Modal */}
      <DeepResearchModal
        isOpen={isDeepResearchOpen}
        onClose={() => setIsDeepResearchOpen(false)}
        onSaveReportToChat={handleInsertReportToChat}
      />

      {/* Audio Transcribe Modal */}
      <AudioTranscribeModal
        isOpen={isAudioTranscribeOpen}
        onClose={() => setIsAudioTranscribeOpen(false)}
        onInsertToChat={(text) => {
          handleSendMessage(`Audio Transcription:\n\n"${text}"\n\nPlease analyze and extract key takeaways from this audio.`, []);
        }}
      />

      {/* Creative Media Studio Modal */}
      <CreativeStudioModal
        isOpen={isCreativeStudioOpen}
        onClose={() => setIsCreativeStudioOpen(false)}
        onSendToChat={(text, attachmentUrl) => {
          const attachments: ChatAttachment[] = [];
          if (attachmentUrl) {
            attachments.push({
              id: `att-${Date.now()}`,
              name: "creative_output.png",
              type: "image/png",
              size: 1024,
              dataUrl: attachmentUrl,
            });
          }
          handleSendMessage(text, attachments);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        model={model}
        setModel={handleSetModel}
        provider={provider}
        setProvider={handleSelectProvider}
        maxResponseTokens={maxResponseTokens}
        setMaxResponseTokens={handleSetMaxResponseTokens}
        enableSearch={enableSearch}
        setEnableSearch={setEnableSearch}
        enableMaps={enableMaps}
        setEnableMaps={setEnableMaps}
        thinkingLevel={thinkingLevel}
        setThinkingLevel={setThinkingLevel}
        customSystemPrompt={customSystemPrompt}
        setCustomSystemPrompt={setCustomSystemPrompt}
        ragDocuments={ragDocuments}
        onImportKnowledge={handleImportKnowledge}
        onDeleteKnowledge={handleDeleteKnowledge}
        ragEnabled={activeSession?.enableRag ?? true}
        setRagEnabled={(enabled) => setSessions((previous) => previous.map((session) =>
          session.id === activeSessionId ? { ...session, enableRag: enabled } : session
        ))}
        onOpenAdminInfo={() => setIsAdminInfoOpen(true)}
      />
      <AdminProfileModal isOpen={isAdminInfoOpen} onClose={() => setIsAdminInfoOpen(false)} />
    </div>
  );
}

export default function App() {
  return <AuthProvider><MainStudio /></AuthProvider>;
}
