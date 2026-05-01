/* ═══════════════════════════════════════ */
/*  SaaS Factory — Types                  */
/* ═══════════════════════════════════════ */

export type AgentId = 'ana' | 'carlos' | 'beatriz' | 'diego' | 'rafael' | 'juliana' | 'leo';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'approved' | 'adjusting';

export type PipelineStatus = 'idle' | 'running' | 'completed';

export interface AgentMeta {
  id: AgentId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  colorHex: string;
  description: string;
  avatarInitials: string;
}

export interface AgentResult {
  agentId: AgentId;
  content: string;
  status: AgentStatus;
  feedback?: string;
  version: number;
  timestamp: string;
}

export interface Project {
  id: string;
  idea: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: PipelineStatus;
  currentStep: number;
  agentResults: AgentResult[];
  megaPrompt?: string;
  megaPromptComplete?: boolean;
}

export interface AppSettings {
  geminiApiKey: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  replicateApiKey?: string;
  preferredProvider: 'gemini' | 'anthropic' | 'openai';
}
