# MEMÓRIA LONGA — Super Agentes V1.0

> **Propósito:** Banco de memória persistente com TUDO que aconteceu no projeto. Lido no início de cada sessão nova para restaurar contexto completo.
> **Última atualização:** 2026-03-13 00:30

---

## 1. Estado Atual do Projeto

**Fase:** Fase 4 COMPLETA ✅ → Próximo: Fase 5 (SaaS)
**Próximo passo:** Fase 5 (Landing + Checkout + Onboarding)
**Bloqueios:** Nenhum

### Progresso por Fase

| Fase | Status | Gate |
|------|--------|------|
| Fase 1: Backend | 100% ✅ | PASSED (21/21) 2026-03-12 |
| Fase 2: Agentes | 100% ✅ | PASSED (13/13) 2026-03-12 |
| Fase 2.5: Workshop PROFESSOR_IA | 0% | Adiada — será por último (após Fases 4→5→6) |
| Fase 3: Frontend | 100% ✅ | PASSED (6/6) 2026-03-12 |
| Deploy Railway | 100% ✅ | App rodando em produção 2026-03-13 |
| Visual Polish | 100% ✅ | Leon aprovou interface 2026-03-13 |
| Fase 4: Infra | 100% ✅ | PASSED (12/12) 2026-03-13 |
| Fase 5: SaaS | 0% | - |
| Fase 6: Deploy Final | 0% | - |

---

## 2. Decisões Técnicas Tomadas

| # | Decisão | Justificativa | Data |
|---|---------|--------------|------|
| 1 | Projeto novo na raiz (não evoluir teste6) | Leon decidiu: base limpa, mas aproveitando código | 2026-03-12 |
| 2 | Prefixo b2c_ nas tabelas | Isolamento no Supabase compartilhado | 2026-03-12 |
| 3 | VERBETTA com 2 T's | Padronização do nome correto da persona | 2026-03-12 |
| 4 | JWT para auth, PIN bcrypt para pai | Segurança adequada sem over-engineering | 2026-03-12 |
| 5 | Gemini em dev, Kimi K2.5 em prod | Leon definiu. LLM_PROVIDER no .env controla | 2026-03-12 |
| 6 | Port 3001 no server V1 | Evitar conflito com teste6 na 3000 | 2026-03-12 |
| 7 | SUPERVISOR_EDUCACIONAL via agente_override | Não passa pelo PSICO — é direto para pais | 2026-03-12 |
| 8 | Fase 2.5 Workshop PROFESSOR_IA | Leon quer criar esse prompt junto — momento colaborativo | 2026-03-12 |
| 9 | MCP 0150fe87 para Supabase (não mcp__supabase) | mcp__supabase vê projeto errado. MCP 0150fe87 vê ahopvaekwejpsxzzrvux | 2026-03-12 |
| 10 | buscarUltimosTurnos de 3→10 turnos | Melhora roteamento — router precisa saber de heróis já atendidos | 2026-03-12 |
| 11 | turnosParaContexto = slice(0,3) | Contexto LLM limitado a 3 turnos, mas router usa 10 para decisão | 2026-03-12 |
| 12 | Aluno dedicado para testes de router | Isolamento de estado entre suites de teste evita contaminação | 2026-03-12 |
| 13 | PSICOPEDAGOGICO = Voz do App (não persona) | Leon definiu: transições invisíveis, nunca revelar nomes de heróis | 2026-03-12 |
| 14 | seedRegressionAluno para regressão Gate 1 | Testes MODO PAI contaminam routerAlunoId — aluno separado para regressão | 2026-03-12 |
| 15 | Frontend light mode, overlay sidebar | Leon definiu: ChatGPT mobile como referência, nunca comprime conteúdo | 2026-03-12 |
| 16 | 4 variantes de imagem por herói | _buble (avatar circular), -card (corpo inteiro), -logo (nome+matéria), -limpo (só nome) | 2026-03-12 |
| 17 | Seletor perfil = modal overlay | Não é página inteira. Leon confirmou no brainstorm. | 2026-03-12 |
| 18 | 3 interfaces: fundamental, médio, pai | TODAS têm menu slide. Fundamental incluído (Leon confirmou). | 2026-03-12 |
| 19 | Frontend Vite 6 + React 18 | Stack leve, mobile-first, Tailwind CSS. Vite downgraded de 8→6 para Railway. | 2026-03-12 |
| 20 | Logos institucionais adicionados por Leon | Logo_SuperAgentesPenseAI.png (retangular) + SuperAgentesPenseAi_buble.png (circular amarelo) | 2026-03-12 |
| 21 | ALLOWED_ELEMENTS no markdown | Sanitização de segurança — react-markdown só renderiza tags seguras | 2026-03-12 |
| 22 | selectedFilhoId no AuthContext | Pai precisa rastrear qual filho está ativo para enviar mensagens corretas | 2026-03-12 |
| 23 | Downgrade Vite 8→6.3.5 para Railway | Railway usa Docker com Node 22.11, Vite 8 precisa 22.12+ e rolldown (nativo C). Vite 6 usa esbuild (JS puro). | 2026-03-13 |
| 24 | Escape Hatch Claude Code CLI | Quando Cowork VM não pode executar (git push, permissões), montar prompt para Leon rodar no Claude Code CLI | 2026-03-13 |
| 25 | Sistema de cores por perfil | Pai=azul (#2563EB), Filhos=paleta vibrante por índice (FILHO_COLORS). Cor propagada via AuthContext (filhoIndex + cor). | 2026-03-13 |
| 26 | Cards brancos no SlideMenu | Itens de menu em bg-white/90 rounded-xl sobre fundo colorido — alivia peso visual | 2026-03-13 |
| 27 | Professor IA só para médio + pai | Bug fix: antes era always:true. Fundamental não tem acesso ao Professor IA. | 2026-03-13 |
| 28 | Logo retangular no header (h-16) | logo-buble.png substituído por logo.png no header e menu. h-8→h-16 para legibilidade. | 2026-03-13 |
| 29 | Balão agente com cor do herói | ChatBubble: fundo `${corHeroi}15` (15% opacidade), borda `${corHeroi}40`. Balão user usa cor do perfil. | 2026-03-13 |
| 30 | PROFESSOR_IA por último | Leon decidiu: toda estrutura primeiro (Fases 4→5→6), workshop PROFESSOR_IA por último. | 2026-03-13 |
| 31 | Qdrant Cloud free tier | Não self-hosted no Railway. Free tier 1GB suficiente para V1. | 2026-03-13 |
| 32 | EMBEDDING_PROVIDER abstração | Gemini text-embedding-004 (768d) na V1. Kimi futuro. Se dimensão mudar, recriar collection. | 2026-03-13 |
| 33 | Device check inline (não middleware global) | JWT decode acontece dentro do handler, então device check é inline após JWT, não middleware Express separado. | 2026-03-13 |
| 34 | Reset diário automático (sem CRON meia-noite) | Primeiro request do dia cria registro em b2c_uso_diario. Sem midnight CRON. | 2026-03-13 |
| 35 | Estratégia comercial documentada | Planos mensal + anual com desconto. 3 dias de teste + garantia devolução. Gateway: Mercado Pago (Pix). | 2026-03-13 |

---

## 3. Arquitetura Fundamental (NUNCA MUDAR)

- **GESTOR é O agente.** Personas são figurinos.
- **Loop:** Mensagem → Contexto → Persona → Payload → LLM → Resposta SSE → Persistir
- **Cascata:** PSICO (sem stream, JSON) → Herói (stream SSE)
- **Router:** Keywords → LLM classifier (Gemini Flash, temp=0) → Fallback continuidade

---

## 4. Código Base (server/)

### Estrutura de Arquivos

```
server/
├── package.json
├── tsconfig.json
├── .env
├── src/
│   ├── index.ts          — Express + rotas registradas
│   ├── db/
│   │   ├── supabase.ts   — Cliente + 7 interfaces TypeScript
│   │   ├── persistence.ts — CRUD b2c_ (buscar, criar, atualizar sessões/turnos)
│   │   ├── auth-queries.ts — Login/PIN (bcrypt)
│   │   └── usage-queries.ts — Limite 25 interações / 5 turnos
│   ├── core/
│   │   ├── router.ts     — 9 keyword arrays → 8 personas + classificador LLM
│   │   ├── llm.ts        — Envelope GESTOR + chamarLLM + chamarLLMStream
│   │   ├── context.ts    — Montador contexto MODO PAI/FILHO
│   │   └── metrics.ts    — Tempo/tokens por chamada
│   ├── routes/
│   │   ├── auth.ts       — POST login (JWT) + select-profile (PIN)
│   │   └── message.ts    — POST /api/message SSE (8 heróis + auth + limites)
│   └── personas/         — 10 arquivos .md (prompts dos agentes)
└── tests/
    ├── gate1-backend.test.ts
    └── helpers/
        ├── api-client.ts
        └── seed-data.ts
```

### Dependências Principais (Server)

Express 4, Supabase JS 2, Google Generative AI, bcryptjs, jsonwebtoken, node-cron

### Frontend (web/)

```
web/
├── package.json, tsconfig.json, vite.config.ts, tailwind.config.js
├── index.html
├── public/
│   ├── logo.png (retangular), logo-buble.png (circular amarelo)
│   └── heroes/ (31 imagens: 8 heróis × 4 variantes - neuron sem logo)
└── src/
    ├── main.tsx, App.tsx
    ├── types.ts (HeroId, HeroMeta, ChatMessage, TipoUsuario, TipoInterface, PerfilAtivo, etc.)
    ├── constants.ts (HEROES metadata, INTERFACE_COLORS)
    ├── api/ (client.ts JWT wrapper, auth.ts login/selectProfile, chat.ts SSE stream)
    ├── contexts/ (AuthContext.tsx state+localStorage, ChatContext.tsx SSE streaming)
    ├── components/ (ProtectedRoute, ProfileModal, PinModal, EmptyState, ChatBubble,
    │               ChatMessages, ChatHeader, ChatInput, SlideMenu, StreamingCursor)
    ├── pages/ (LoginPage.tsx, ChatPage.tsx)
    └── __tests__/ (setup.ts, gate3-smoke.test.tsx — 6 tests)
```

### Dependências Principais (Frontend)

React 18, react-router-dom, react-markdown, lucide-react, Tailwind CSS, Vite 6.3.5 (downgraded de 8 para Railway)

### Banco de Dados (Supabase)

Projeto: ahopvaekwejpsxzzrvux.supabase.co
Tabelas b2c_ (9): familias, responsaveis, alunos, sessoes, turnos, turnos_backup, uso_diario, dispositivos_ativos, qdrant_refs

---

## 5. Cronologia de Execução

| Timestamp | Ação | Resultado |
|-----------|------|-----------|
| 2026-03-12 ~15:00 | Leitura de todos os documentos base | Entendimento completo |
| 2026-03-12 ~16:00 | Geração do PLANO_EXECUCAO_V1.md | Plano com 6 fases + gates |
| 2026-03-12 ~16:30 | GO do Leon (com garantia 90%) | Execução iniciada |
| 2026-03-12 ~17:00 | Tasks 1.1 + 1.2 + 1.6 (subagente) | ✅ Typecheck OK |
| 2026-03-12 ~17:30 | Task 1.3 (subagente) | ✅ Typecheck OK |
| 2026-03-12 ~18:00 | Perda de contexto (context window) | Sessão reiniciada |
| 2026-03-12 ~18:20 | Tasks 1.4 + 1.5 (subagente) | ✅ Typecheck OK |
| 2026-03-12 ~18:20 | Task 1.T (subagente) | ✅ Typecheck OK |
| 2026-03-12 ~18:30 | Sistema de memória implementado | Em progresso |
| 2026-03-12 ~19:00 | Perda de contexto (context window) | Sessão reiniciada — Boot Fase 2 |
| 2026-03-12 ~19:30 | Spec Fase 2 criada (design doc) | Leon revisou e aprovou com notas |
| 2026-03-12 ~20:00 | Tasks 2.1-2.3 executadas (subagentes) | 9 personas + llm.ts + message.ts editados |
| 2026-03-12 ~21:00 | Task 2.T (testes Gate 2) | 13 testes criados |
| 2026-03-12 ~22:00 | Gate 2 Round 1: 12/13 | Router português falhou |
| 2026-03-12 ~22:30 | Gate 2 Round 2: 12/13 | State contamination identificada |
| 2026-03-12 ~23:00 | Perda de contexto (context window) | Sessão reiniciada |
| 2026-03-12 ~23:30 | Gate 2 Round 3: 13/13 ✅ | seedRegressionAluno resolveu contaminação |
| 2026-03-12 ~23:45 | Brainstorm Fase 3 Frontend | 3 mockups (V1→V3), Leon aprovou direção |
| 2026-03-12 ~24:00 | Spec Fase 3 escrita | docs/superpowers/specs/2026-03-12-fase3-frontend-design.md |
| 2026-03-13 ~00:00 | Plano Fase 3 escrito e revisado | 5 chunks, 14 tasks, review encontrou 26 issues, corrigidos |
| 2026-03-13 ~00:10 | Tasks 1-4 (scaffold + types + API + contexts) | Subagentes executaram, typecheck OK |
| 2026-03-13 ~00:15 | Tasks 5-6 (login + profile + PIN) | Subagentes executaram, typecheck OK |
| 2026-03-13 ~00:20 | Tasks 7-8 (chat components) | Subagentes executaram, typecheck OK |
| 2026-03-13 ~00:25 | Task 9 (ChatPage assembly) | Subagente executou, typecheck OK |
| 2026-03-13 ~00:28 | Task 13 (Gate 3 tests) | 6/6 smoke tests passando (Vitest) |
| 2026-03-13 ~00:30 | Imagens institucionais integradas | Leon adicionou logos, substituíram placeholders "SA" |
| 2026-03-13 ~00:30 | Task 14 (Ralph Loop docs) | CHECKLIST + MEMORIA_CURTA + MEMORIA_LONGA atualizados |
| 2026-03-13 ~sessão2 | Deploy Railway — Round 1 falhou | Node 22.11 < 22.12 (Vite 8) + rolldown binding missing |
| 2026-03-13 ~sessão2 | Fix: Vite 8→6.3.5 | Removeu rolldown, funciona com Node 18+ |
| 2026-03-13 ~sessão2 | Deploy Railway — Round 2 | Build OK, mas env vars ausentes |
| 2026-03-13 ~sessão2 | Variáveis configuradas no Railway | App rodando em produção ✅ |
| 2026-03-13 ~sessão2 | Visual polish — Round 1 | Cores por perfil, cards brancos, logo retangular, fix Professor IA |
| 2026-03-13 ~sessão2 | Visual polish — Round 2 | ProfileModal cores casando + logo header dobrado (h-16) |
| 2026-03-13 ~sessão2 | Interface aprovada pelo Leon | "está incrível...perfeito" → seguir para próxima fase |
| 2026-03-13 ~sessão3 | Brainstorm + Spec Fase 4 | Design de CRON, Qdrant, Dispositivos, Limites. Leon aprovou. |
| 2026-03-13 ~sessão3 | Plano Fase 4 escrito | 12 tasks em 6 chunks. Review passou. |
| 2026-03-13 ~sessão3 | Fase 4 implementada | Bug fixes + Qdrant + CRON + Dispositivos + Frontend token. Subagent-driven. |
| 2026-03-13 ~sessão3 | Gate 4 PASSED | 12/12 testes passando ✅ |

---

## 6. Requisitos do Leon (Em Suas Palavras)

- "90% probabilidade de sucesso, 10% erros corrigíveis"
- "Go/No-Go gates — fases SOMENTE andam se teste funciona"
- "Use modo multiagente, enquanto você finaliza uma fase um subagente está codando o teste"
- "VERBETTA com dois T"
- "Workshop PROFESSOR_IA — momento específico de discussão e criação"
- "Sistema de memória com checklist, log de erros, slices com atualização"

---

## 7. O Que NÃO Fazer (Aprendido)

- NÃO reinventar a arquitetura — GESTOR + personas funciona
- NÃO criar abstrações desnecessárias
- NÃO inventar nomes de agentes
- NÃO reescrever prompts — adicionar seções
- NÃO deletar tabelas t6_ existentes
- NÃO usar `any` em TypeScript
- NÃO avançar fase sem Gate passar
