import React, { useState } from "react";
import { Check, Copy, Code2, ChevronDown, ChevronUp, Download, Maximize2, X, Sparkles } from "lucide-react";
import { Artifact } from "../types";

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (artifact: Artifact) => void;
  detectedArtifacts?: Artifact[];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onOpenArtifact,
  detectedArtifacts = [],
}) => {
  // Split content by code blocks: ```lang ... ```
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\s*([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <div key={`text-${lastIndex}`} className="prose-section">
          {renderFormattedText(textBefore)}
        </div>
      );
    }

    const language = match[1].toLowerCase() || "code";
    const code = match[2].trim();

    // Check if this code block corresponds to any detected artifact
    const matchingArtifact = detectedArtifacts.find(
      (a) => a.content.includes(code.slice(0, 40)) || code.includes(a.content.slice(0, 40))
    );

    parts.push(
      <CollapsibleCodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
        matchingArtifact={matchingArtifact}
        onOpenArtifact={onOpenArtifact}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <div key={`text-${lastIndex}`} className="prose-section">
        {renderFormattedText(remainingText)}
      </div>
    );
  }

  return <div className="space-y-2 text-zinc-200 leading-relaxed text-sm break-words">{parts}</div>;
};

// Interactive Visual Image Card for rendered images
const ImageCard: React.FC<{ alt: string; src: string }> = ({ alt, src }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Automatically route through same-origin proxy for 100% reliable loading in iframe sandboxes
  const baseSrc = src.startsWith("https://image.pollinations.ai/")
    ? `/api/image-proxy?prompt=${encodeURIComponent(alt || "artwork")}`
    : src;

  const displaySrc =
    retryCount > 0
      ? `${baseSrc}${baseSrc.includes("?") ? "&" : "?"}_r=${retryCount}`
      : baseSrc;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const resp = await fetch(displaySrc);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${alt.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() || "artwork"}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(displaySrc, "_blank");
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displaySrc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="my-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl group transition-all duration-300 hover:border-zinc-700 max-w-xl">
        {/* Image Container */}
        <div className="relative aspect-square sm:aspect-[4/3] bg-zinc-900 overflow-hidden flex items-center justify-center min-h-[260px]">
          {!loaded && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-zinc-400 bg-zinc-950/95 z-10 animate-fade-in">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-400 absolute" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-200">Rendering Neural Artwork...</p>
                <p className="text-[11px] text-zinc-500 max-w-xs truncate">
                  {alt || "Synthesizing visual scene"}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center bg-zinc-900 text-zinc-400 z-10">
              <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-zinc-200">{alt || "Visual Artwork"}</p>
              <button
                type="button"
                onClick={() => {
                  setError(false);
                  setLoaded(false);
                  setRetryCount((c) => c + 1);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
              >
                Reload Image
              </button>
            </div>
          )}

          <img
            src={displaySrc}
            alt={alt || "Generated Artwork"}
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            onClick={() => setShowLightbox(true)}
            className={`w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02] ${
              loaded && !error ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Overlay controls on hover */}
          {loaded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5 pointer-events-none">
              <div className="flex justify-end gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="Copy image link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="Download image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLightbox(true)}
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="View fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {alt && (
                <div className="pointer-events-auto">
                  <p className="text-xs text-white/90 font-medium line-clamp-2 drop-shadow-md">
                    {alt}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer label */}
        <div className="px-3.5 py-2.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="font-semibold text-zinc-300 truncate">{alt || "Visual Generation"}</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer shrink-0 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Save Image</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={src}
              alt={alt}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
            />
            {alt && <p className="text-zinc-300 text-sm mt-3 text-center">{alt}</p>}
          </div>
        </div>
      )}
    </>
  );
};

// Collapsible Code Block: Keeps code hidden by default to keep chat clean and readable
const CollapsibleCodeBlock: React.FC<{
  language: string;
  code: string;
  matchingArtifact?: Artifact;
  onOpenArtifact?: (artifact: Artifact) => void;
}> = ({ language, code, matchingArtifact, onOpenArtifact }) => {
  // Always hidden by default per user request
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lineCount = code.split("\n").length;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
      {/* Sleek Preview Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
          <span className="font-mono text-[11px] font-semibold text-zinc-300 shrink-0">
            {language ? language.toUpperCase() : "CODE"}
          </span>
          <span className="text-zinc-500 text-[11px] shrink-0">
            ({lineCount} {lineCount === 1 ? "line" : "lines"})
          </span>
          {matchingArtifact && (
            <span className="text-indigo-400 font-medium text-[11px] truncate hidden sm:inline">
              · {matchingArtifact.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {matchingArtifact && onOpenArtifact && (
            <button
              type="button"
              onClick={() => onOpenArtifact(matchingArtifact)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Open in Canvas</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isExpanded ? "Hide Code" : "Show Code"}</span>
          </button>
        </div>
      </div>

      {/* Code body: Hidden by default, shown only when explicitly expanded */}
      {isExpanded && (
        <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed max-h-[480px] bg-zinc-950/90 border-t border-zinc-900 animate-fade-in">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

// Formats Markdown headings, images, bullet points, numbered lists, blockquotes, bold/italic, tables
function renderFormattedText(rawText: string): React.ReactNode {
  const lines = rawText.split("\n");
  const nodes: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Markdown Image syntax: ![alt](url)
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      nodes.push(<ImageCard key={`img-${i}`} alt={alt} src={src} />);
      continue;
    }

    // Detect Table start / continuation
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        tableRows = [];
      } else if (cells.every((c) => /^[-:]+$/.test(c))) {
        // separator row, ignore
        continue;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Flush table
      nodes.push(
        <div key={`tbl-${i}`} className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-300 font-semibold">
              <tr>
                {tableHeader.map((th, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5">
                    {formatInline(th)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 bg-zinc-950/40 text-zinc-300">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-900/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableRows = [];
      tableHeader = [];
    }

    // Headings
    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-zinc-100 mt-4 mb-2">
          {formatInline(line.substring(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-zinc-100 mt-3 mb-1.5">
          {formatInline(line.substring(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-zinc-200 mt-2.5 mb-1">
          {formatInline(line.substring(4))}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 border-l-2 border-indigo-500 pl-3.5 py-1 text-zinc-300 italic bg-indigo-500/5 rounded-r"
        >
          {formatInline(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const bulletContent = line.trim().substring(2);
      nodes.push(
        <div key={`li-${i}`} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-indigo-400 mt-1 text-xs leading-none">•</span>
          <span className="flex-1">{formatInline(bulletContent)}</span>
        </div>
      );
      continue;
    }

    // Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const [, num, numContent] = numMatch;
      nodes.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-zinc-500 font-mono text-xs mt-0.5">{num}.</span>
          <span className="flex-1">{formatInline(numContent)}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={`p-${i}`} className="my-1">
        {formatInline(line)}
      </p>
    );
  }

  // Handle table at the end
  if (inTable && tableRows.length > 0) {
    nodes.push(
      <div key="tbl-end" className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
          <thead className="bg-zinc-900/90 text-zinc-300 font-semibold">
            <tr>
              {tableHeader.map((th, hIdx) => (
                <th key={hIdx} className="px-3.5 py-2.5">
                  {formatInline(th)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850 bg-zinc-950/40 text-zinc-300">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/30">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2">
                    {formatInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <>{nodes}</>;
}

// Inline formatting: **bold**, *italic*, `inline code`, and inline ![alt](url)
function formatInline(text: string): React.ReactNode {
  // Check for inline images
  const imgRegex = /!\[(.*?)\]\((.*?)\)/;
  const matchImg = text.match(imgRegex);
  if (matchImg && matchImg.index !== undefined) {
    const before = text.substring(0, matchImg.index);
    const alt = matchImg[1];
    const src = matchImg[2];
    const after = text.substring(matchImg.index + matchImg[0].length);
    return (
      <>
        {before && formatInline(before)}
        <ImageCard alt={alt} src={src} />
        {after && formatInline(after)}
      </>
    );
  }

  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let count = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const chunk = match[0];
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      parts.push(
        <strong key={`b-${count++}`} className="font-semibold text-zinc-100">
          {chunk.slice(2, -2)}
        </strong>
      );
    } else if (chunk.startsWith("*") && chunk.endsWith("*")) {
      parts.push(
        <em key={`i-${count++}`} className="italic text-zinc-300">
          {chunk.slice(1, -1)}
        </em>
      );
    } else if (chunk.startsWith("`") && chunk.endsWith("`")) {
      parts.push(
        <code
          key={`c-${count++}`}
          className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 font-mono text-[11px] text-indigo-300"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }

    lastIndex = match.index + chunk.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
