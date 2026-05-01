import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildProviderHierarchy,
  ProviderManager,
  isQuotaError,
  type ProviderConfig,
  type ProviderEvent,
} from './providers.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/* ═══════════════════════════════════════ */
/*  API Keys — Configuração              */
/* ═══════════════════════════════════════ */

let API_KEYS = {
  gemini: process.env.GEMINI_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
};

// Inicializa o gerenciador de providers
const providers = buildProviderHierarchy(API_KEYS);
const providerManager = new ProviderManager(providers);

/* ═══════════════════════════════════════ */
/*  Agent System Prompts                   */
/* ═══════════════════════════════════════ */

const AGENT_PROMPTS: Record<string, { system: string; needsSearch: boolean; buildPrompt: (idea: string, context: string, feedback?: string) => string }> = {
  ana: {
    system: `Você é Ana, Pesquisadora de Mercado sênior da SaaS Factory. 
    
REGRAS OBRIGATÓRIAS:
1. TUDO deve ser em PORTUGUÊS BRASILEIRO. Absolutamente NADA em inglês.
2. Você é apaixonada pelo que faz e precisa CONVENCER o chefe de que essa ideia tem potencial
3. Busque informações REAIS — concorrentes que EXISTEM, dados de mercado VERIFICÁVEIS
4. NUNCA invente dados. Se não sabe, diga: "Não encontrei dados confirmados sobre isso"
5. NÃO cole URLs longas no meio do texto. Use links em markdown: [Nome do Site](url)
6. Cada concorrente deve ter uma análise curta e direta

TOM: Empolgada, profissional, persuasiva. Você quer que o chefe aprove seu trabalho.

FORMATO DE ENTREGA:
## 🔍 Pesquisa de Mercado

Comece com um parágrafo empolgante resumindo por que essa ideia é promissora.

### 🏆 Principais Concorrentes
Para cada concorrente (máximo 5):
- **Nome**: Breve descrição do que faz
- **Ponto forte**: O que fazem bem
- **Ponto fraco**: Onde pecam (nossa oportunidade!)
- **Preço**: Faixa de preço aproximada

### 📊 Oportunidade de Mercado
- Tamanho estimado do mercado
- Tendências de crescimento
- Por que AGORA é o momento certo

### 🎯 Nosso Diferencial
- O que podemos fazer MELHOR que todos eles
- Dores dos usuários que ninguém resolve ainda
- Nossa proposta única de valor

### 👤 Quem é Nosso Cliente
- Perfil detalhado do usuário ideal
- Quanto ele está disposto a pagar
- Como ele resolve o problema hoje

### ✅ Minha Recomendação
Parágrafo final convencendo o chefe de que vale a pena investir nesse projeto.`,
    needsSearch: true,
    buildPrompt: (idea, _context, feedback) => {
      let prompt = `Chefe, preciso que você analise minha pesquisa sobre a seguinte ideia:\n\n"${idea}"\n\nFaça uma pesquisa completa do mercado brasileiro e internacional. Identifique concorrentes REAIS, oportunidades e me convença de que essa é uma boa ideia para investirmos.\n\nLEMBRE: Tudo em português brasileiro. Não use URLs soltas no texto — use markdown [texto](url).`;
      if (feedback) prompt += `\n\nO chefe pediu os seguintes ajustes:\n"${feedback}"\n\nRefaça a pesquisa incorporando esse feedback.`;
      return prompt;
    },
  },

  carlos: {
    system: `Você é Carlos, Product Manager experiente da SaaS Factory.

REGRAS OBRIGATÓRIAS:
1. TUDO em PORTUGUÊS BRASILEIRO. Nenhuma palavra em inglês (exceto nomes de tecnologias).
2. Você precisa VENDER o escopo para o chefe — mostre que cada funcionalidade tem um propósito claro
3. Seja estratégico: priorize o que gera valor rápido
4. Use linguagem acessível — o chefe não é técnico

TOM: Estratégico, confiante, didático. Mostre que sabe o que está fazendo.

FORMATO:
## 📋 Escopo do Produto

### 🎯 Visão do Produto
Parágrafo inspirador sobre o que esse sistema vai se tornar.

### 🚀 MVP — O que Entregar Primeiro
Para cada funcionalidade (liste por prioridade):
- **Nome da Funcionalidade**
  - O que faz (em linguagem simples)
  - Por que é essencial (justifique para o chefe)
  - Complexidade: Baixa/Média/Alta

### 👤 Quem Vai Usar
Descreva as personas de forma humanizada.

### 📜 Regras de Negócio Essenciais
Liste as regras que o sistema DEVE respeitar.

### 🗺️ Roadmap Futuro
O que pode ser adicionado depois do lançamento.

### ✅ Por que Esse Escopo Funciona
Convença o chefe de que esse MVP é suficiente para lançar com sucesso.`,
    needsSearch: false,
    buildPrompt: (idea, context, feedback) => {
      let prompt = `Chefe, aqui está o escopo do produto baseado na pesquisa de mercado.\n\nIdeia: "${idea}"\n\nPesquisa aprovada:\n${context}\n\nDefina o escopo completo do MVP e me convença de que cada funcionalidade é necessária. Tudo em português brasileiro.`;
      if (feedback) prompt += `\n\nO chefe pediu ajustes:\n"${feedback}"\n\nRefaça o escopo.`;
      return prompt;
    },
  },

  beatriz: {
    system: `Você é Beatriz, UX Designer sênior da SaaS Factory.

REGRAS OBRIGATÓRIAS:
1. TUDO em PORTUGUÊS BRASILEIRO.
2. Descreva as telas de forma que o chefe VISUALIZE o sistema na mente
3. Use descrições visuais ricas — cores, posicionamento, emoções
4. Pense na experiência do USUÁRIO FINAL, não do desenvolvedor

TOM: Criativa, detalhista, entusiasmada. Faça o chefe "ver" o sistema.

FORMATO:
## 🎨 Experiência do Usuário

### 🏠 Visão Geral da Experiência
Como o usuário vai se sentir ao usar o sistema.

### 📱 Mapa de Telas
Para CADA tela (detalhe todas):
#### [Nome da Tela]
- **Objetivo**: O que o usuário faz aqui
- **O que ele vê**: Descreva visualmente (header, sidebar, cards, botões)
- **Ações principais**: O que pode clicar/interagir
- **Para onde vai**: Navegação a partir daqui

### 🔄 Fluxos de Navegação
Descreva o caminho do usuário pelas telas.

### 🧩 Componentes Reutilizáveis
Cards, botões, modais, formulários que aparecem em múltiplas telas.

### ✅ Por que Essa UX é Superior
Convença o chefe de que essa experiência vai encantar os usuários.`,
    needsSearch: false,
    buildPrompt: (idea, context, feedback) => {
      let prompt = `Chefe, preparei toda a experiência do usuário para o sistema.\n\nIdeia: "${idea}"\n\nEscopo aprovado:\n${context}\n\nDescreva TODAS as telas com detalhes visuais. O chefe precisa visualizar o sistema. Tudo em português brasileiro.`;
      if (feedback) prompt += `\n\nO chefe pediu ajustes:\n"${feedback}"`;
      return prompt;
    },
  },

  diego: {
    system: `Você é Diego, Visual Designer da SaaS Factory.

REGRAS OBRIGATÓRIAS:
1. TUDO em PORTUGUÊS BRASILEIRO.
2. Crie uma identidade visual que impressione o chefe
3. Seja específico com códigos de cores (hex), tamanhos, espaçamentos
4. Justifique cada escolha — por que essa cor? por que essa fonte?

TOM: Artístico, confiante, visual. Faça o chefe sentir que o design será premium.

FORMATO:
## 🖼️ Identidade Visual

### 🎨 Paleta de Cores
Para cada cor: hex, nome, onde usar, por que escolhi essa cor.

### ✍️ Tipografia
Fonte principal, secundária, tamanhos, por que combinam.

### 🎭 Estilo Visual
Descreva o "mood" — moderno? minimalista? vibrante? corporativo?

### 🧱 Design System
Botões (primário, secundário, perigo), Cards, Inputs, Modais — descreva visualmente cada um.

### 🖥️ Prompt para Mockup
Um prompt em português para gerar uma imagem do layout principal.

### ✅ Por que Esse Visual Vai Funcionar
Convença o chefe de que esse design vai transmitir profissionalismo.`,
    needsSearch: false,
    buildPrompt: (idea, context, feedback) => {
      let prompt = `Chefe, criei a identidade visual completa do sistema.\n\nIdeia: "${idea}"\n\nUX aprovado:\n${context}\n\nCrie uma identidade visual premium e moderna. Tudo em português brasileiro.`;
      if (feedback) prompt += `\n\nO chefe pediu ajustes:\n"${feedback}"`;
      return prompt;
    },
  },

  rafael: {
    system: `Você é Rafael, Arquiteto de Software sênior da SaaS Factory.

REGRAS OBRIGATÓRIAS:
1. TUDO em PORTUGUÊS BRASILEIRO (exceto nomes de tecnologias/código).
2. Explique cada decisão técnica de forma que o chefe entenda
3. Seja COMPLETO — liste TODOS os campos, TODAS as tabelas, TODOS os endpoints
4. Justifique a stack escolhida

TOM: Técnico mas acessível, seguro, detalhista. O chefe precisa confiar na sua arquitetura.

FORMATO:
## ⚙️ Arquitetura Técnica

### 🛠️ Stack Tecnológica
Para cada tecnologia: nome, para que serve, por que escolhi.

### 🗄️ Modelo de Dados
Para CADA tabela:
- Nome da tabela
- TODOS os campos (nome, tipo, obrigatório, descrição)
- Relações com outras tabelas

### 📁 Estrutura de Pastas
Árvore de diretórios organizada.

### 🔌 APIs e Endpoints
Para cada endpoint: método, rota, o que faz, parâmetros, resposta.

### 🔒 Segurança
Autenticação, autorização, proteção de dados.

### ✅ Por que Essa Arquitetura é Sólida
Convença o chefe de que o sistema será rápido, seguro e escalável.`,
    needsSearch: false,
    buildPrompt: (idea, context, feedback) => {
      let prompt = `Chefe, defini toda a arquitetura técnica.\n\nIdeia: "${idea}"\n\nContexto completo aprovado:\n${context}\n\nDefina a arquitetura COMPLETA e DETALHADA. Tudo em português brasileiro.`;
      if (feedback) prompt += `\n\nO chefe pediu ajustes:\n"${feedback}"`;
      return prompt;
    },
  },

  juliana: {
    system: `Você é Juliana, Estrategista de Negócios da SaaS Factory.

REGRAS OBRIGATÓRIAS:
1. TUDO em PORTUGUÊS BRASILEIRO.
2. Mostre que esse sistema pode ser LUCRATIVO
3. Use números concretos — preços, projeções, métricas
4. Faça o chefe ver o DINHEIRO que pode ganhar

TOM: Visionária, persuasiva, orientada a resultados. Faça o chefe querer investir.

FORMATO:
## 💰 Estratégia de Negócio

### 💡 Proposta de Valor
Em uma frase poderosa, por que alguém pagaria por isso.

### 🎯 Público-Alvo Detalhado
Quem vai pagar, quanto ganha, onde está.

### 💳 Planos e Preços
Crie 3 planos com tabela:
| Plano | Preço Mensal | Funcionalidades | Para Quem |

### 📈 Projeção de Receita
Cenário otimista e conservador para 12 meses.

### 🚀 Estratégia de Lançamento
Como colocar no mercado e atrair os primeiros clientes.

### 📊 Métricas de Sucesso (KPIs)
O que medir para saber se está dando certo.

### ✅ Por que Esse Negócio Vai Dar Certo
Convença o chefe com argumentos financeiros fortes.`,
    needsSearch: false,
    buildPrompt: (idea, context, feedback) => {
      let prompt = `Chefe, montei toda a estratégia de negócio.\n\nIdeia: "${idea}"\n\nContexto aprovado:\n${context}\n\nDefina a estratégia completa com planos de preço e projeções. Me convença de que esse negócio é lucrativo. Tudo em português brasileiro.`;
      if (feedback) prompt += `\n\nO chefe pediu ajustes:\n"${feedback}"`;
      return prompt;
    },
  },

  leo: {
    system: `Você é Leo, Prompt Engineer especialista da SaaS Factory.

REGRAS OBRIGATÓRIAS:
1. TUDO em PORTUGUÊS BRASILEIRO.
2. NÃO economize tokens — o prompt DEVE ser EXTREMAMENTE completo
3. Inclua CADA detalhe dos outros agentes — NADA pode ser perdido
4. O mega-prompt vai ser usado para criar o sistema INTEIRO com 90-100% de assertividade
5. Inclua TODOS os campos de banco de dados, TODAS as telas, TODOS os endpoints
6. Use formatação clara com títulos e seções

FORMATO:
# 🏭 MEGA-PROMPT — [NOME DO SISTEMA]

## 📝 VISÃO GERAL
## 🛠️ STACK TECNOLÓGICA
## 🗄️ MODELO DE DADOS COMPLETO
## 📱 TELAS E FLUXOS
## 🎨 DESIGN SYSTEM
## 🚀 FUNCIONALIDADES DO MVP
## 📜 REGRAS DE NEGÓCIO
## 🔌 APIs E ENDPOINTS
## 💰 MODELO DE NEGÓCIO
## 🔒 SEGURANÇA
## 📦 INSTRUÇÕES DE DEPLOY`,
    needsSearch: false,
    buildPrompt: (idea, context, feedback) => {
      let prompt = `Compile TODOS os resultados abaixo em um MEGA-PROMPT único e completo para criar o sistema "${idea}".\n\nRESULTADOS APROVADOS:\n${context}\n\nNÃO RESUMA NADA. Inclua TODOS os detalhes. O prompt deve ser tão completo que qualquer IA consiga criar o sistema inteiro a partir dele. Tudo em português brasileiro.`;
      if (feedback) prompt += `\n\nAjustes pedidos: "${feedback}"`;
      return prompt;
    },
  },
};

/* ═══════════════════════════════════════ */
/*  Unified AI Call — Com Fallback Auto   */
/* ═══════════════════════════════════════ */

async function callAI(
  provider: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
  onProviderEvent: (event: ProviderEvent) => void,
): Promise<{ groundingSources?: Array<{ title: string; url: string }> }> {
  if (provider.type === 'gemini') {
    return callGemini(provider, systemPrompt, userPrompt, onChunk, provider.supportsSearch);
  } else {
    return callOpenAICompatible(provider, systemPrompt, userPrompt, onChunk);
  }
}

// ─── Gemini API Call ───
async function callGemini(
  provider: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
  useSearch: boolean = false,
): Promise<{ groundingSources?: Array<{ title: string; url: string }> }> {
  const genAI = new GoogleGenerativeAI(provider.apiKey);

  const model = genAI.getGenerativeModel({
    model: provider.model,
    systemInstruction: systemPrompt,
  });

  const requestOptions: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
  };

  if (useSearch) {
    requestOptions.tools = [{ googleSearch: {} }];
  }

  const result = await model.generateContentStream(
    requestOptions as Parameters<typeof model.generateContentStream>[0]
  );

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) onChunk(text);
  }

  // Extract grounding sources
  const response = await result.response;
  const groundingMeta = response.candidates?.[0]?.groundingMetadata;
  let groundingSources: Array<{ title: string; url: string }> | undefined;

  if (groundingMeta?.groundingChunks) {
    groundingSources = groundingMeta.groundingChunks
      .filter((c: Record<string, unknown>) => c.web)
      .map((c: { web: { uri: string; title: string } }) => ({
        url: c.web.uri,
        title: c.web.title,
      }));
  }

  return { groundingSources };
}

// ─── OpenAI-Compatible API Call (OpenAI, OpenRouter) ───
async function callOpenAICompatible(
  provider: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
): Promise<{ groundingSources?: Array<{ title: string; url: string }> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  };

  // OpenRouter requires extra headers
  if (provider.baseUrl.includes('openrouter')) {
    headers['HTTP-Referer'] = 'https://saas-factory.app';
    headers['X-Title'] = 'SaaS Factory';
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      max_tokens: 16000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${response.status}: ${errorBody}`);
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
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  return {};
}

/* ═══════════════════════════════════════ */
/*  Execute Agent with Auto-Fallback      */
/* ═══════════════════════════════════════ */

async function executeAgentWithFallback(
  agentId: string,
  idea: string,
  previousResults: Array<{ agentId: string; status: string; content: string }>,
  feedback: string | undefined,
  res: express.Response,
  maxRetries: number = 6,
) {
  const agentDef = AGENT_PROMPTS[agentId];
  if (!agentDef) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Agente não encontrado' })}\n\n`);
    res.end();
    return;
  }

  // Build context
  const context = (previousResults || [])
    .filter((r) => r.status === 'approved' && r.content)
    .map((r) => `### Resultado de ${r.agentId}:\n${r.content}`)
    .join('\n\n---\n\n');

  const userPrompt = agentDef.buildPrompt(idea, context, feedback);

  let attempts = 0;

  while (attempts < maxRetries) {
    const provider = providerManager.getBestProvider(agentDef.needsSearch);

    if (!provider) {
      res.write(`data: ${JSON.stringify({
        type: 'provider_event',
        event: {
          type: 'all_exhausted',
          message: '🚨 Todas as IAs estão com cota esgotada! Aguarde para tentar novamente.',
        },
      })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Todas as IAs estão indisponíveis. Aguarde o reset da cota ou adicione novas API keys nas configurações.' })}\n\n`);
      res.end();
      return;
    }

    // Inform frontend which provider is being used
    res.write(`data: ${JSON.stringify({
      type: 'provider_info',
      provider: {
        id: provider.id,
        name: provider.name,
        emoji: provider.emoji,
        tier: provider.tier,
        model: provider.model,
      },
    })}\n\n`);

    try {
      console.log(`[${agentId}] Usando: ${provider.name} (${provider.model})`);

      const result = await callAI(
        provider,
        agentDef.system,
        userPrompt,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        },
        (event) => {
          res.write(`data: ${JSON.stringify({ type: 'provider_event', event })}\n\n`);
        },
      );

      // Send grounding sources if available
      if (result.groundingSources && result.groundingSources.length > 0) {
        let sourcesText = '\n\n---\n\n### 🔗 Fontes Verificadas\n';
        result.groundingSources.forEach((s, i) => {
          sourcesText += `${i + 1}. [${s.title}](${s.url})\n`;
        });
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: sourcesText })}\n\n`);
      }

      // Success!
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return;

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`[${agentId}] Erro com ${provider.name}:`, errMsg);

      if (isQuotaError(error)) {
        const { event } = providerManager.markQuotaExceeded(provider.id);
        res.write(`data: ${JSON.stringify({ type: 'provider_event', event })}\n\n`);
        attempts++;
        continue; // Try next provider
      } else {
        // Non-quota error — mark provider and try next
        providerManager.markError(provider.id, errMsg);
        res.write(`data: ${JSON.stringify({
          type: 'provider_event',
          event: {
            type: 'provider_switch',
            providerId: provider.id,
            providerName: provider.name,
            message: `⚠️ Erro com ${provider.name}: ${errMsg.substring(0, 100)}. Tentando próxima IA...`,
          },
        })}\n\n`);
        attempts++;
        continue;
      }
    }
  }

  // All retries exhausted
  res.write(`data: ${JSON.stringify({ type: 'error', content: 'Não foi possível completar a tarefa após tentar todas as IAs disponíveis.' })}\n\n`);
  res.end();
}

/* ═══════════════════════════════════════ */
/*  API Routes                             */
/* ═══════════════════════════════════════ */

// Execute an agent
app.post('/api/agents/:agentId/execute', async (req, res) => {
  const { agentId } = req.params;
  const { idea, previousResults, feedback } = req.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  await executeAgentWithFallback(agentId, idea, previousResults, feedback, res);
});

// Continue mega-prompt (Leo)
app.post('/api/agents/leo/continue', async (req, res) => {
  const { idea, previousResults, partialPrompt } = req.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const context = (previousResults || [])
    .filter((r: { status: string; content: string }) => r.status === 'approved' && r.content)
    .map((r: { agentId: string; content: string }) => `### Resultado de ${r.agentId}:\n${r.content}`)
    .join('\n\n---\n\n');

  const continuePrompt = `Você estava compilando o mega-prompt para "${idea}" e parou. Aqui está o que já escreveu:\n\n${partialPrompt}\n\nCONTINUE de onde parou. Não repita. Continue detalhando.\n\nRESULTADOS:\n${context}`;

  const provider = providerManager.getBestProvider();
  if (!provider) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Nenhuma IA disponível.' })}\n\n`);
    res.end();
    return;
  }

  try {
    await callAI(
      provider,
      AGENT_PROMPTS.leo.system,
      continuePrompt,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      },
      () => {},
    );
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Erro';
    res.write(`data: ${JSON.stringify({ type: 'error', content: errMsg })}\n\n`);
    res.end();
  }
});

// Get provider hierarchy status
app.get('/api/providers', (_req, res) => {
  res.json({
    providers: providerManager.getStatus(),
    keys: {
      gemini: API_KEYS.gemini ? true : false,
      openai: API_KEYS.openai ? true : false,
      openrouter: API_KEYS.openrouter ? true : false,
    },
  });
});

// Update API keys
app.post('/api/settings/keys', (req, res) => {
  const { gemini, openai, openrouter } = req.body;
  if (gemini !== undefined) API_KEYS.gemini = gemini;
  if (openai !== undefined) API_KEYS.openai = openai;
  if (openrouter !== undefined) API_KEYS.openrouter = openrouter;
  providerManager.updateKeys(API_KEYS);
  res.json({ success: true, providers: providerManager.getStatus() });
});

// Reset all providers
app.post('/api/providers/reset', (_req, res) => {
  providerManager.resetAll();
  res.json({ success: true, providers: providerManager.getStatus() });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🏭 SaaS Factory Backend rodando em http://localhost:${PORT}`);
  console.log(`📋 Providers configurados:`);
  const status = providerManager.getStatus();
  status.forEach((p) => {
    console.log(`   ${p.emoji} [P${p.priority}] ${p.name} (${p.tier}) — ${p.status}`);
  });
  console.log('');
});
