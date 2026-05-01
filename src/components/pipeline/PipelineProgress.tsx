import { AGENTS } from '../../data/agents';
import type { AgentResult } from '../../types';
import { Check, Loader2, Clock, PenLine } from 'lucide-react';

interface PipelineProgressProps {
  currentStep: number;
  agentResults: AgentResult[];
}

export default function PipelineProgress({ currentStep, agentResults }: PipelineProgressProps) {
  return (
    <div className="w-full h-full">
      <div className="p-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4 px-2">
          Equipe de Desenvolvimento
        </h3>
        
        <div className="space-y-1 stagger-children">
          {AGENTS.map((agent, index) => {
            const result = agentResults[index];
            const isActive = index === currentStep;
            const isCompleted = result?.status === 'approved';
            const isRunning = result?.status === 'running';
            const isAdjusting = result?.status === 'adjusting';
            const isPending = result?.status === 'pending';
            const isDone = result?.status === 'completed';

            return (
              <div
                key={agent.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                  isActive
                    ? `bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] agent-glow-${agent.id}`
                    : 'hover:bg-[var(--color-bg-tertiary)]'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[var(--color-success)] text-white'
                      : isRunning || isAdjusting
                      ? 'animate-pulse-glow'
                      : 'bg-[var(--color-bg-elevated)]'
                  }`}
                  style={{
                    backgroundColor: isCompleted
                      ? undefined
                      : isRunning || isAdjusting
                      ? `${agent.colorHex}22`
                      : undefined,
                    color: isCompleted ? 'white' : agent.colorHex,
                    border: isRunning || isAdjusting ? `2px solid ${agent.colorHex}` : 'none',
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isAdjusting ? (
                    <PenLine className="w-4 h-4" />
                  ) : (
                    <span className="text-base">{agent.emoji}</span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium truncate ${
                      isActive || isRunning
                        ? 'text-[var(--color-text-primary)]'
                        : isPending
                        ? 'text-[var(--color-text-muted)]'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {agent.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {agent.role}
                  </p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {isCompleted && (
                    <span className="text-xs text-[var(--color-success)] font-medium">✓</span>
                  )}
                  {isRunning && (
                    <span className="text-xs text-[var(--color-accent-blue)] animate-pulse">
                      ●
                    </span>
                  )}
                  {isDone && !isCompleted && (
                    <Clock className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                  )}
                  {isAdjusting && (
                    <span className="text-xs text-[var(--color-warning)] animate-pulse">
                      ●
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4 px-2">
          <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
            <span>Progresso</span>
            <span>
              {agentResults.filter((r) => r.status === 'approved').length}/{AGENTS.length}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full gradient-bg rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(agentResults.filter((r) => r.status === 'approved').length / AGENTS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
