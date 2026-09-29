import React, { useState } from "react";
import { Bot, Check, ChevronDown, Circle, LoaderCircle, X } from "lucide-react";
import { ToolCallItem } from "../types";

interface AgentActivityProps {
  steps: ToolCallItem[];
}

export const AgentActivity: React.FC<AgentActivityProps> = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!steps.length) return null;

  const completed = steps.filter((step) => step.status === "completed").length;
  const active = steps.find((step) => step.status === "running");
  const failed = steps.some((step) => step.status === "failed");
  const finished = !active && steps.every((step) => step.status === "completed" || step.status === "failed");

  return (
    <section className="nova-agent-activity mb-3 overflow-hidden rounded-xl border text-xs shadow-sm backdrop-blur" aria-label="Agent run activity">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="nova-agent-activity__toggle flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="nova-agent-activity__icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"><Bot className="h-4 w-4" /></span>
          <span className="min-w-0">
            <span className="nova-agent-activity__title block font-semibold">Agent activity</span>
            <span className="nova-agent-activity__summary mt-0.5 block truncate text-[11px]">
              {active ? active.name : `${completed} of ${steps.length} steps complete`}
            </span>
          </span>
        </span>
        <span className={`nova-agent-activity__status nova-agent-activity__status--${active ? "running" : finished && failed ? "failed" : finished ? "complete" : "pending"} flex shrink-0 items-center gap-2 text-[11px]`}>
          {active ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : finished && failed ? <X className="h-3.5 w-3.5" /> : finished ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
          <span>{active ? "Working" : finished && failed ? "Stopped" : finished ? "Finished" : "Queued"}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>
      {isOpen && (
        <ol className="nova-agent-activity__list space-y-0 border-t px-3.5 py-2.5">
          {steps.map((step, index) => (
            <li key={`${step.name}-${index}`} className="relative flex gap-2.5 py-1.5">
              {index < steps.length - 1 && <span className="nova-agent-activity__connector absolute bottom-0 left-[6px] top-5 w-px" />}
              <span className={`nova-agent-activity__marker nova-agent-activity__marker--${step.status} relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full`}>
                {step.status === "completed" ? <Check className="h-3 w-3" /> : step.status === "running" ? <LoaderCircle className="h-3 w-3 animate-spin" /> : step.status === "failed" ? <X className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`nova-agent-activity__step nova-agent-activity__step--${step.status} block`}>{step.name}</span>
                {step.detail && <span className="nova-agent-activity__detail mt-1 block whitespace-pre-wrap text-[11px] leading-relaxed">{step.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
