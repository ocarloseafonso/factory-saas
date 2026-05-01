import { AGENTS } from '../../data/agents';
import { useProjectStore } from '../../stores/projectStore';
import { useAgentPipeline } from '../../hooks/useAgentPipeline';
import PipelineProgress from './PipelineProgress';
import AgentCard from './AgentCard';
import MegaPromptOutput from '../result/MegaPromptOutput';
import { ArrowLeft, Save } from 'lucide-react';

export default function PipelineView() {
  const {
    currentProject,
    currentStep,
    agentResults,
    pipelineStatus,
    megaPromptParts,
    megaPromptComplete,
    setView,
    saveProject,
    resetPipeline,
    setMegaPromptComplete,
  } = useProjectStore();

  const { approveAndContinue, adjustAgent, continueMegaPrompt } = useAgentPipeline();

  if (!currentProject) return null;

  const allApproved = agentResults.every((r) => r.status === 'approved');
  const leoResult = agentResults.find((r) => r.agentId === 'leo');
  const megaPromptContent = megaPromptParts.join('') || leoResult?.content || '';

  // When Leo finishes, mark mega prompt from his content
  const handleLeoApprove = () => {
    const leoContent = agentResults.find((r) => r.agentId === 'leo')?.content || '';
    if (leoContent && megaPromptParts.length === 0) {
      useProjectStore.getState().setMegaPromptPart(leoContent);
    }
    approveAndContinue(6); // Leo is index 6
  };

  const handleMarkComplete = () => {
    setMegaPromptComplete(true);
    saveProject();
  };

  return (
    <div className="pipeline-layout">
      <div className="ambient-bg" />

      {/* Top Navigation Bar */}
      <header className="shrink-0 z-20 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-subtle)] backdrop-blur-lg bg-opacity-90">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setView('landing')} className="btn-ghost p-2 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {currentProject.idea}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {pipelineStatus === 'completed'
                  ? '✅ Projeto concluído'
                  : `Etapa ${currentStep + 1} de ${AGENTS.length} — ${AGENTS[currentStep]?.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={saveProject} className="btn-ghost text-xs shrink-0">
               <Save className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Salvar</span>
             </button>
          </div>
        </div>
      </header>

      {/* Content Area with Independent Scrolls */}
      <div className="pipeline-content-area flex-col lg:flex-row">
        
        {/* Sidebar - Agent Progress */}
        <div className="scroll-area-sidebar border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)]">
          <div className="p-4">
            <PipelineProgress currentStep={currentStep} agentResults={agentResults} />
          </div>
        </div>

        {/* Main Area - Agent Cards */}
        <div className="scroll-area-main">
          <div className="content-container">
            <div className="space-y-8 pb-20">
              {AGENTS.map((agent, index) => {
                const result = agentResults[index];
                const isActive = index === currentStep;
                const isVisible =
                  result.status !== 'pending' || index === currentStep;

                if (!isVisible) return null;

                // For Leo (last agent), handle special approve
                const onApprove =
                  agent.id === 'leo' ? handleLeoApprove : () => approveAndContinue(index);

                return (
                  <AgentCard
                    key={`${agent.id}-${result.version}`}
                    result={result}
                    stepIndex={index}
                    isActive={isActive}
                    onApprove={onApprove}
                    onAdjust={(feedback) => adjustAgent(index, feedback)}
                  />
                );
              })}

              {/* Mega Prompt Output */}
              {allApproved && megaPromptContent && (
                <div className="mt-8">
                  <MegaPromptOutput
                    content={megaPromptContent}
                    isComplete={megaPromptComplete}
                    onContinue={async () => {
                      await continueMegaPrompt();
                    }}
                    onSave={() => {
                      if (!megaPromptComplete) {
                        handleMarkComplete();
                      }
                      saveProject();
                    }}
                    onNewProject={resetPipeline}
                  />

                  {/* Mark as complete button */}
                  {!megaPromptComplete && megaPromptContent.length > 100 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={handleMarkComplete}
                        className="btn-success"
                      >
                        ✅ Marcar Mega-Prompt como Finalizado
                      </button>
                      <p className="text-xs text-[var(--color-text-muted)] mt-2">
                        Clique quando o prompt estiver completo e pronto para uso
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
