import { useEffect, useState } from 'react';
import { useProjectStore } from './stores/projectStore';
import { useAgentPipeline } from './hooks/useAgentPipeline';
import IdeaInput from './components/landing/IdeaInput';
import PipelineView from './components/pipeline/PipelineView';
import ProjectHistory from './components/projects/ProjectHistory';
import { FolderOpen, Sparkles, Settings } from 'lucide-react';

export default function App() {
  const { view, setView, loadProjectsFromStorage, projects } = useProjectStore();
  const { startPipeline } = useAgentPipeline();

  // Load saved projects on mount
  useEffect(() => {
    loadProjectsFromStorage();
  }, [loadProjectsFromStorage]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Navigation - only show on landing */}
      {view === 'landing' && (
        <nav className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] bg-opacity-80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">SaaS Factory</span>
            </div>

            <div className="flex items-center gap-2">
              {projects.length > 0 && (
                <button
                  onClick={() => setView('history')}
                  className="btn-ghost text-xs"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Projetos ({projects.length})
                </button>
              )}
              <button
                onClick={() => setView('settings')}
                className="btn-ghost p-2"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Views */}
      {view === 'landing' && (
        <div className="pt-14">
          <IdeaInput onSubmit={startPipeline} />
        </div>
      )}

      {view === 'pipeline' && <PipelineView />}

      {view === 'history' && <ProjectHistory />}

      {view === 'settings' && <SettingsView />}
    </div>
  );
}

/* ═══════════════════════════════════════ */
/*  Settings View — Hierarquia de IAs      */
/* ═══════════════════════════════════════ */

function SettingsView() {
  const { setView } = useProjectStore();
  const [providers, setProviders] = useState<Array<{
    id: string; name: string; emoji: string; tier: string;
    priority: number; model: string; status: string;
    costPer1MTokens: { input: number; output: number };
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Load provider status
  useEffect(() => {
    fetch('/api/providers')
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleResetAll = async () => {
    await fetch('/api/providers/reset', { method: 'POST' });
    const res = await fetch('/api/providers');
    const data = await res.json();
    setProviders(data.providers || []);
  };

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="ambient-bg" />
      
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setView('landing')} className="btn-ghost p-2">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Configurações
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Hierarquia de IAs e plano de contingência
          </p>
        </div>
      </div>

      {/* Hierarchy Explanation */}
      <div className="glass-card p-5 mb-4 gradient-border">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
          🧠 Plano de Contingência Inteligente
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3 leading-relaxed">
          O sistema usa automaticamente a <strong>melhor IA gratuita disponível</strong>. 
          Se a cota gratuita esgotar, troca automaticamente para a próxima na hierarquia. 
          Você será avisado sobre cada troca. O <strong>Gemini é o último recurso</strong> (cota mais generosa).
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[rgba(16,185,129,0.2)]">
            1º OpenRouter Grátis
          </span>
          <span className="text-[var(--color-text-muted)]">→</span>
          <span className="px-2 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)] border border-[rgba(245,158,11,0.2)]">
            2º GPT-4o Mini (pago)
          </span>
          <span className="text-[var(--color-text-muted)]">→</span>
          <span className="px-2 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)] border border-[rgba(245,158,11,0.2)]">
            3º OpenRouter Pago
          </span>
          <span className="text-[var(--color-text-muted)]">→</span>
          <span className="px-2 py-1 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--color-accent-blue)] border border-[rgba(99,102,241,0.2)]">
            4º Gemini Flash (último)
          </span>
        </div>
      </div>

      {/* Provider Hierarchy */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            📊 Hierarquia de IAs ({providers.length} providers)
          </h3>
          <button onClick={handleResetAll} className="btn-ghost text-xs">
            🔄 Resetar Status
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {providers.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  p.status === 'active'
                    ? 'border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]'
                    : p.status === 'quota_exceeded'
                    ? 'border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)]'
                    : 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)]'
                }`}
              >
                {/* Priority */}
                <div className="w-7 h-7 rounded-full bg-[var(--color-bg-primary)] flex items-center justify-center text-xs font-bold text-[var(--color-text-muted)] shrink-0">
                  {i + 1}
                </div>

                {/* Emoji */}
                <span className="text-lg shrink-0">{p.emoji}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {p.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      p.tier === 'free'
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-[var(--color-warning)] text-[#1a1a2e]'
                    }`}>
                      {p.tier === 'free' ? 'GRÁTIS' : 'PAGO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span>Modelo: {p.model}</span>
                    {p.tier === 'paid' && (
                      <span>Custo: ${p.costPer1MTokens.input}/{p.costPer1MTokens.output} por 1M tokens</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {p.status === 'active' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[var(--color-success)]">
                      ✅ Ativo
                    </span>
                  )}
                  {p.status === 'quota_exceeded' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)]">
                      ⏳ Cota Esgotada
                    </span>
                  )}
                  {p.status === 'error' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--color-error)]">
                      ❌ Erro
                    </span>
                  )}
                  {p.status === 'disabled' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
                      ⏸️ Desativado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys */}
      <div className="glass-card p-5 mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          🔑 Chaves de API Configuradas
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <span className="text-lg">🌐</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">OpenRouter</p>
              <p className="text-xs text-[var(--color-text-muted)]">Modelos gratuitos e pagos — sk-or-...847</p>
            </div>
            <span className="text-xs text-[var(--color-success)]">✅ Configurada</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <span className="text-lg">🤖</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">OpenAI (GPT)</p>
              <p className="text-xs text-[var(--color-text-muted)]">GPT-4o Mini — sk-proj-...0-8A</p>
            </div>
            <span className="text-xs text-[var(--color-success)]">✅ Configurada</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <span className="text-lg">💎</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Google Gemini</p>
              <p className="text-xs text-[var(--color-text-muted)]">Gemini 2.5 Flash — AIza...T10</p>
            </div>
            <span className="text-xs text-[var(--color-success)]">✅ Configurada</span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          💾 Dados
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Projetos são salvos localmente. Use Download/Upload no Histórico para backup.
        </p>
        <button
          onClick={() => {
            if (confirm('Tem certeza? Isso irá apagar TODOS os projetos salvos.')) {
              localStorage.removeItem('saas-factory-projects');
              alert('Dados limpos com sucesso.');
            }
          }}
          className="btn-ghost text-xs text-[var(--color-error)] border-[var(--color-error)] hover:bg-[rgba(239,68,68,0.1)]"
        >
          🗑️ Limpar todos os dados
        </button>
      </div>
    </div>
  );
}

