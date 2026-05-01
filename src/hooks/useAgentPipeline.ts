import { useCallback, useRef } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { AGENTS } from '../data/agents';
import type { AgentId } from '../types';

export interface ProviderInfo {
  id: string;
  name: string;
  emoji: string;
  tier: 'free' | 'paid';
  model: string;
}

export interface ProviderEventData {
  type: string;
  providerId?: string;
  providerName?: string;
  nextProviderName?: string;
  message: string;
  resetInHours?: number;
  tier?: string;
}

export function useAgentPipeline() {
  const store = useProjectStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeAgent = useCallback(
    async (agentId: AgentId, idea: string, feedback?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      store.setAgentStatus(agentId, 'running');
      store.setAgentContent(agentId, '');
      store.setCurrentProvider(null);
      store.clearProviderEvents();

      try {
        const previousResults = store.agentResults
          .filter((r) => r.status === 'approved')
          .map((r) => ({ agentId: r.agentId, status: r.status, content: r.content }));

        const response = await fetch(`/api/agents/${agentId}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea, previousResults, feedback }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao executar agente');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream não disponível');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'chunk') {
                  store.appendAgentContent(agentId, data.content);
                } else if (data.type === 'done') {
                  store.setAgentStatus(agentId, 'completed');
                } else if (data.type === 'error') {
                  throw new Error(data.content);
                } else if (data.type === 'provider_info') {
                  store.setCurrentProvider(data.provider as ProviderInfo);
                } else if (data.type === 'provider_event') {
                  store.addProviderEvent(data.event as ProviderEventData);
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error(`Error executing agent ${agentId}:`, error);
        const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        store.setAgentContent(agentId, `❌ Erro: ${errMsg}\n\nTente novamente.`);
        store.setAgentStatus(agentId, 'completed');
      }
    },
    [store]
  );

  const startPipeline = useCallback(
    async (idea: string) => {
      store.startProject(idea);
      await executeAgent('ana', idea);
    },
    [store, executeAgent]
  );

  const approveAndContinue = useCallback(
    async (stepIndex: number) => {
      const { currentProject } = store;
      if (!currentProject) return;

      store.approveStep(stepIndex);

      const nextStep = stepIndex + 1;
      if (nextStep < AGENTS.length) {
        const nextAgent = AGENTS[nextStep];
        await new Promise((r) => setTimeout(r, 800));
        await executeAgent(nextAgent.id, currentProject.idea);
      }
    },
    [store, executeAgent]
  );

  const adjustAgent = useCallback(
    async (stepIndex: number, feedback: string) => {
      const { currentProject } = store;
      if (!currentProject) return;

      const agent = AGENTS[stepIndex];
      store.requestAdjustment(stepIndex, feedback);
      await executeAgent(agent.id, currentProject.idea, feedback);
    },
    [store, executeAgent]
  );

  const continueMegaPrompt = useCallback(async () => {
    const { currentProject, agentResults, megaPromptParts } = store;
    if (!currentProject) return;

    try {
      const previousResults = agentResults
        .filter((r) => r.status === 'approved')
        .map((r) => ({ agentId: r.agentId, status: r.status, content: r.content }));

      const partialPrompt = megaPromptParts.join('');

      const response = await fetch('/api/agents/leo/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: currentProject.idea,
          previousResults,
          partialPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao continuar');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream não disponível');

      const decoder = new TextDecoder();
      let buffer = '';
      let newPart = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                newPart += data.content;
                const leoResult = store.agentResults.find((r) => r.agentId === 'leo');
                if (leoResult) {
                  store.setAgentContent('leo', leoResult.content + data.content);
                }
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      if (newPart) {
        store.appendMegaPromptPart(newPart);
      }
    } catch (error: unknown) {
      console.error('Error continuing mega-prompt:', error);
    }
  }, [store]);

  const stopAgent = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    startPipeline,
    approveAndContinue,
    adjustAgent,
    continueMegaPrompt,
    executeAgent,
    stopAgent,
  };
}
