import { create } from 'zustand';
import type { Project, AgentResult, PipelineStatus, AgentId } from '../types';
import { AGENTS } from '../data/agents';
import type { ProviderInfo, ProviderEventData } from '../hooks/useAgentPipeline';

interface ProjectState {
  // Current project
  currentProject: Project | null;
  currentStep: number;
  pipelineStatus: PipelineStatus;
  agentResults: AgentResult[];
  
  // Mega prompt continuation
  megaPromptParts: string[];
  megaPromptComplete: boolean;
  
  // Project history
  projects: Project[];
  
  // AI Provider tracking
  currentProvider: ProviderInfo | null;
  providerEvents: ProviderEventData[];
  
  // View state
  view: 'landing' | 'pipeline' | 'history' | 'settings';
  
  // Actions
  setView: (view: ProjectState['view']) => void;
  startProject: (idea: string) => void;
  setAgentStatus: (agentId: AgentId, status: AgentResult['status']) => void;
  setAgentContent: (agentId: AgentId, content: string) => void;
  appendAgentContent: (agentId: AgentId, chunk: string) => void;
  approveStep: (stepIndex: number) => void;
  requestAdjustment: (stepIndex: number, feedback: string) => void;
  setMegaPromptPart: (part: string) => void;
  appendMegaPromptPart: (part: string) => void;
  setMegaPromptComplete: (complete: boolean) => void;
  saveProject: () => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  loadProjectsFromStorage: () => void;
  importProject: (project: Project) => void;
  resetPipeline: () => void;
  setCurrentProvider: (provider: ProviderInfo | null) => void;
  addProviderEvent: (event: ProviderEventData) => void;
  clearProviderEvents: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const createEmptyResults = (): AgentResult[] =>
  AGENTS.map((agent) => ({
    agentId: agent.id,
    content: '',
    status: 'pending' as const,
    version: 1,
    timestamp: '',
  }));

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  currentStep: 0,
  pipelineStatus: 'idle',
  agentResults: createEmptyResults(),
  megaPromptParts: [],
  megaPromptComplete: false,
  projects: [],
  currentProvider: null,
  providerEvents: [],
  view: 'landing',

  setView: (view) => set({ view }),

  startProject: (idea: string) => {
    const project: Project = {
      id: generateId(),
      idea,
      name: idea.substring(0, 60),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'running',
      currentStep: 0,
      agentResults: createEmptyResults(),
    };
    set({
      currentProject: project,
      currentStep: 0,
      pipelineStatus: 'running',
      agentResults: createEmptyResults(),
      megaPromptParts: [],
      megaPromptComplete: false,
      view: 'pipeline',
    });
  },

  setAgentStatus: (agentId, status) => {
    set((state) => ({
      agentResults: state.agentResults.map((r) =>
        r.agentId === agentId ? { ...r, status, timestamp: new Date().toISOString() } : r
      ),
    }));
  },

  setAgentContent: (agentId, content) => {
    set((state) => ({
      agentResults: state.agentResults.map((r) =>
        r.agentId === agentId ? { ...r, content } : r
      ),
    }));
  },

  appendAgentContent: (agentId, chunk) => {
    set((state) => ({
      agentResults: state.agentResults.map((r) =>
        r.agentId === agentId ? { ...r, content: r.content + chunk } : r
      ),
    }));
  },

  approveStep: (stepIndex: number) => {
    const { agentResults } = get();
    const agent = AGENTS[stepIndex];
    if (!agent) return;

    const updatedResults = agentResults.map((r) =>
      r.agentId === agent.id
        ? { ...r, status: 'approved' as const, timestamp: new Date().toISOString() }
        : r
    );

    const nextStep = stepIndex + 1;
    const isComplete = nextStep >= AGENTS.length;

    set({
      agentResults: updatedResults,
      currentStep: isComplete ? stepIndex : nextStep,
      pipelineStatus: isComplete ? 'completed' : 'running',
    });
  },

  requestAdjustment: (stepIndex: number, feedback: string) => {
    const { agentResults } = get();
    const agent = AGENTS[stepIndex];
    if (!agent) return;

    set({
      agentResults: agentResults.map((r) =>
        r.agentId === agent.id
          ? {
              ...r,
              status: 'adjusting' as const,
              feedback,
              content: '',
              version: r.version + 1,
            }
          : r
      ),
    });
  },

  setMegaPromptPart: (part) => set({ megaPromptParts: [part] }),
  
  appendMegaPromptPart: (part) =>
    set((state) => ({ megaPromptParts: [...state.megaPromptParts, part] })),

  setMegaPromptComplete: (complete) => set({ megaPromptComplete: complete }),

  saveProject: () => {
    const { currentProject, agentResults, megaPromptParts, megaPromptComplete } = get();
    if (!currentProject) return;

    const projectToSave: Project = {
      ...currentProject,
      updatedAt: new Date().toISOString(),
      agentResults,
      megaPrompt: megaPromptParts.join(''),
      megaPromptComplete,
      status: megaPromptComplete ? 'completed' : currentProject.status,
    };

    const stored = localStorage.getItem('saas-factory-projects');
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const existingIdx = projects.findIndex((p) => p.id === projectToSave.id);
    if (existingIdx >= 0) {
      projects[existingIdx] = projectToSave;
    } else {
      projects.unshift(projectToSave);
    }

    localStorage.setItem('saas-factory-projects', JSON.stringify(projects));
    set({ projects, currentProject: projectToSave });
  },

  loadProject: (id: string) => {
    const stored = localStorage.getItem('saas-factory-projects');
    if (!stored) return;
    const projects: Project[] = JSON.parse(stored);
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    set({
      currentProject: project,
      currentStep: project.currentStep,
      pipelineStatus: project.status,
      agentResults: project.agentResults,
      megaPromptParts: project.megaPrompt ? [project.megaPrompt] : [],
      megaPromptComplete: project.megaPromptComplete ?? false,
      view: 'pipeline',
    });
  },

  deleteProject: (id: string) => {
    const stored = localStorage.getItem('saas-factory-projects');
    if (!stored) return;
    const projects: Project[] = JSON.parse(stored);
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem('saas-factory-projects', JSON.stringify(filtered));
    set({ projects: filtered });
  },

  loadProjectsFromStorage: () => {
    const stored = localStorage.getItem('saas-factory-projects');
    if (stored) {
      set({ projects: JSON.parse(stored) });
    }
  },

  importProject: (project: Project) => {
    const stored = localStorage.getItem('saas-factory-projects');
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const existingIdx = projects.findIndex((p) => p.id === project.id);
    if (existingIdx >= 0) {
      projects[existingIdx] = project;
    } else {
      projects.unshift(project);
    }
    localStorage.setItem('saas-factory-projects', JSON.stringify(projects));
    set({
      projects,
      currentProject: project,
      currentStep: project.currentStep,
      pipelineStatus: project.status,
      agentResults: project.agentResults,
      megaPromptParts: project.megaPrompt ? [project.megaPrompt] : [],
      megaPromptComplete: project.megaPromptComplete ?? false,
      view: 'pipeline',
    });
  },

  resetPipeline: () => {
    set({
      currentProject: null,
      currentStep: 0,
      pipelineStatus: 'idle',
      agentResults: createEmptyResults(),
      megaPromptParts: [],
      megaPromptComplete: false,
      currentProvider: null,
      providerEvents: [],
      view: 'landing',
    });
  },

  setCurrentProvider: (provider) => set({ currentProvider: provider }),

  addProviderEvent: (event) =>
    set((state) => ({ providerEvents: [...state.providerEvents, event] })),

  clearProviderEvents: () => set({ providerEvents: [] }),
}));
