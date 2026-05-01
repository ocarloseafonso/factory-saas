import { useState, useEffect, useRef } from 'react';
import { Rocket, Sparkles, Lightbulb } from 'lucide-react';
import { EXAMPLE_IDEAS } from '../../data/agents';

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
}

export default function IdeaInput({ onSubmit }: IdeaInputProps) {
  const [idea, setIdea] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % EXAMPLE_IDEAS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (idea.trim().length < 5) return;
    setIsTyping(true);
    setTimeout(() => {
      onSubmit(idea.trim());
    }, 300);
  };

  const handleExampleClick = (example: string) => {
    setIdea(example);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-32 pb-16 p-4">
      <div className="ambient-bg" />
      
      <div className="w-full max-w-3xl animate-slide-in-up">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">SaaS Factory</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
            Sua empresa virtual de desenvolvimento. Descreva uma ideia e nossa equipe de IA 
            transforma em um projeto completo.
          </p>
        </div>

        {/* Input Card */}
        <div className="glass-card p-8 mb-6" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            💡 Descreva sua ideia de sistema
          </label>
          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={`Ex: "${EXAMPLE_IDEAS[placeholderIdx]}"`}
            className="input-field mb-5"
            style={{ minHeight: '140px', fontSize: '1.05rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          
          <button
            onClick={handleSubmit}
            disabled={idea.trim().length < 5 || isTyping}
            className="btn-primary w-full py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Rocket className="w-5 h-5" />
            Iniciar Projeto
          </button>
        </div>

        {/* Example Ideas */}
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Lightbulb className="w-4 h-4 text-[var(--color-accent-amber)]" />
            <span className="text-sm text-[var(--color-text-muted)]">
              Ou clique em uma ideia para começar:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_IDEAS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="btn-ghost text-xs px-3 py-2 hover:border-[var(--color-accent-purple)] hover:text-[var(--color-accent-purple)] transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Team Preview */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            7 especialistas prontos para trabalhar no seu projeto
          </p>
          <div className="flex justify-center gap-3">
            {['🔍', '📋', '🎨', '🖼️', '⚙️', '💰', '✍️'].map((emoji, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] flex items-center justify-center text-lg hover:scale-110 transition-transform cursor-default"
                style={{ animationDelay: `${0.7 + i * 0.05}s` }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
