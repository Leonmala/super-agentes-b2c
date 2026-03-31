# MEMÓRIA LONGA — Super Agentes V1.0

> **Propósito:** Banco de memória persistente com TUDO que aconteceu no projeto. Lido no início de cada sessão nova para restaurar contexto completo.
> **Última atualização:** 2026-03-31

---

## 1. Estado Atual do Projeto

**Fase:** Polimento Pré-Venda — Implementação Professor Pense-AI + depois Super Prova
**Próximo passo:** writing-plans (spec em docs/PROFESSOR_PENSE_AI_SPEC.md) → 5 itens técnicos → Brainstorm Super Prova → spec → impl → Fase 5 SaaS
**Bloqueios:** Nenhum. PE1 + PE2 em produção.

### Progresso por Fase

| Fase | Status | Gate |
|------|--------|------|
| Fase 1: Backend | 100% ✅ | PASSED (21/21) 2026-03-12 |
| Fase 2: Agentes | 100% ✅ | PASSED (13/13) 2026-03-12 |
| Fase 2.5: Professor Pense-AI | 10% | Brainstorm concluído. Spec aprovada. Pronto para writing-plans + implementação. |
| Fase 3: Frontend | 100% ✅ | PASSED (6/6) 2026-03-12 |
| Deploy Railway | 100% ✅ | App rodando em produção 2026-03-13 |
| Visual Polish (round 1) | 100% ✅ | Leon aprovou interface 2026-03-13 |
| Visual Refactor V5 | 100% ✅ | 18 tasks + 6 rodadas ajustes finos 2026-03-15 |
| Fase 4: Infra | 100% ✅ | PASSED (12/12) 2026-03-13 |
| Gate 5 E2E: 8 Agentes | 100% ✅ | PASSED (14/14, média 9.3/10) 2026-03-13 |
| Hotfixes Produção | 100% ✅ | 4 bugs corrigidos (personas, JSON, cascata, turnos) 2026-03-13 |
| UX: Markdown + Typing | 100% ✅ | remark-gfm + useTypingEffect + CSS 2026-03-13 |
| Bloco G: Robustez + UX + Testes | 100% ✅ | useBubbleReveal, TypingDots, timeout, router async — 2026-03-17 |
| Bloco H: Disjuntores Arquiteturais | 100% ✅ | response-processor, fallback, sinais, migration — 2026-03-17 |
| PE1: Botão + Multimodal | 100% ✅ | compressão, preview, inlineData Google SDK, shimmer — 2026-03-18 |
| PE2: Router Fix | 100% ✅ | word boundary, stickiness guard, 306 testes — 2026-03-18 |
| PE3: Brainstorm Super Prova | 0% | Pendente — com Leon |
| Fase 2.5: PROFESSOR_IA | 0% | Pendente — prompt não existe, 4 itens de código |
| Fase 5: SaaS | 0% | Após PE3 + Fase 2.5 |
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
| 26 | Keyword override > PSICO heroi_escolhido | PSICO LLM pode alucinar hero errado; keywords são determinísticas e confiáveis. Override em message.ts | 2026-03-13 |
| 27 | Ordem de checagem historia > ciencias | "revolução" contém "evolução" como substring. Historia deve ser checada antes de ciencias no router | 2026-03-13 |
| 28 | Keywords math refinadas (sem "conta" genérico) | "conta" (aritmética) conflita com "me conta" (verbo narrar). Usar "fazer conta"/"conta de matematica" | 2026-03-13 |
| 29 | LLM-as-judge para E2E (Gemini avaliador) | Teste E2E avalia resposta em 4 dimensões (construtivismo, série, persona, qualidade), threshold ≥5/10 | 2026-03-13 |
| 30 | limparSessoesAluno() para isolamento de testes | Deletar sessions+turnos+uso_diario entre testes evita state pollution | 2026-03-13 |
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
| 36 | Build copia personas para dist/ | `tsc` não copia .md → build:server faz `tsc && cp -r src/personas dist/personas` | 2026-03-13 |
| 37 | Extração robusta de JSON do LLM | `extrairTextoDoJSON()` com 9 campos + `normalizarNomeHeroi()` fuzzy match. LLM é não-determinístico. | 2026-03-13 |
| 38 | Turno completo = troca de matéria | Não incrementar por mensagem. Turno só conta quando `temaDetectado !== sessao.tema_atual`. | 2026-03-13 |
| 39 | remark-gfm para markdown rico | Tabelas, strikethrough, etc. Sem isso, prompts especializados perdem diferenciação do ChatGPT. | 2026-03-13 |
| 40 | useTypingEffect hook | Revelação gradual: 3 chars/25ms, pausa 400ms entre parágrafos, flush 15 chars/25ms. Sensação "viva". | 2026-03-13 |
| 41 | Pivot: Polimento antes de Fase 5 | Leon decidiu NÃO iniciar Fase 5 (SaaS). Prioridade: polir produto até ficar vendável. 4 blocos: A(Bugs) B(UX) C(Prompts) D(Brainstorm). | 2026-03-14 |
| 42 | Buffer completo no stream (anti-JSON-leak) | `chamarLLMStream` acumula resposta inteira → extrai texto limpo → envia de uma vez. `useTypingEffect` cuida da animação. Elimina 100% de JSON leaking. | 2026-03-14 |
| 43 | Sistema de anti-keywords (blocklist) no router | Ideia do Leon: termos proibidos complementam ativadores. Se mensagem contém keyword + anti-keyword → match cancelado. Extensível. Primeiro uso: "trabalho" em física. | 2026-03-14 |
| 44 | Educação sexual (duas partes) | Leon definiu: (a) NEURON recebe linha simples para tratar cientificamente; (b) PSICO antevê tema por idade e orienta herói no plano. Demais heróis proibidos. | 2026-03-14 |
| 45 | Design visual como bloco próprio | Leon percebeu feedback externo "UI parece feita por IA". Quer polish com skill de design após bugs/UX. Usabilidade aprovada — só visual. | 2026-03-14 |
| 46 | Visual Refactor V5 (protótipo HTML) | Protótipo completo em `prototipo-visual-refactor.html` aprovado por Leon. 18 tasks de implementação. | 2026-03-14 |
| 47 | Plus Jakarta Sans como fonte padrão | Google Fonts, weights 400-800. Substitui fonte default do Tailwind. | 2026-03-14 |
| 48 | CSS Design Tokens (:root vars) | `--bg-base: #F5F7FB`, `--shadow-float`, `--radius-sm/md/lg`, etc. Em index.css. | 2026-03-14 |
| 49 | 8 gradientes únicos por herói | Extraídos das bg-chat images oficiais. CALCULUS=#1E3F6B, VERBETTA=#5C2D90, etc. | 2026-03-14 |
| 50 | Sheet-over-header pattern | Chat body com `rounded-t-[28px] -mt-6` sobrepõe o header. | 2026-03-14 |
| 51 | Glassmorphism padrão | `bg-white/12 backdrop-blur-[40px] border border-white/[0.18]`. Aplicado em login, PIN, menu, perfis. | 2026-03-14 |
| 52 | LogoPenseAI.png como logo correto | Cubo 3D "Pense AI!" — NÃO usar logo-penseai.png (era o logo institucional errado). Sem filtro brightness-0/invert. | 2026-03-15 |
| 53 | PIN dots verdes (emerald-400) | Feedback do Leon: branco não dá feedback visual suficiente. Verde = confirmação. | 2026-03-15 |
| 54 | Menu lateral w-[290px] com SVGs protótipo | Ícones: raio (Super Agentes), monitor (Professor IA), olho (Supervisor), user (Trocar), logout (Sair). Botões inferiores sem background. | 2026-03-15 |
| 55 | Login gradiente profundo | `from-[#1E40AF] via-[#1E3A8A] to-[#0F172A]` — azul profundo→navy escuro. Blobs com radial-gradient + blur(80px). | 2026-03-15 |
| 56 | Numpad PIN aspect-ratio 1.3 | Em vez de h fixo, usa aspect-ratio para teclas proporcionais em qualquer tela. Max-w 280px. | 2026-03-15 |
| 57 | useBubbleReveal hook (Bloco G) | Revelação balão por balão com tempo de leitura estimado. Remove useTypingEffect anterior. ChatContext+ChatMessages refatorados. | 2026-03-17 |
| 58 | response-processor pipeline 4 camadas (Bloco H) | JSON.parse → markdown strip → regex → texto puro. Sanitizador incondicional antes de enviar ao aluno. Elimina JSON leaks residuais. | 2026-03-17 |
| 59 | Fallback messages por persona | 10 personas + DEFAULT. Exibido quando LLM retorna vazio/erro. Evita tela em branco. | 2026-03-17 |
| 60 | Sinais pedagógicos persistidos | `b2c_turnos`: 3 novas colunas (sinal_aprendizado, sinal_dificuldade, sinal_emocional). SUPERVISOR lê para resumo semanal. | 2026-03-17 |
| 61 | Botão + multimodal (PE1) | `image-compress.ts` (700KB limit), thumbnail preview, inlineData Google SDK, shimmer overlay no ChatBubble durante análise. NUNCA usar image_url (OpenAI compat). | 2026-03-18 |
| 62 | Router word boundary ≤4 chars (PE2) | Helper `reWordBoundary()`. Keywords curtas (rio, pais, luz, mar…) só matcham como palavras inteiras. Threshold 4 chars. | 2026-03-18 |
| 63 | Stickiness guard em decidirPersona (PE2) | Troca de herói mid-sessão exige confirmação do LLM. Se LLM retorna 'indefinido' → mantém herói atual. NUNCA remover esta lógica. | 2026-03-18 |
| 64 | 306 testes de classificador (PE2) | `router-classificador.test.ts` — 21 describe blocks, seções A-G. Cobre substrings, falsos positivos semânticos, trocas explícitas. | 2026-03-18 |
| 65 | PROFESSOR_IA: prompt não existe + 4 fixes | (1) criar PROFESSOR_IA.md, (2) add em AGENTES_OVERRIDE_VALIDOS, (3) ChatInput passar agenteMenu como override, (4) instrucaoFormatoPorPersona. | 2026-03-31 |
| 66 | Brainstorm de features sempre com Leon | Nunca fazer brainstorm de feature sozinho. Super Prova e PROFESSOR_IA devem ser definidos com Leon antes de qualquer implementação. | 2026-03-31 |
| 67 | PROFESSOR_IA renomeado para Professor Pense-AI | Identidade: espírito PENSE-AI, sem máscara/herói. Tom caloroso, provocador, construtivista. Spec: docs/PROFESSOR_PENSE_AI_SPEC.md. | 2026-03-31 |
| 68 | PROFESSOR_IA: independente do cascade | Não passa por PSICOPEDAGOGICO. Direto via agente_override. Acesso: EM + Pai. Abertura: "Olá, o que vamos fazer hoje? Te ajudo com um prompt ou quer bater um papo sobre IA?" | 2026-03-31 |
| 69 | PROFESSOR_IA: dois modos de conversa | Modo Prompt (melhoria construtivista + fechamento progressão "2/10→10/10") e Modo Conversa Livre (AI dictionary, ferramentas, LLMs, plataformas). | 2026-03-31 |
| 70 | PROFESSOR_IA: adaptação por tipo_usuario | MODO FILHO (EM): mais curto, direto, exemplos adolescentes. MODO PAI: mais calmo, mais escuta, exemplos adultos. Mesmos objetivos, condução diferente. | 2026-03-31 |
| 71 | PROFESSOR_IA: Qdrant memória longa (NOVO) | Dois novos namespaces Qdrant: professor_ia_{aluno_id} (aluno) e professor_ia_pai_{aluno_id} (pai). CRON domingo 23h inclui esses dois novos passos. 5º item técnico. | 2026-03-31 |
| 72 | PROFESSOR_IA: namespace pai associável ao SUPERVISOR | professor_ia_pai_{aluno_id} pode informar o SUPERVISOR_EDUCACIONAL no futuro. Pai que entende IA pode ser orientado diferente. Cross-pollination intencionada. | 2026-03-31 |

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

React 19, react-router-dom, react-markdown, lucide-react, Tailwind 4, Vite 6.3.5 (downgraded de 8 para Railway), Plus Jakarta Sans (Google Fonts)

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
| 2026-03-13 ~sessão4 | Gate 5 E2E PASSED | 14/14 testes, média 9.3/10. Bugs de keywords corrigidos. |
| 2026-03-13 ~sessão4 | UX: Markdown rico + Typing effect | remark-gfm, CSS chat-bubble-content, useTypingEffect hook |
| 2026-03-13 ~sessão5 | Usuário real criado no Supabase | Leon + Layla (12a, 7ª) + Maria Paz (7a, 3ª). Plano familiar. |
| 2026-03-13 ~sessão5 | HF1: Personas não encontradas em prod | Build agora copia personas para dist/ |
| 2026-03-13 ~sessão5 | HF2: JSON bruto na tela | extrairTextoDoJSON() com 9 campos possíveis |
| 2026-03-13 ~sessão5 | HF3: Cascata PSICO→Herói falha | Extração robusta herói + normalizarNomeHeroi() fuzzy match |
| 2026-03-13 ~sessão5 | HF4: Limite 5 turnos = 5 msgs | Turno só incrementa em troca de matéria |
| 2026-03-13 ~sessão5 | App testada em produção | Leon e filhas testaram no celular. Funcionando. |
| 2026-03-14 ~sessão6 | Pivot: polimento antes Fase 5 | Leon analisou teste Layla e decidiu polir antes de vender |
| 2026-03-14 ~sessão6 | Bloco A: Fix JSON stream | Buffer completo + extrairJSONouTexto no final |
| 2026-03-14 ~sessão6 | Bloco A: Sistema anti-keywords | Blocklist por tema no router (ideia Leon). 13 anti-keywords para física. |
| 2026-03-14 ~sessão6 | Bloco A: Logo herói h-12→h-16 | Igualar altura do buble no header |
| 2026-03-14 ~sessão6 | Bloco B: UX de chat | Sentence-per-bubble, typing lento, nome no menu, EmptyState dinâmico |
| 2026-03-14 ~sessão7 | Bloco C: NEURON sex ed | Seção "EDUCAÇÃO SEXUAL — ABORDAGEM CIENTÍFICA" no bloco SEGURANÇA |
| 2026-03-14 ~sessão7 | Bloco C: PSICO antecipação | Seção com regras por série (7º+, 6º-, risco) no plano pedagógico |
| 2026-03-14 ~sessão7 | Bloco C: Proibição outros heróis | Instrução condicional em construirEnvelopeGestor() para todos exceto NEURON/PSICO/SUPERVISOR |
| 2026-03-14 ~sessão8 | Visual Refactor V5 — Protótipo HTML | Protótipo completo com Plus Jakarta Sans, glassmorphism, 8 gradientes, sheet pattern |
| 2026-03-14 ~sessão8 | Visual Refactor V5 — 18 tasks implementadas | Subagent-driven, 5 chunks, todos os componentes reescritos |
| 2026-03-15 ~sessão9 | Ajuste 1: PIN numpad proporcional | aspect-ratio 1.3, container 280px, ícone backspace correto |
| 2026-03-15 ~sessão9 | Ajuste 2: Logo Pense-AI correto | LogoPenseAI.png (cubo 3D), sem filtro mono, h-10 em todas as telas |
| 2026-03-15 ~sessão9 | Ajuste 3: Ícone responsável escudo→cadeado | ProfileModal SVG shield→lock |
| 2026-03-15 ~sessão9 | Ajuste 4: PIN dots verdes | bg-emerald-400 + glow verde ao preencher |
| 2026-03-15 ~sessão9 | Ajuste 5: Login profundo | Gradiente escuro, blobs sutis, botão azul composição, título "Entrar" no card |
| 2026-03-15 ~sessão9 | Ajuste 6: Menu lateral protótipo completo | 290px, SVGs corretos, botões limpos, X branco, logo z-10 |

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

---

## Sessão 10 — 2026-03-17: Bloco G — Robustez + UX + Testes em Produção

### Decisões (#57-65)

- **#57** Router bug root cause: linhas 294-299 retornavam agente anterior quando keywords falhavam. Corrigido com decidirPersona async de 5 caminhos
- **#58** Session timeout: 15min inatividade OU nova_sessao flag → reset agente_atual/tema_atual
- **#59** Classificador LLM leve (classificarTema): Gemini Flash, temp=0, 10 tokens max, 500ms timeout com Promise.race. Substitui classificarTemaInteligente (que era 1500+ tokens)
- **#60** UX de texto: useTypingEffect (caractere por caractere) substituído por useBubbleReveal (balão por balão com tempo de leitura)
- **#61** TypingDots: 3 pontinhos animados com CSS bounce (substitui StreamingCursor cursor piscante)
- **#62** pendingReveal pattern: ChatContext seta pendingReveal, ChatMessages controla revelação via useBubbleReveal, quando termina adiciona ao histórico
- **#63** MCP Bridge auth: JWT + PIN do responsável via header X-Pin (pois JWT de login NÃO inclui tipo_usuario)
- **#64** API_URL configurável: process.env.API_URL || localhost:3001 no TestClient
- **#65** QA como processo Pense-AI: Leon definiu que no futuro testes nascem desde o momento 1 do app

### Cronologia

1. Leon reportou 4 problemas sistêmicos: (A) router travado em CALCULUS, (B) text dumping UX, (C) testar produção, (D) processo disciplinado
2. Brainstorming completo (one-question-at-a-time) → spec aprovada
3. Plano de implementação com 10 tasks em 3 chunks
4. Implementação: Tasks 1-2 sequenciais (backend), Tasks 4-5+7+8 em paralelo (3 subagentes), Task 6 manual (complexa)
5. Typecheck server + frontend: ambos 0 errors
6. Build do Vite falha por permissão do mount (não é bug nosso — funciona no Railway)
7. Git commit falha por .git/index.lock (permissão mount) — Leon faz push via Claude Code CLI

### Arquivos Criados/Modificados

**Criados:**
- `web/src/components/TypingDots.tsx`
- `web/src/hooks/useBubbleReveal.ts`
- `server/src/routes/mcp.ts`

**Modificados:**
- `server/src/core/router.ts` (decidirPersona async + classificarTema + SESSION_TIMEOUT_MS)
- `server/src/routes/message.ts` (nova_sessao + atualizarUltimoTurno + router async)
- `server/src/db/persistence.ts` (atualizarUltimoTurno + resetarSessaoAgente)
- `server/src/db/supabase.ts` (Sessao.ultimo_turno_at)
- `server/src/index.ts` (registro rota MCP)
- `server/tests/helpers/api-client.ts` (API_URL configurável)
- `server/package.json` (scripts test:prod, gate:6)
- `web/src/contexts/ChatContext.tsx` (pendingReveal, remove useTypingEffect)
- `web/src/components/ChatMessages.tsx` (useBubbleReveal + TypingDots)
- `web/src/components/ChatBubble.tsx` (export splitSentences, singleBubble)
- `web/src/api/chat.ts` (novaSessao no body)

**Para deletar (Leon via CLI):**
- `web/src/hooks/useTypingEffect.ts`
- `web/src/components/StreamingCursor.tsx`

---

### Bloco H — Disjuntores Arquiteturais (2026-03-17)

**Motivação:** 3 bugs graves de protocolo JSON onde respostas LLM malformadas vazavam para o aluno:
- Bug #37: PSICO JSON truncado por maxOutputTokens → cascata morria → JSON raw enviado ao aluno
- Bug #38: Herói JSON com aspas malformadas → JSON.parse falha → JSON raw exposto
- Bug #39: Backend ignorava sinal_psicopedagogico, motivo_sinal, observacoes_internas dos heróis

**Decisão arquitetural:** Approach B — pipeline dedicado (response-processor.ts). Todas as respostas LLM passam por um processador central antes de chegar a qualquer destino. Leon escolheu isso sobre Approach A (patches cirúrgicos nos arquivos existentes).

**Para sinais pedagógicos:** Opção A — persistir no banco + expor no SUPERVISOR (sem notificação imediata ao pai). Leon aprovou.

**5 Disjuntores instalados:**
1. **D1 — Extração robusta:** Pipeline de 4 camadas (JSON.parse → markdown block → regex fallback → texto puro). Nunca mais JSON.parse falha silenciosamente.
2. **D2 — Sanitizador incondicional:** SEMPRE roda antes de enviar texto ao aluno. Remove blocos JSON, campos soltos, chaves órfãs, code blocks. Se não sobrar nada útil, usa fallback amigável da persona.
3. **D3 — Cascata resiliente:** PSICO cascata usa `processed.cascata` tipada em vez de acessar jsonData raw. Fallback para jsonOriginal quando pipeline parcial.
4. **D4 — Pipeline de sinais:** Herói → persistência → Supabase. Sinais ficam em b2c_turnos. SUPERVISOR pode buscar via `buscarSinaisAluno()`.
5. **D5 — maxOutputTokens:** PSICO 3000→8000, heróis 3000→4000. Elimina truncamento.

**Arquivos criados/modificados:**
- `server/src/core/response-processor.ts` (NOVO — ~300 linhas)
- `server/tests/response-processor.test.ts` (NOVO — 9 testes)
- `server/src/core/llm.ts` (MODIFICADO — processador, interfaces, maxOutputTokens)
- `server/src/routes/message.ts` (MODIFICADO — cascata via processed, sinais)
- `server/src/db/supabase.ts` (MODIFICADO — 3 campos Turno)
- `server/src/db/persistence.ts` (MODIFICADO — sinais + buscarSinaisAluno)

**Migration Supabase:** 3 colunas + índice parcial em b2c_turnos

**Incidente anterior:** Na primeira implementação (mesma data), todos os commits ficaram em /tmp/git-temp (workaround para lock files do git no mount). Quando a VM resetou, tudo foi perdido. Reimplementado direto no mount sem workarounds temporários.

**Validação em produção (Gate Bloco H — 2026-03-17):**
- 16/16 testes E2E: 8 heróis × MODO FILHO + 8 heróis × MODO PAI
- ZERO JSON leaks em todas as 16 respostas (10 padrões regex verificados)
- Todos os 16 turnos persistidos no Supabase (confirmado via SQL direto nas tabelas)
- Nenhum herói ativou `sinal_psicopedagogico = true` nos testes (pipeline de sinais validado apenas em unitários)
- Tempos: 7-20s (aceitável)
- Scripts: `gate-bloco-h-prod.test.ts`, `gate-h-batch2.ts`, `gate-h-batch3.ts`, `gate-h-batch4.ts`

**Limitações conhecidas dos testes (transparência):**
- JSON malformado não foi provocado em produção — testado em unitários (T4, T5, T7, T8)
- Qualidade pedagógica avaliada visualmente, sem LLM-as-judge
- Pipeline de sinais (D4) não exercitado em produção — LLM não gerou sinal verdadeiro

**Incidente das imagens (mesmo dia):**
- Leon atualizou logos na pasta `Imagens/` mas o frontend serve de `web/public/` com nomes diferentes
- Fix: copiar de `Imagens/` para `web/public/` com nomes corretos
- Lição: SEMPRE copiar `Imagens/` → `web/public/` ao atualizar (nomes divergem)

**Commits:**
- `92d492e` feat(bloco-h): pipeline de disjuntores
- `76511a2` chore: force redeploy
- `64d0d0f` fix: atualizar logos
