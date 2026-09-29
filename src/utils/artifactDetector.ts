import { Artifact, ArtifactType } from "../types";

export function extractArtifactsFromContent(content: string, existingArtifacts: Artifact[] = []): Artifact[] {
  const artifacts: Artifact[] = [...existingArtifacts];

  // Pattern 1: Code blocks with language specification
  // ```html ... ```, ```tsx ... ```, ```svg ... ```, ```python ... ```, ```markdown ... ```
  const codeBlockRegex = /```(html|htm|svg|jsx|tsx|javascript|js|typescript|ts|python|py|json|markdown|md)\s*([\s\S]*?)```/gi;

  let match;
  let counter = 1;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const rawLang = match[1].toLowerCase();
    const rawCode = match[2].trim();

    // Only treat substantial code blocks (> 60 chars or containing structural tags) as artifacts
    if (rawCode.length < 50) continue;

    let type: ArtifactType = "javascript";
    let language = rawLang;

    if (rawLang === "html" || rawLang === "htm") {
      type = "html";
      language = "html";
    } else if (rawLang === "svg") {
      type = "svg";
      language = "svg";
    } else if (rawLang === "tsx" || rawLang === "jsx") {
      type = "react";
      language = "typescript";
    } else if (rawLang === "python" || rawLang === "py") {
      type = "python";
      language = "python";
    } else if (rawLang === "json") {
      type = "json";
      language = "json";
    } else if (rawLang === "markdown" || rawLang === "md") {
      type = "markdown";
      language = "markdown";
    }

    // Try to infer a nice title
    let title = `${type.toUpperCase()} Component ${counter++}`;
    const titleMatch = rawCode.match(/<!--\s*Title:\s*(.+?)\s*-->/i) ||
      rawCode.match(/\/\/\s*Title:\s*(.+?)\s*$/m) ||
      rawCode.match(/<title>(.+?)<\/title>/i) ||
      rawCode.match(/#\s+(.+?)[\r\n]/);

    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else if (type === "html") {
      title = "Interactive Web Artifact";
    } else if (type === "react") {
      title = "React Component Canvas";
    } else if (type === "svg") {
      title = "Vector Diagram / SVG";
    } else if (type === "python") {
      title = "Python Computational Script";
    } else if (type === "markdown") {
      title = "Intelligence Briefing Document";
    }

    // Check if an artifact with similar content already exists to avoid duplicates
    const existingIndex = artifacts.findIndex(
      (a) => a.title === title || (a.type === type && Math.abs(a.content.length - rawCode.length) < 10)
    );

    if (existingIndex >= 0) {
      if (artifacts[existingIndex].content !== rawCode) {
        // Upgrade version
        artifacts[existingIndex] = {
          ...artifacts[existingIndex],
          content: rawCode,
          version: artifacts[existingIndex].version + 1,
          updatedAt: Date.now(),
        };
      }
    } else {
      artifacts.push({
        id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        type,
        content: rawCode,
        language,
        version: 1,
        updatedAt: Date.now(),
        description: `Generated ${type} artifact ready for inspection and live execution.`,
      });
    }
  }

  return artifacts;
}

export function buildSandboxedHtml(artifact: Artifact): string {
  if (artifact.type === "html") {
    // If it's already full HTML document
    if (artifact.content.includes("<html") || artifact.content.includes("<!DOCTYPE") || artifact.content.includes("<body")) {
      // Ensure Tailwind script is injected for modern styling
      if (!artifact.content.includes("tailwindcss") && !artifact.content.includes("cdn.tailwindcss.com")) {
        return artifact.content.replace(
          "<head>",
          `<head><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>`
        );
      }
      return artifact.content;
    }

    // Wrap snippet into full HTML with Tailwind & dark/clean theme
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 1.5rem;
      background: #09090b;
      color: #f4f4f5;
      min-height: 100vh;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${artifact.content}
</body>
</html>`;
  }

  if (artifact.type === "svg") {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #09090b;
      padding: 2rem;
      box-sizing: border-box;
    }
    svg {
      max-width: 100%;
      height: auto;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5));
    }
  </style>
</head>
<body>
  ${artifact.content}
</body>
</html>`;
  }

  // React/TSX or other snippet fallback rendering
  return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 2rem; }</style>
</head>
<body>
  <div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm">
    <div class="text-zinc-400 font-mono mb-2">// Artifact Code View (${artifact.type})</div>
    <pre class="overflow-x-auto text-zinc-200 font-mono text-xs leading-relaxed"><code>${escapeHtml(artifact.content)}</code></pre>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
