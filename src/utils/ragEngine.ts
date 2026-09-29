export interface RagDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  chunkCount: number;
  createdAt: number;
}

export interface RagChunk {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  index: number;
  embedding: number[];
}

export interface RagSearchResult {
  chunk: RagChunk;
  similarityScore: number;
}

// Semantic Chunking with sentence boundary preservation and overlap
export function chunkDocumentText(
  text: string,
  targetChunkSize = 450,
  overlap = 80
): string[] {
  const cleanText = text.replace(/\r\n/g, "\n").trim();
  if (cleanText.length <= targetChunkSize) {
    return [cleanText];
  }

  // Split into paragraphs or sentences
  const sentences = cleanText.split(/(?<=[.?!;:\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    if (sentence.length > targetChunkSize) {
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if (currentChunk.length + word.length + 1 > targetChunkSize && currentChunk) {
          chunks.push(currentChunk.trim());
          const overlapWords = currentChunk.split(/\s+/).slice(-Math.max(3, Math.floor(overlap / 10)));
          currentChunk = overlapWords.join(" ");
        }
        currentChunk += (currentChunk ? " " : "") + word;
      }
    } else if (currentChunk.length + sentence.length <= targetChunkSize) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Preserve overlap
        const words = currentChunk.split(" ");
        const overlapWords = words.slice(-Math.max(3, Math.floor(overlap / 10))).join(" ");
        currentChunk = overlapWords + " " + sentence;
      } else {
        chunks.push(sentence.trim());
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.trim().length > 0);
}

// Cosine similarity computation between two vectors
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

// Fetch embeddings from server
export async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const response = await fetch("/api/rag/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate vector embeddings.");
  }

  const data = await response.json();
  if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length) {
    throw new Error("The embedding service returned an incomplete response.");
  }
  return data.embeddings;
}

// Semantic Search against in-memory chunk store
export async function searchRagKnowledge(
  query: string,
  chunks: RagChunk[],
  topK = 4,
  minSimilarity = 0.25
): Promise<RagSearchResult[]> {
  if (!query.trim() || chunks.length === 0) return [];

  // 1. Embed query
  const queryEmbeddings = await fetchEmbeddings([query]);
  if (!queryEmbeddings || queryEmbeddings.length === 0) return [];
  const queryVector = queryEmbeddings[0];

  // 2. Compute similarity for every chunk
  const results: RagSearchResult[] = chunks.map((chunk) => {
    const similarity = computeCosineSimilarity(queryVector, chunk.embedding);
    return {
      chunk,
      similarityScore: Math.max(0, similarity),
    };
  });

  // 3. Filter and sort descending
  return results
    .filter((r) => r.similarityScore >= minSimilarity)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);
}

// Default Seed Knowledge for immediate testing
export const INITIAL_RAG_DOCUMENTS: Array<{ title: string; category: string; content: string }> = [
  {
    title: "Nova Agentic Platform Specifications v2.4",
    category: "System Architecture",
    content: `Nova is an advanced autonomous Agentic AI workspace developed in 2026.
Core Architectural Tenets:
1. Multi-Agent Personas: General Assistant, Deep Research Agent, Code Architect, Quantitative Analyst, and Literary Stylist.
2. Cognitive Engine: Powered by Gemini 3.8 Flash featuring full thinking budget control (Minimal, Low, High).
3. Hybrid Tool Integration: Real-time Google Search grounding combined with autonomous function calling.
4. Claude-Style Artifact Canvas: Live sandboxed execution of HTML, Tailwind CSS, SVG diagrams, and React components.
5. High-Precision RAG Pipeline: Vector embeddings calculated with gemini-embedding-2-preview, semantic cosine similarity matching, and Firestore vector storage.
6. Audio Transcriptions: Native voice audio processing powered by gemini-3.5-transcribe.`,
  },
  {
    title: "Solid-State Battery Commercialization Roadmap 2026",
    category: "Energy & Materials",
    content: `Commercial state of solid-state lithium metal batteries in 2026:
- Energy Density: Production cells achieve 450-480 Wh/kg and 1,050 Wh/L, outperforming conventional NMC lithium-ion by ~60%.
- Electrolyte Chemistries: Sulfide-based solid electrolytes (Li10GeP2S12 and argyrodite Li6PS5Cl) dominate high-power automotive cells. Oxide electrolytes (LLZO garnet) lead in consumer electronics due to atmospheric stability.
- Anode Architecture: Pure lithium metal foil or lithium-free anodeless architectures (in-situ plated lithium).
- Key Manufacturers: QuantumScape (partnered with Volkswagen), CATL (all-solid-state target 2027), and Toyota (demonstrating pilot EV fleet).
- Lingering Bottlenecks: Manufacturing throughput in dry room environments, lithium dendrite formation under fast-charging (>3C), and interfacial voiding during discharge.`,
  },
];
