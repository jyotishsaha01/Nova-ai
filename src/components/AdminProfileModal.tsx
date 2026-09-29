import React from "react";
import { X, ShieldCheck, Sparkles } from "lucide-react";

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><ShieldCheck className="h-4 w-4 text-indigo-400" /> Creator & Admin</div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-6 text-center">
          <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-700 text-2xl font-bold text-white shadow-xl">JS<span className="absolute -bottom-1 -right-1 rounded-full bg-indigo-600 p-1 text-white shadow-md" title="Verified Creator & Admin"><ShieldCheck className="h-4 w-4" /></span></div>
          <h2 id="admin-profile-title" className="text-lg font-semibold text-zinc-100">Jyotish Saha</h2>
          <p className="mt-1 text-xs text-zinc-400">System Architect & Creator of Nova</p>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-300"><Sparkles className="h-4 w-4 text-indigo-400" /> Building a multi-model AI workspace</div>
        </div>
      </section>
    </div>
  );
};
