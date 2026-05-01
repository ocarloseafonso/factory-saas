import type { AgentMeta, AgentId } from '../types';

export const AGENTS: AgentMeta[] = [
  {
    id: 'ana',
    name: 'Ana',
    role: 'Pesquisadora de Mercado',
    emoji: '🔍',
    color: 'agent-ana',
    colorHex: '#8b5cf6',
    description: 'Pesquisa concorrentes, tendências e oportunidades no mercado',
    avatarInitials: 'AN',
  },
  {
    id: 'carlos',
    name: 'Carlos',
    role: 'Product Manager',
    emoji: '📋',
    color: 'agent-carlos',
    colorHex: '#3b82f6',
    description: 'Define funcionalidades do MVP e roadmap do produto',
    avatarInitials: 'CA',
  },
  {
    id: 'beatriz',
    name: 'Beatriz',
    role: 'UX Designer',
    emoji: '🎨',
    color: 'agent-beatriz',
    colorHex: '#ec4899',
    description: 'Cria fluxos de navegação, telas e experiência do usuário',
    avatarInitials: 'BE',
  },
  {
    id: 'diego',
    name: 'Diego',
    role: 'Visual Designer',
    emoji: '🖼️',
    color: 'agent-diego',
    colorHex: '#f97316',
    description: 'Gera mockup visual e define identidade visual do sistema',
    avatarInitials: 'DI',
  },
  {
    id: 'rafael',
    name: 'Rafael',
    role: 'Arquiteto de Software',
    emoji: '⚙️',
    color: 'agent-rafael',
    colorHex: '#10b981',
    description: 'Define stack técnica, banco de dados e arquitetura',
    avatarInitials: 'RA',
  },
  {
    id: 'juliana',
    name: 'Juliana',
    role: 'Estrategista de Negócios',
    emoji: '💰',
    color: 'agent-juliana',
    colorHex: '#f59e0b',
    description: 'Define modelo de negócio, preços e estratégia de lançamento',
    avatarInitials: 'JU',
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'Prompt Engineer',
    emoji: '✍️',
    color: 'agent-leo',
    colorHex: '#06b6d4',
    description: 'Compila tudo em um mega-prompt único e completo',
    avatarInitials: 'LE',
  },
];

export const AGENT_MAP: Record<AgentId, AgentMeta> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a])
) as Record<AgentId, AgentMeta>;

export const EXAMPLE_IDEAS = [
  'Sistema de gestão para salão de beleza',
  'Plataforma de cursos online com certificados',
  'Marketplace de serviços freelancer',
  'App de delivery para restaurantes locais',
  'Sistema de agendamento para clínicas médicas',
  'Plataforma de gestão de condomínios',
];
