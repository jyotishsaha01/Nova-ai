import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { AgentMode } from "../types";
import { AGENT_PERSONAS } from "../constants/agentPersonas";

interface WelcomeHeroProps {
  currentMode: AgentMode;
  onOpenDeepResearch: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ currentMode, onOpenDeepResearch }) => {
  const persona = AGENT_PERSONAS[currentMode] || AGENT_PERSONAS.general;

  return (
    <main className="nova-home relative z-10 mx-auto w-full max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12 xl:px-12">
      <section className="nova-home-feature grid items-center gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
        <div className="nova-home-copy relative z-10">
          <div className="nova-home-kicker"><span /> A MULTI-MODEL WORKSPACE</div>
          <h1 className="nova-home-title">Think across<br /><em>models.</em></h1>
          <p className="nova-home-description">One clear place to research, build, and create. Bring your preferred model—or let Nova route around a provider limit.</p>
          <div className="nova-home-actions">
            <button type="button" onClick={onOpenDeepResearch} className="nova-primary-action">Start a research brief <ArrowUpRight size={16} /></button>
            <span className="nova-mode-note"><Sparkles size={14} /> {persona.name} selected</span>
          </div>
        </div>

        <div className="nova-model-scene" aria-label="Nova multi-model routing illustration">
          <div className="nova-model-scene-glow" />
          <div className="nova-model-orbit nova-model-orbit--outer"><i /><i /></div>
          <div className="nova-model-orbit nova-model-orbit--inner"><i /><i /></div>
          <div className="nova-model-hub"><img src="/nova-mark.svg" alt="Nova" /></div>
          <div className="nova-scene-caption">YOUR MODELS. ONE WORKFLOW.</div>
        </div>
      </section>
    </main>
  );
};
