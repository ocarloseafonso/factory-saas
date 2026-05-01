import { useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { Project } from '../../types';
import {
  FolderOpen,
  Trash2,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  Play,
  ArrowLeft,
} from 'lucide-react';

export default function ProjectHistory() {
  const { projects, loadProject, deleteProject, importProject, setView, loadProjectsFromStorage } =
    useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjectsFromStorage();
  }, [loadProjectsFromStorage]);

  const handleExportProject = (project: Project) => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saas-factory-${project.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}-${project.id.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const project = JSON.parse(ev.target?.result as string) as Project;
        if (project.id && project.idea && project.agentResults) {
          importProject(project);
        } else {
          alert('Arquivo inválido. Certifique-se de que é um projeto exportado do SaaS Factory.');
        }
      } catch {
        alert('Erro ao ler arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saas-factory-todos-projetos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="ambient-bg" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('landing')} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Histórico de Projetos
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {projects.length} projeto{projects.length !== 1 ? 's' : ''} salvo{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportProject}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost text-xs"
            title="Importar projeto"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar
          </button>

          {/* Export All */}
          {projects.length > 0 && (
            <button onClick={handleExportAll} className="btn-ghost text-xs">
              <Download className="w-3.5 h-3.5" />
              Exportar Todos
            </button>
          )}
        </div>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">
            Nenhum projeto salvo
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Crie seu primeiro projeto ou importe um arquivo existente
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setView('landing')} className="btn-primary">
              Criar Projeto
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-card glass-card-hover p-5 cursor-pointer"
              onClick={() => loadProject(project.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {project.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                    ) : project.status === 'running' ? (
                      <Play className="w-4 h-4 text-[var(--color-accent-blue)] shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    )}
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                      {project.name}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] truncate pl-6">
                    {project.idea}
                  </p>
                  <div className="flex items-center gap-4 mt-2 pl-6">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(project.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {project.agentResults.filter((r) => r.status === 'approved').length}/7 etapas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleExportProject(project)}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    title="Exportar projeto"
                  >
                    <Download className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este projeto?')) {
                        deleteProject(project.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

