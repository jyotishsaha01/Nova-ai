import { AgentPersonaConfig } from "../types";

export const AGENT_PERSONAS: Record<string, AgentPersonaConfig> = {
  general: {
    id: "general",
    name: "Nova General",
    tagline: "Autonomous Agentic Intelligence",
    iconName: "Sparkles",
    description: "Multi-step reasoning, real-time web grounding, synthesis, and creative problem solving.",
    defaultPrompt: "How can I help you think, build, or research today?",
    recommendedModel: "gemini-3.1-flash-lite",
    accentColor: "from-blue-500 to-indigo-500",
  },
  deep_research: {
    id: "deep_research",
    name: "Deep Research",
    tagline: "Multi-Axis Autonomous Inquiry",
    iconName: "Search",
    description: "Decomposes inquiries into sub-queries, explores real-time web grounding, and writes structured briefings.",
    defaultPrompt: "What domain, company, technology, or question should I conduct deep research on?",
    recommendedModel: "gemini-3.1-flash-lite",
    accentColor: "from-emerald-500 to-teal-500",
  },
  code_architect: {
    id: "code_architect",
    name: "Code Architect",
    tagline: "Production Systems & Interactive Canvas",
    iconName: "Code2",
    description: "Builds full-stack applications, interactive UI components, algorithms, and debugs code with live Canvas preview.",
    defaultPrompt: "Describe an app, component, or algorithm to design and preview live.",
    recommendedModel: "gemini-3.1-flash-lite",
    accentColor: "from-violet-500 to-purple-500",
  },
  analyst: {
    id: "analyst",
    name: "Data Analyst",
    tagline: "Quantitative Modeling & Metrics",
    iconName: "LineChart",
    description: "Mathematical models, KPI decomposition, market sizing, financial tables, and sensitivity analyses.",
    defaultPrompt: "Provide a dataset, business model, or metric breakdown to analyze.",
    recommendedModel: "gemini-3.1-flash-lite",
    accentColor: "from-amber-500 to-orange-500",
  },
  creative: {
    id: "creative",
    name: "Creative Director",
    tagline: "Literary Stylist & Copywriter",
    iconName: "Feather",
    description: "Compelling narratives, technical essays, high-conversion copy, and evocative storytelling.",
    defaultPrompt: "What story, vision, or brand narrative would you like to craft?",
    recommendedModel: "gemini-3.1-flash-lite",
    accentColor: "from-rose-500 to-pink-500",
  },
};

export interface PromptTemplate {
  title: string;
  category: string;
  agentMode: "general" | "deep_research" | "code_architect" | "analyst" | "creative";
  prompt: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    title: "Interactive Weather Forecast App",
    category: "Code & UI Canvas",
    agentMode: "code_architect",
    prompt: "Build an interactive, beautiful HTML/Tailwind CSS weather dashboard widget with animated temperature cards, 7-day forecast chart, dynamic precipitation radar graphic, and realistic mock toggle controls. Make it self-contained so I can run it in the Artifact Canvas.",
  },
  {
    title: "Deep Research: Next-Gen Solid State Batteries",
    category: "Autonomous Research",
    agentMode: "deep_research",
    prompt: "Conduct a comprehensive deep research report on the commercialization status of solid-state lithium metal batteries in 2026. Include energy density benchmarks (Wh/kg), cathode/anode chemistries, leading manufacturers (QuantumScape, CATL, Toyota), current bottlenecks (dendrites, manufacturing yield), and forecasted timeline to mass automotive adoption.",
  },
  {
    title: "Interactive Canvas: Financial ROI Calculator",
    category: "Code & UI Canvas",
    agentMode: "code_architect",
    prompt: "Create an interactive SaaS ROI & Unit Economics Calculator in HTML/JS with Tailwind CSS. Include interactive sliders for Monthly Active Users, ARPU, Churn Rate, and CAC. Provide dynamic live calculation of LTV:CAC ratio, Payback Period, and projected ARR curve.",
  },
  {
    title: "Comparative Analysis: Open vs Frontier AI",
    category: "Market Intelligence",
    agentMode: "analyst",
    prompt: "Provide an analytical breakdown comparing frontier AI models (Gemini, Claude, GPT) against leading open-weight models (Llama, DeepSeek, Mistral) across inference economics, parameter efficiency, safety governance, and enterprise adoption vectors.",
  },
];
