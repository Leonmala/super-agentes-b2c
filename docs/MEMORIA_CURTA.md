# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-04-04 — Super Prova implementação completa (Fase A + B + C) ✅. TypeScript 0 erros. Aguardando git push via Escape Hatch + E2E Gate SP7.

---

## Estado Imediato

**Fase atual:** Super Prova — Fases A, B, C implementadas ✅ → Pendente: git push + E2E (SP7) → Fase 5 SaaS
**Status:** Todo o código está nos arquivos. TypeScript frontend e backend: 0 erros. Commits Fase B e C não puderam ser feitos no VM (git lock no mount). Precisa do Escape Hatch.
**URL Railway:** `https://independent-eagerness-production-7da9.up.railway.app`
**Próximo (INÍCIO DA PRÓXIMA SESSÃO):** 1) Escape Hatch git push (Fases A+B+C) 2) Validar deploy Railway 3) E2E Gate SP7 (Layla → TEMPUS → CONSULTAR → QUIZ) 4) Fase 5 SaaS

---

## Último Slice Completado

**Slice:** Super Prova — Implementação completa (2026-04-04) ✅

### Fase A — Prompts dos Heróis

**O que foi feito:**
- 16 arquivos atualizados (8x `Prompts/` + 8x `server/src/personas/`)
- Seção AGENTE_BIBLIOTECARIO removida de todos os heróis (era artefato do n8n legacy)
- Nova seção `## 🧠 SUPER PROVA — BASE DE CONHECIMENTO` adicionada em todos
- Sinais: `sinal_super_prova: "CONSULTAR"` | `"QUIZ"` + `super_prova_query`
- Kit de Blocos VERBETTA criado do zero (10 blocos — era único herói sem kit)
- `server/src/core/llm.ts`: campos `sinal_super_prova` + `super_prova_query` em todos os 8 heróis (null default)
- **Commit:** `cea2974` ✅ (único commit que não teve lock — foi o primeiro)

### Fase B — Backend server/src/super-prova/

**O que foi feito (código nos arquivos, commit pendente):**
- `fontes-por-materia.ts` — 8 matérias, fontes pedagógicas curadas (Khan Academy, Wikipedia PT, Cambridge Dict)
- `hero-blocks-config.ts` — HeroBlockDefinition, 5-6 blocos por herói, getHeroBlocks()
- `gerar-acervo.ts` — Gemini Google Search Grounding com GOOGLE_API_KEY (NÃO GEMINI_API_KEY)
  - `@ts-ignore` em `tools: [{ googleSearch: {} }]`
  - Logs: 🔄 Gerando acervo / 🔍 Buscas realizadas / ✅ Gemini respondeu em Xms / 📦 Blocos
- `consultar.ts` — query pontual com grounding, logs: 🔎 Sinal CONSULTAR / ✅ Xms / 📨 Resultado
- `gerar-quiz.ts` — 4 questões progressivas, sem grounding, logs: 🎯 Sinal QUIZ / ✅ Xms / 🃏 N questões
- `index.ts` — orquestrador completo com trail de debug:
  - `normalizarTema()`, `obterOuGerarAcervo()` (cache PGRST116=miss), `formatarKnowledgeBase()`, `processarConsulta()`, `processarQuiz()`
  - Logs: 📥 Verificando cache / ✅ Cache HIT / 🔄 Cache MISS / 💾 Acervo salvo / 📤 KB formatada
- `server/src/db/persistence.ts` — 5 novas funções adicionadas ao final:
  - `persistirKnowledgeBase()`, `buscarKnowledgeBase()`, `persistirConsultaResultado()`, `buscarConsultaResultado()`, `limparConsultaResultado()`
- `server/src/routes/message.ts` — 3 hooks integrados (CASO A + CASO B):
  - Hook 1: fire-and-forget acervo pós-cascata (new tema detected)
  - KB injection: `super_prova_kb` + `super_prova_consulta_resultado` antes do payload herói
  - Hook 2: fire-and-forget CONSULTAR → persistirConsultaResultado (one-shot)
  - Hook 3: QUIZ → SSE `event: quiz` → QuizCard

### Fase C — Frontend QuizCard

**O que foi feito (código nos arquivos, commit pendente):**
- `web/src/components/QuizCard.tsx` — modal overlay z-50, progress bar, cor feedback (emerald/red/blue), tela resultado com emoji
- `web/src/api/chat.ts` — `onQuiz?: (quiz: QuizGerado) => void` + `case 'quiz':` no switch SSE
- `web/src/contexts/ChatContext.tsx` — `quizAtivo: QuizGerado | null` + `fecharQuiz` callback
- `web/src/pages/ChatPage.tsx` — `{quizAtivo && <QuizCard quiz={quizAtivo} onFechar={fecharQuiz} />}`
- **TypeScript frontend: 0 erros** ✅ (confirmado com `cd web && npx tsc --noEmit`)

### Migration Supabase (aplicada via MCP — projeto 0150fe87)

```sql
CREATE TABLE b2c_super_prova_acervo (
  serie, tema_hash, tema_label, materia, heroi_id, blocos jsonb, fontes jsonb,
  UNIQUE(serie, tema_hash, materia, heroi_id)
);
ALTER TABLE b2c_sessoes ADD COLUMN super_prova_kb text, super_prova_consulta_resultado text;
```

---

## Estado do Produto (local — aguardando push)

| Bloco | Status | Detalhes |
|-------|--------|---------|
| Fases 1-4 (backend, agentes, frontend, infra) | ✅ 100% | Todos os gates passando |
| PROFESSOR_IA | ✅ Em produção | Google Search grounding ativo |
| SUPERVISOR qualidade | ✅ Em produção | Fixes 1-6 aplicados |
| Super Prova — código | ✅ Implementado | Fases A+B+C completas, TypeScript OK |
| Super Prova — deploy | ⏳ Aguardando | Escape Hatch → git push → Railway |
| Super Prova — E2E SP7 | ⏳ Aguardando | Após deploy |
| Fase 5 SaaS | ❌ | Após SP7 Gate passar |

---

## Arquivos modificados (aguardando git push — Fases B e C)

**NOVOS (Fase B):**
- `server/src/super-prova/fontes-por-materia.ts`
- `server/src/super-prova/hero-blocks-config.ts`
- `server/src/super-prova/gerar-acervo.ts`
- `server/src/super-prova/consultar.ts`
- `server/src/super-prova/gerar-quiz.ts`
- `server/src/super-prova/index.ts`

**MODIFICADOS (Fase B):**
- `server/src/db/persistence.ts` — 5 funções Super Prova adicionadas ao final
- `server/src/routes/message.ts` — 3 hooks + KB injection (CASO A + B)
- `server/src/core/llm.ts` — campos sinal_super_prova em todos os 8 heróis

**NOVOS (Fase C):**
- `web/src/components/QuizCard.tsx`

**MODIFICADOS (Fase C):**
- `web/src/api/chat.ts` — onQuiz + case 'quiz'
- `web/src/contexts/ChatContext.tsx` — quizAtivo state
- `web/src/pages/ChatPage.tsx` — render QuizCard

**JÁ COMMITADOS (Fase A — commit cea2974):**
- `Prompts/*.md` (8 arquivos) — AGENTE_BIBLIOTECARIO removido, SUPER_PROVA adicionado
- `server/src/personas/*.md` (8 arquivos) — idem

---

## Próximo Passo Exato — BOOT DE AMANHÃ

**1. Escape Hatch git push:**
```
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add server/src/super-prova/ server/src/db/persistence.ts server/src/routes/message.ts server/src/core/llm.ts web/src/components/QuizCard.tsx web/src/api/chat.ts web/src/contexts/ChatContext.tsx web/src/pages/ChatPage.tsx
git commit -m "feat: Super Prova — Gemini grounding + blocos didáticos + QuizCard

- Módulo server/src/super-prova/ (fontes, gerar-acervo, consultar, gerar-quiz, index)
- Gemini Google Search Grounding para acervo enriquecido por matéria
- Cache em b2c_super_prova_acervo (serie+tema_hash+materia+heroi_id)
- 3 hooks em message.ts (background acervo, CONSULTAR one-shot, QUIZ SSE)
- QuizCard frontend com 4 questões progressivas + tela resultado
- Trail de debug logs completo no fluxo Super Prova"
git push origin main
```

**2.** Aguardar deploy Railway + verificar logs no Railway dashboard

**3.** E2E Gate SP7:
- Login Layla (7ª série) → perguntar sobre Segunda Guerra Mundial
- Verificar logs: `[SuperProva] 🔄 Hook 1 ativado` + `💾 Acervo salvo`
- TEMPUS responde → verificar `KNOWLEDGE_BASE` no contexto
- Na pergunta seguinte específica → TEMPUS emite CONSULTAR
- Turno seguinte → `📨 Injetando CONSULTA_RESULTADO`
- Após confirmação → QUIZ → QuizCard aparece no frontend
- Completar 4 questões → ver tela resultado

**4.** Fase 5 SaaS (Landing + Checkout + Onboarding)

---

## Contexto Crítico Para Boot

- Supabase: `ahopvaekwejpsxzzrvux.supabase.co` — MCP correto: `mcp__0150fe87` (não `mcp__supabase`)
- **GOOGLE_API_KEY** (não GEMINI_API_KEY!) — para Gemini grounding no servidor
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6 + React 18 + Tailwind CSS + Plus Jakarta Sans
- Testes: Gate 1-5 ✅, Gate Bloco H 16/16 ✅, unitários 9/9 ✅, classificador 306/306 ✅, TypeScript 0 erros ✅
- Deploy: Railway ATIVO ✅
- Repo GitHub: `https://github.com/Leonmala/super-agentes-b2c`
- Família teste: `leon@pense-ai.com` / PIN 3282 (Layla 7ª, Maria Paz 3ª)
- **LLM SDK:** `@google/generative-ai` NATIVO (não OpenAI-compat)
- **Router (CRÍTICO):** Keywords ≤4 chars usam word boundary. Stickiness guard em decidirPersona — NUNCA remover.
- **agente_override (CRÍTICO):** Só agentes em `AGENTES_OVERRIDE_VALIDOS` são aceitos.
- **Escape Hatch:** Para git push/permissões — montar prompt para Leon rodar no Claude Code CLI local.
- **b2c_qdrant_refs:** Colunas reais: id, aluno_id, namespace, semana_ref, ponto_ids, resumo_semantico, created_at, responsavel_id. NÃO tem coluna `tipo`.
- **Git lock no VM mount:** `.git/HEAD.lock` no filesystem mount do Windows não pode ser removido pelo VM. Sempre usar Escape Hatch para git.

---

## O que NÃO fazer

- ❌ NÃO usar Paperclip (agentes autônomos) — experiência negativa, sem controle
- ❌ NÃO criar envelope separado para SUPERVISOR — usar o mesmo GESTOR dos heróis
- ❌ NÃO misturar instruções dentro do contexto — contexto = dados, instruções = persona prompt
- ❌ NÃO iniciar Fase 5 SaaS antes de SP7 Gate passar
- ❌ NÃO fazer brainstorm de features sozinho — sempre com Leon
- ❌ NÃO usar GEMINI_API_KEY para o Gemini SDK no servidor — é GOOGLE_API_KEY
