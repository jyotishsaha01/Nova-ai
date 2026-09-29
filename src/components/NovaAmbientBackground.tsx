import React from "react";
import { AnimatedTheme } from "../types";

export const NovaAmbientBackground: React.FC<{ theme: AnimatedTheme }> = ({ theme }) => (
  <div className={`nova-ambient-backdrop nova-scene-${theme}`} aria-hidden="true">
    <div className="nova-ambient-grid" />
    {theme === "space" && <><div className="nova-ambient-orbit nova-ambient-orbit--one"><i /><i /><i /></div><div className="nova-ambient-orbit nova-ambient-orbit--two"><i /><i /></div><div className="nova-ambient-sun"><div className="nova-sun-core" /></div></>}
    {theme === "moon" && <div className="scene-moon"><i /><i /><i /><i /><span /></div>}
    {theme === "sky" && <div className="scene-sky"><i className="scene-sun" /><i className="scene-cloud scene-cloud-a" /><i className="scene-cloud scene-cloud-b" /><i className="scene-cloud scene-cloud-c" /></div>}
    {theme === "nebula" && <div className="scene-nebula"><i /><i /><i /><b /><b /><b /><b /><span /></div>}
    {theme === "quantum" && <div className="scene-atom"><i className="atom-nucleus" /><i className="atom-ring atom-ring-a" /><i className="atom-ring atom-ring-b" /><i className="atom-ring atom-ring-c" /><b /><b /><b /></div>}
    {theme === "ocean" && <div className="scene-ocean"><i className="ocean-glow" /><i className="ocean-ray ocean-ray-a" /><i className="ocean-ray ocean-ray-b" /><i className="ocean-ray ocean-ray-c" /><i className="ocean-wave ocean-wave-a" /><i className="ocean-wave ocean-wave-b" /><i className="ocean-wave ocean-wave-c" /><b /><b /><b /><b /><span /><strong className="ocean-reef" /><em className="ocean-surface" /></div>}
    {theme === "midnight" && <div className="scene-midnight"><i className="midnight-moon" /><i className="midnight-halo" /><b /><b /><b /><b /><span /></div>}
    <div className="nova-ambient-glow" />
  </div>
);
