export type AgentMode = "general" | "deep_research" | "code_architect" | "analyst" | "creative";

export type AnimatedTheme = "space" | "moon" | "sky" | "nebula" | "quantum" | "ocean" | "midnight";

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
  groundingChunks?: GroundingChunk[];
  groundingSupports?: Array<{
    groundingChunkIndices?: number[];
    segment?: { text?: string };
  }>;
}

export interface ToolCallItem {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  summary?: string;
  detail?: string;
}

export interface RagCitation {
  docTitle: string;
  chunkText: string;
  similarityScore: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  thought?: string;
  groundingMetadata?: GroundingMetadata;
  ragCitations?: RagCitation[];
  toolCalls?: ToolCallItem[];
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  artifactIds?: string[];
}

export type ArtifactType = "html" | "react" | "markdown" | "svg" | "json" | "python" | "javascript" | "css";

export interface Artifact {
  id: string;
  title: string;
  type: ArtifactType;
  content: string;
  language: string;
  version: number;
  updatedAt: number;
  description?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  agentMode: AgentMode;
  model: string;
  customSystemPrompt?: string;
  enableSearch: boolean;
  enableMaps: boolean;
  enableRag: boolean;
  thinkingLevel: "MINIMAL" | "LOW" | "HIGH";
}

export interface AgentPersonaConfig {
  id: AgentMode;
  name: string;
  tagline: string;
  iconName: string;
  description: string;
  defaultPrompt: string;
  recommendedModel: string;
  accentColor: string;
}
