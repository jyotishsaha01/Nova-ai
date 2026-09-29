import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Moon, Cloud, Check, Orbit, Waves, Atom, MoonStar } from "lucide-react";
import { AnimatedTheme } from "../types";

interface ThemeSelectorProps {
  currentTheme: AnimatedTheme;
  onSelectTheme: (theme: AnimatedTheme) => void;
}

export const THEME_OPTIONS: Array<{
  id: AnimatedTheme;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  badge: string;
}> = [
  {
    id: "space",
    name: "Ringed Planet",
    tagline: "A luminous world wrapped in animated orbital rings",
    icon: <Orbit className="w-4 h-4 text-indigo-400" />,
    badge: "3D",
  },
  {
    id: "moon",
    name: "Lunar Surface",
    tagline: "A cratered moon with drifting dust and cool light",
    icon: <Moon className="w-4 h-4 text-slate-200" />,
    badge: "3D",
  },
  {
    id: "sky",
    name: "Sky Cloudscape",
    tagline: "Sculpted cloud layers glide around a radiant sun",
    icon: <Cloud className="w-4 h-4 text-cyan-400" />,
    badge: "3D",
  },
  {
    id: "nebula",
    name: "Nebula Drift",
    tagline: "Midnight space, distant stars, and a slowly turning nebula",
    icon: <Sparkles className="w-4 h-4 text-violet-400" />,
    badge: "NIGHT",
  },
  {
    id: "quantum",
    name: "Quantum Atom",
    tagline: "A glowing nucleus surrounded by orbiting electrons",
    icon: <Atom className="w-4 h-4 text-violet-300" />,
    badge: "3D",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    tagline: "Layered waves, light shafts, and drifting bioluminescence",
    icon: <Waves className="w-4 h-4 text-cyan-300" />,
    badge: "3D",
  },
  {
    id: "midnight",
    name: "Midnight Orbit",
    tagline: "A deep night sky with a moonlit, animated orbit",
    icon: <MoonStar className="w-4 h-4 text-indigo-300" />,
    badge: "NIGHT",
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className="relative select-none" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nova-theme-button flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-all cursor-pointer shadow-xs"
        title="Change Nova's animated 3D environment"
      >
        <span className="shrink-0">{activeOption.icon}</span>
        <span className="hidden md:inline">{activeOption.name.replace("3D ", "")}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-2 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-2 py-1.5 flex items-center justify-between border-b border-zinc-800/80 mb-1.5">
            <span className="text-[11px] font-semibold text-zinc-300">
              Animated environments
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">3D SCENES</span>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.id === currentTheme;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-850/90 text-white border border-zinc-700/80 shadow-xs"
                      : "text-zinc-300 hover:bg-zinc-900/80 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-100">{opt.name}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">{opt.badge}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 leading-normal">
                      {opt.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
