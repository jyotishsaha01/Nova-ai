import React from "react";
import { Globe, ExternalLink, Search } from "lucide-react";
import { GroundingMetadata } from "../types";

interface GroundingCitationsProps {
  metadata?: GroundingMetadata;
}

export const GroundingCitations: React.FC<GroundingCitationsProps> = ({ metadata }) => {
  if (!metadata) return null;

  const queries = metadata.webSearchQueries || [];
  const chunks = metadata.groundingChunks || [];

  if (queries.length === 0 && chunks.length === 0) return null;

  return (
    <div className="my-3 pt-3 border-t border-zinc-800/80 text-xs">
      {/* Grounded Search Queries */}
      {queries.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-400 mb-2">
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>Searched:</span>
          </div>
          {queries.map((q, idx) => (
            <span key={idx} className="text-zinc-300 font-mono text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              "{q}"
            </span>
          ))}
        </div>
      )}

      {/* Grounded Sources */}
      {chunks.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium mb-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sources & Citations:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {chunks.slice(0, 6).map((chunk, idx) => {
              const uri = chunk.web?.uri;
              const title = chunk.web?.title || uri || `Source ${idx + 1}`;
              let hostname = "";
              try {
                if (uri) hostname = new URL(uri).hostname.replace("www.", "");
              } catch {
                hostname = "web";
              }

              return (
                <a
                  key={idx}
                  href={uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/70 text-zinc-300 hover:text-indigo-300 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-medium text-[11px] text-zinc-200 group-hover:text-indigo-200">
                      {title}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">{hostname}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
