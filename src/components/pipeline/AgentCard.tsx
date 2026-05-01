import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AGENT_MAP } from '../../data/agents';
import { useProjectStore } from '../../stores/projectStore';
import type { AgentResult } from '../../types';
import { Check, PenLine, Loader2, RotateCcw, Send, Zap } from 'lucide-react';

interface AgentCardProps {
  result: AgentResult;
  stepIndex: number;
  isActive: boolean;
  onApprove: () => void;
  onAdjust: (feedback: string) => void;
}

export default function AgentCard({ result, stepIndex, isActive, onApprove, onAdjust }: AgentCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const agent = AGENT_MAP[result.agentId];
  const { currentProvider, providerEvents } = useProjectStore();

  // Auto-scroll content as it streams in
  useEffect(() => {
    if (result.status === 'running' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [result.content, result.status]);

  if (!isActive && result.status === 'pending') return null;

  const isRunning = result.status === 'running' || result.status === 'adjusting';
  const isCompleted = result.status === 'completed';
  const isApproved = result.status === 'approved';

  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-500 animate-slide-in-up agent-border-${agent.id} ${
        isRunning ? `agent-glow-${agent.id}` : ''
      } flex flex-col relative`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-5 p-6 sm:px-8 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
            isRunning ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: `${agent.colorHex}15`,
            color: agent.colorHex,
            border: `2px solid ${agent.colorHex}40`,
          }}
        >
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {agent.name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
              v{result.version}
            </span>
            {isApproved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-success)] text-white flex items-center gap-1">
                <Check className="w-3 h-3" /> Aprovado
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">{agent.role}</p>
        </div>
        
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-accent-blue)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">
              {result.status === 'adjusting' ? 'Reprocessando...' : 'Analisando...'}
            </span>
          </div>
        )}

        {/* AI Provider Badge */}
        {isActive && currentProvider && (
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
              currentProvider.tier === 'free'
                ? 'bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[rgba(16,185,129,0.2)]'
                : 'bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)] border border-[rgba(245,158,11,0.2)]'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span className="hidden xl:inline">{currentProvider.emoji} {currentProvider.name}</span>
            <span className="xl:hidden">{currentProvider.emoji}</span>
            <span className={`text-[10px] px-1.5 py-0 rounded-full shrink-0 ${
              currentProvider.tier === 'free' ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-warning)] text-[#1a1a2e]'
            }`}>
              {currentProvider.tier === 'free' ? 'GRÁTIS' : 'PAGO'}
            </span>
          </div>
        )}
      </div>

      {/* Provider Events (Quota notifications) */}
      {isActive && providerEvents.length > 0 && (
        <div className="px-5 py-2 space-y-1 border-b border-[var(--color-border-subtle)] bg-[rgba(245,158,11,0.03)]">
          {providerEvents.map((event, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[var(--color-warning)]">
              <span>{event.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {result.content && (
        <div
          ref={contentRef}
          className="p-6 sm:px-8 md:px-12 py-8 markdown-content"
        >
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {result.content}
          </ReactMarkdown>
          
          {isRunning && (
            <span className="inline-block w-2 h-5 bg-[var(--color-accent-blue)] animate-typing ml-1 align-middle" />
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isRunning && !result.content && (
        <div className="p-6 sm:px-8 md:px-12 py-8 space-y-4">
          <div className="skeleton h-4 w-3/4 rounded-full" />
          <div className="skeleton h-4 w-full rounded-full" />
          <div className="skeleton h-4 w-5/6 rounded-full" />
          <div className="skeleton h-4 w-2/3 rounded-full" />
        </div>
      )}

      {/* Actions (Sticky to bottom) */}
      {isCompleted && !isApproved && (
        <div className="sticky bottom-0 z-10 p-6 sm:px-8 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] bg-opacity-95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
          {!showFeedback ? (
            <div className="flex gap-3">
              <button onClick={onApprove} className="btn-success flex-1">
                <Check className="w-4 h-4" />
                Aprovar
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                className="btn-warning flex-1"
              >
                <PenLine className="w-4 h-4" />
                Ajustar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                O que gostaria de ajustar?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={`Diga ao ${agent.name} o que precisa mudar...`}
                className="input-field"
                style={{ minHeight: '80px' }}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (feedback.trim()) {
                      onAdjust(feedback.trim());
                      setFeedback('');
                      setShowFeedback(false);
                    }
                  }}
                  disabled={!feedback.trim()}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  Reenviar para {agent.name}
                </button>
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedback('');
                  }}
                  className="btn-ghost"
                >
                  <RotateCcw className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approved indicator */}
      {isApproved && (
        <div className="px-6 sm:px-8 py-4 bg-[rgba(16,185,129,0.05)] border-t border-[rgba(16,185,129,0.2)] flex items-center gap-3">
          <Check className="w-5 h-5 text-[var(--color-success)]" />
          <span className="text-sm font-medium text-[var(--color-success)]">
            Aprovado pelo chefe — avançando para o próximo agente
          </span>
        </div>
      )}
    </div>
  );
}
