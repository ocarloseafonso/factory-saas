import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';

interface MegaPromptOutputProps {
  content: string;
  isComplete: boolean;
  onContinue: () => void;
  onSave: () => void;
  onNewProject: () => void;
}

export default function MegaPromptOutput({
  content,
  isComplete,
  onContinue,
  onSave,
  onNewProject,
}: MegaPromptOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mega-prompt-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinue = async () => {
    setIsContinuing(true);
    await onContinue();
    setIsContinuing(false);
  };

  return (
    <div className="animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-bg-gold flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#1a1a2e]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Mega-Prompt Gerado
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Copie e cole no Lovable, Claude Code, Cursor ou qualquer IA de código
          </p>
        </div>
      </div>

      {/* Mega Prompt Container */}
      <div className="mega-prompt-container mb-4">
        <div className="mega-prompt-inner">
          <div
            ref={contentRef}
            className="mega-prompt-text max-h-[600px] overflow-y-auto"
          >
            {content || 'Aguardando geração do mega-prompt...'}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {isComplete ? (
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-3 h-3 rounded-full bg-[var(--color-success)] animate-pulse" />
          <span className="text-sm font-medium text-[var(--color-success)]">
            ✅ Mega-prompt FINALIZADO — pronto para uso!
          </span>
        </div>
      ) : content ? (
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-3 h-3 rounded-full bg-[var(--color-warning)] animate-pulse" />
          <span className="text-sm text-[var(--color-warning)]">
            ⏳ Mega-prompt ainda não foi finalizado. Clique em "Continuar" para completar.
          </span>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Copy - Main CTA */}
        <button
          onClick={handleCopy}
          className={`btn-copy flex-1 min-w-[200px] ${copied ? 'bg-[var(--color-success)]' : ''}`}
          style={
            copied
              ? { background: 'linear-gradient(135deg, #059669, #10b981)' }
              : undefined
          }
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copiar Mega-Prompt
            </>
          )}
        </button>

        {/* Continue Button (for Leo) */}
        {!isComplete && content && (
          <button
            onClick={handleContinue}
            disabled={isContinuing}
            className="btn-primary min-w-[160px]"
          >
            {isContinuing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Continuando...
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                Continuar
              </>
            )}
          </button>
        )}

        {/* Download */}
        <button onClick={handleDownload} className="btn-ghost">
          <Download className="w-4 h-4" />
          Download .txt
        </button>

        {/* Save */}
        <button onClick={onSave} className="btn-ghost">
          💾 Salvar Projeto
        </button>

        {/* New Project */}
        <button onClick={onNewProject} className="btn-ghost">
          <RefreshCw className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* Character count */}
      <div className="mt-3 text-xs text-[var(--color-text-muted)] text-right">
        {content.length.toLocaleString('pt-BR')} caracteres • ~{Math.ceil(content.length / 4).toLocaleString('pt-BR')} tokens
      </div>
    </div>
  );
}
