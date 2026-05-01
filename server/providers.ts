/* ═══════════════════════════════════════ */
/*  SaaS Factory — AI Provider Manager    */
/*  Hierarquia inteligente com fallback   */
/* ═══════════════════════════════════════ */

export interface ProviderConfig {
  id: string;
  name: string;
  emoji: string;
  tier: 'free' | 'paid';
  priority: number;        // menor = maior prioridade
  apiKey: string;
  baseUrl: string;
  model: string;
  searchModel?: string;    // modelo com busca (para Ana)
  supportsSearch: boolean;
  costPer1MTokens: { input: number; output: number };
  quotaResetHours: number; // horas para resetar cota
  status: 'active' | 'quota_exceeded' | 'error' | 'disabled';
  quotaExceededAt?: number;
  errorMessage?: string;
  type: 'openai-compatible' | 'gemini';
}

export interface ProviderEvent {
  type: 'provider_switch' | 'quota_exceeded' | 'all_exhausted' | 'provider_restored';
  providerId: string;
  providerName: string;
  message: string;
  nextProviderId?: string;
  nextProviderName?: string;
  resetInHours?: number;
  tier?: 'free' | 'paid';
}

// ═══════════════════════════════════════
// Provider Definitions — Hierarquia de IAs
// ═══════════════════════════════════════

export function buildProviderHierarchy(keys: {
  gemini?: string;
  openai?: string;
  openrouter?: string;
}): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  // ─── PRIORIDADE 1: OpenRouter Free Models (mais forte grátis) ───
  if (keys.openrouter) {
    providers.push({
      id: 'openrouter-free-gemini',
      name: 'OpenRouter (Gemini Flash Grátis)',
      emoji: '🌐',
      tier: 'free',
      priority: 1,
      apiKey: keys.openrouter,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'google/gemini-2.5-flash-preview-05-20',
      searchModel: 'google/gemini-2.5-flash-preview-05-20',
      supportsSearch: false,
      costPer1MTokens: { input: 0, output: 0 },
      quotaResetHours: 24,
      status: 'active',
      type: 'openai-compatible',
    });

    providers.push({
      id: 'openrouter-free-llama',
      name: 'OpenRouter (Llama 4 Scout Grátis)',
      emoji: '🦙',
      tier: 'free',
      priority: 2,
      apiKey: keys.openrouter,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-4-scout:free',
      supportsSearch: false,
      costPer1MTokens: { input: 0, output: 0 },
      quotaResetHours: 24,
      status: 'active',
      type: 'openai-compatible',
    });

    providers.push({
      id: 'openrouter-free-qwen',
      name: 'OpenRouter (Qwen3 Grátis)',
      emoji: '🧠',
      tier: 'free',
      priority: 3,
      apiKey: keys.openrouter,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'qwen/qwen3-235b-a22b:free',
      supportsSearch: false,
      costPer1MTokens: { input: 0, output: 0 },
      quotaResetHours: 24,
      status: 'active',
      type: 'openai-compatible',
    });
  }

  // ─── PRIORIDADE 4: OpenAI GPT-4o-mini (pago, barato) ───
  if (keys.openai) {
    providers.push({
      id: 'openai-gpt4o-mini',
      name: 'OpenAI GPT-4o Mini',
      emoji: '🤖',
      tier: 'paid',
      priority: 4,
      apiKey: keys.openai,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      supportsSearch: false,
      costPer1MTokens: { input: 0.15, output: 0.60 },
      quotaResetHours: 0,
      status: 'active',
      type: 'openai-compatible',
    });
  }

  // ─── PRIORIDADE 5: OpenRouter Paid (modelos baratos) ───
  if (keys.openrouter) {
    providers.push({
      id: 'openrouter-paid-llama',
      name: 'OpenRouter (Llama 4 Maverick Pago)',
      emoji: '🦙',
      tier: 'paid',
      priority: 5,
      apiKey: keys.openrouter,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-4-maverick',
      supportsSearch: false,
      costPer1MTokens: { input: 0.20, output: 0.60 },
      quotaResetHours: 0,
      status: 'active',
      type: 'openai-compatible',
    });
  }

  // ─── PRIORIDADE 6 (ÚLTIMO RECURSO): Google Gemini Flash (grátis, limite generoso) ───
  if (keys.gemini) {
    providers.push({
      id: 'gemini-flash',
      name: 'Google Gemini 2.5 Flash',
      emoji: '💎',
      tier: 'free',
      priority: 6,
      apiKey: keys.gemini,
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-2.5-flash',
      searchModel: 'gemini-2.5-flash',
      supportsSearch: true,
      costPer1MTokens: { input: 0, output: 0 },
      quotaResetHours: 24,
      status: 'active',
      type: 'gemini',
    });
  }

  return providers.sort((a, b) => a.priority - b.priority);
}

// ═══════════════════════════════════════
// Provider Manager — Gerencia Fallback
// ═══════════════════════════════════════

export class ProviderManager {
  private providers: ProviderConfig[];
  private eventListeners: ((event: ProviderEvent) => void)[] = [];

  constructor(providers: ProviderConfig[]) {
    this.providers = providers;
    this.checkQuotaResets();
  }

  onEvent(listener: (event: ProviderEvent) => void) {
    this.eventListeners.push(listener);
  }

  private emit(event: ProviderEvent) {
    this.eventListeners.forEach((l) => l(event));
  }

  // Check if any exhausted quotas have reset
  private checkQuotaResets() {
    const now = Date.now();
    for (const p of this.providers) {
      if (p.status === 'quota_exceeded' && p.quotaExceededAt && p.quotaResetHours > 0) {
        const resetMs = p.quotaResetHours * 60 * 60 * 1000;
        if (now - p.quotaExceededAt >= resetMs) {
          p.status = 'active';
          p.quotaExceededAt = undefined;
          p.errorMessage = undefined;
          this.emit({
            type: 'provider_restored',
            providerId: p.id,
            providerName: p.name,
            message: `✅ ${p.name} está disponível novamente!`,
          });
        }
      }
    }
  }

  // Get the best available provider
  getBestProvider(needsSearch: boolean = false): ProviderConfig | null {
    this.checkQuotaResets();

    // If search is needed, prefer providers that support it
    if (needsSearch) {
      const searchProvider = this.providers.find(
        (p) => p.status === 'active' && p.supportsSearch
      );
      if (searchProvider) return searchProvider;
    }

    // Return highest priority active provider
    return this.providers.find((p) => p.status === 'active') || null;
  }

  // Mark a provider as quota exceeded and get next
  markQuotaExceeded(providerId: string): { next: ProviderConfig | null; event: ProviderEvent } {
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider) {
      provider.status = 'quota_exceeded';
      provider.quotaExceededAt = Date.now();

      const resetHours = provider.quotaResetHours || 24;
      const next = this.getBestProvider();

      const event: ProviderEvent = next
        ? {
            type: 'provider_switch',
            providerId: provider.id,
            providerName: provider.name,
            nextProviderId: next.id,
            nextProviderName: next.name,
            message: `⚠️ Cota do ${provider.name} esgotada! Trocando para ${next.name}...`,
            resetInHours: resetHours,
            tier: next.tier,
          }
        : {
            type: 'all_exhausted',
            providerId: provider.id,
            providerName: provider.name,
            message: `🚨 Todas as IAs estão com cota esgotada! Aguarde ${resetHours}h para nova cota.`,
            resetInHours: resetHours,
          };

      this.emit(event);
      return { next, event };
    }

    return { next: this.getBestProvider(), event: { type: 'all_exhausted', providerId, providerName: '', message: 'Provider não encontrado' } };
  }

  // Mark provider as errored
  markError(providerId: string, errorMessage: string) {
    const provider = this.providers.find((p) => p.id === providerId);
    if (provider) {
      provider.status = 'error';
      provider.errorMessage = errorMessage;
    }
  }

  // Get all providers status (for settings UI)
  getStatus(): ProviderConfig[] {
    this.checkQuotaResets();
    return this.providers.map((p) => ({ ...p, apiKey: p.apiKey ? '***' + p.apiKey.slice(-4) : '' }));
  }

  // Update API keys and rebuild
  updateKeys(keys: { gemini?: string; openai?: string; openrouter?: string }) {
    this.providers = buildProviderHierarchy(keys);
  }

  // Reset all providers to active
  resetAll() {
    this.providers.forEach((p) => {
      p.status = 'active';
      p.quotaExceededAt = undefined;
      p.errorMessage = undefined;
    });
  }
}

// ═══════════════════════════════════════
// Helper: Check if error is quota related
// ═══════════════════════════════════════

export function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('quota') ||
      msg.includes('too many requests') ||
      msg.includes('resource_exhausted') ||
      msg.includes('insufficient_quota') ||
      msg.includes('rate_limit_exceeded')
    );
  }
  return false;
}
