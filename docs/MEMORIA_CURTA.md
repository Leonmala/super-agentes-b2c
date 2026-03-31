# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-31 — PROFESSOR_IA com Google Search grounding (Gemini nativo). Aguardando push + deploy Railway.

---

## Estado Imediato

**Fase atual:** Polimento Pré-Venda — Professor Pense-AI ✅ IMPLEMENTADO (aguardando push) → Super Prova → Fase 5 SaaS
**Status:** Implementação completa. TypeScript 0 erros (server + web). 6/6 testes unitários passando. Escape Hatch montado para Leon fazer push.
**URL Railway:** `https://independent-eagerness-production-7da9.up.railway.app`
**Próximo:** Leon roda Escape Hatch (push) → deploy Railway → teste manual 3 cenários → brainstorm Super Prova

---

## Último Slice Completado

**Slice:** Professor Pense-AI (2026-03-31) ✅ implementado, aguardando push
- Migration Supabase: `b2c_qdrant_refs.responsavel_id` adicionada ✅
- `server/src/personas/PROFESSOR_IA.md` — 203 linhas, prompt completo ✅
- `message.ts`: PROFESSOR_IA em AGENTES_OVERRIDE_VALIDOS + injeção contexto Qdrant ✅
- `llm.ts`: instrução formato plain-text PROFESSOR_IA ✅
- `ChatInput.tsx`: agenteMenu passado como override ✅
- `qdrant.ts`: `buscarContextoProfessorIA` + `salvarEmbeddingSemanal` com `tipo` ✅
- `cron.ts`: `processarProfessorIATurnos` + `gerarResumoProfessorIA` + responsavel_id ✅
- Testes: `cron-professor-ia.test.ts` 6/6 passando ✅

---

## Estado do Produto em Produção

| Bloco | Status | Detalhes |
|-------|--------|---------|
| Fases 1-4 (backend, agentes, frontend, infra) | ✅ 100% | Todos os gates passando |
| Visual Refactor V5 (Bloco D) | ✅ | Plus Jakarta Sans, glassmorphism, design tokens, gradientes heróis |
| Robustez + UX (Bloco G) | ✅ | useBubbleReveal, TypingDots, timeout 15min, router async |
| Disjuntores Arquiteturais (Bloco H) | ✅ | response-processor 4 camadas, fallback messages, sinais persistidos |
| Botão + multimodal (PE1) | ✅ | Compressão, preview, análise de imagem, shimmer — 2026-03-18 |
| Router fix (PE2) | ✅ | word boundary ≤4 chars, stickiness guard, 306 testes — 2026-03-18 |
| PROFESSOR_IA | ✅ IMPLEMENTADO | Aguardando push + deploy |
| Super Prova | ❌ | Brainstorm pendente |

---

## PROFESSOR_IA — IMPLEMENTADO ✅

Todos os 5 itens técnicos + Chunk 0 (DB) concluídos:
1. ✅ `server/src/personas/PROFESSOR_IA.md` — 203 linhas, prompt completo com metodologia PENSE-AI
2. ✅ `AGENTES_OVERRIDE_VALIDOS` inclui `PROFESSOR_IA`
3. ✅ `ChatInput.tsx` passa `agenteMenu.toUpperCase()` como override
4. ✅ `instrucaoFormatoPorPersona['PROFESSOR_IA']` — plain-text, sem JSON
5. ✅ CRON processa turnos PROFESSOR_IA → Qdrant com responsavel_id para pais
- ✅ BÔNUS: `buscarContextoProfessorIA` injetado em message.ts (memory loop fechado)
- ✅ BÔNUS: Migration `b2c_qdrant_refs.responsavel_id` aplicada no Supabase
- ✅ Google Search grounding: `tools: [{ googleSearch: {} }]` em `chamarLLMStream` para PROFESSOR_IA + SSE `search` event + guardrail no prompt

**Spec:** `docs/PROFESSOR_PENSE_AI_SPEC.md`

---

## Próximo Passo Exato

**Próximo imediato:** Leon roda Escape Hatch → push → Railway deploy → teste manual 3 cenários

Ordem de execução:
1. ✅ Brainstorm PROFESSOR_IA com Leon → spec aprovada
2. ✅ writing-plans → plano detalhado de implementação
3. ✅ Executar todos os itens técnicos (prompt + fixes + CRON + Qdrant + DB)
4. ⏳ Push para GitHub (Escape Hatch) → deploy Railway
5. ⏳ Teste manual 3 cenários (aluno Modo Prompt / Modo Conversa / pai)
6. ⏳ Brainstorm Super Prova com Leon → spec → implementação
7. ⏳ Fase 5 SaaS (Landing + Checkout + Onboarding)

---

## Contexto Crítico Para Boot

- Supabase: `ahopvaekwejpsxzzrvux.supabase.co` — MCP correto: `mcp__0150fe87` (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6 + React 18 + Tailwind CSS + Plus Jakarta Sans
- Testes: Gate 1-5 ✅, Gate Bloco H 16/16 ✅, unitários 9/9 ✅, classificador 306/306 ✅, TypeScript 0 erros ✅
- Deploy: Railway ATIVO ✅ — PE1 + PE2 em produção
- Repo GitHub: `https://github.com/Leonmala/super-agentes-b2c`
- Família teste: `leon@pense-ai.com` / PIN 3282 (Layla 7ª, Maria Paz 3ª)
- **Imagens:** Originais em `Imagens/`, servidas de `web/public/` com nomes diferentes. SEMPRE copiar ao atualizar.
- **LLM SDK:** `@google/generative-ai` NATIVO (não OpenAI-compat). Multimodal = `inlineData`, não `image_url`.
- **Router (CRÍTICO):** Keywords ≤4 chars usam word boundary. Stickiness guard em decidirPersona — NUNCA remover. NUNCA adicionar preposições ou palavras genéricas a keywords de matéria.
- **Persona loading:** `carregarPersona(nome)` lê `server/src/personas/${nome}.md` — arquivo deve existir ou lança erro.
- **agente_override (CRÍTICO):** Só agentes em `AGENTES_OVERRIDE_VALIDOS` são aceitos. PROFESSOR_IA agora está na lista ✅.
- **Escape Hatch:** Para git push/permissões — montar prompt para Leon rodar no Claude Code CLI local.

---

## O que NÃO fazer

- ❌ NÃO usar Paperclip (agentes autônomos) — experiência negativa, sem controle, sem visibilidade
- ❌ NÃO iniciar Fase 5 SaaS antes de PROFESSOR_IA e Super Prova estarem prontos
- ❌ NÃO fazer brainstorm de features sozinho — sempre com Leon
