# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-04-04 — QA Round 2 concluído ✅. Análise Supabase (34 turnos) + inspeção de código. 1 novo bug (BUG-57: stickiness), 3 gaps (timing, imagem proativa, MODO PAI filha). Super Prova ativa: 9 acervos gerados. BUG-55+56 fixes confirmados no código local, push ainda pendente.

---

## Estado Imediato

**Fase atual:** QA Round 2 CONCLUÍDO → Aguardando push de 2 fixes (BUG-55+56) → Fase 5 SaaS

## Achados QA Round 2 (2026-04-04) — Análise Supabase + Código

### Timing
- Sem `tempo_resposta_ms` no banco → latência não mensurável diretamente
- Diffs entre turnos (inclui leitura + digitação usuário): continuidade 39-73s, cascata 67-134s
- **GAP-01:** Adicionar `tempo_resposta_ms` a `b2c_turnos` + instrumentar `message.ts`

### Regressão (BUG-55 e BUG-56)
- Ambos os fixes confirmados no código local (router.ts + llm.ts) ✅
- Ambos confirmados ativos em produção pelos dados do Supabase (turnos 17,18,22 = TEMPUS para física; turno 5 sessão 2 = TEMPUS para "história") ⚠️
- Push via Escape Hatch é BLOQUEANTE para liberação às famílias

### BUG-57 (NOVO — P1)
- CALCULUS manteve 4 turnos com pedidos explícitos de troca ("quero falar com o professor de português agora")
- Respostas do banco confirmam: CALCULUS deu redirect 3x ("minha especialidade é matemática, mas...")
- Root cause: stickiness guard exige LLM confirmation; sem keyword da nova matéria → retorna 'indefinido' → mantém herói
- Fix: detectar frases de troca explícita como override do stickiness guard

### Segurança
- REGRA DE SIGILO confirmada em todos os prompts (99 ocorrências) ✅
- 12 casos de teste E2E documentados no plano — execução manual pendente pós-push

### Imagem
- Pipeline 100% funcional (message.ts, inlineData, 700KB limit) ✅
- Agentes NÃO pedem foto proativamente — apenas 5 ocorrências em 4 prompts ⚠️
- **GAP-02:** Adicionar seção `📷 USO DE IMAGEM` em CALCULUS, VECTOR, ALKA, VERBETTA

### Super Prova
- 9 acervos gerados durante QA ✅ (7_fund: math, history, pt, bio, geo, chemistry, eng; 3_fund: math, history-errado)
- Acervo 3_fund/historia = side effect BUG-56 (TEMPUS ativado erroneamente) — limpar após fix
- QUIZ: 8q para 3_fund ✅, 12q para 7_fund ✅

### MODO PAI
- Sessão PAI ligada a 1 aluna_id — Leon falou sobre Maria Paz (4º ano) mas contexto era de Layla (7ª)
- **GAP-03:** SUPERVISOR funciona por família (correto) mas heroes PAI ficam com o contexto da filha selecionada no login
**Status:** App em produção (Railway) com 2 fixes de routing pendentes de push. TypeScript: 0 erros.
**URL Railway:** `https://independent-eagerness-production-7da9.up.railway.app`
**Família teste:** `leon@pense-ai.com` / `3282` | PIN responsável: `3282`

### ⚠️ AÇÃO PENDENTE ANTES DE QUALQUER COISA

**2 fixes aplicados localmente — precisam de push pelo Escape Hatch (git lock no VM):**

```
Rodar no Claude Code CLI local (C:\Users\Leon\Desktop\SuperAgentes_B2C_V2):

cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git status
rem Se aparecer .git/index.lock: del .git\index.lock
git add server/src/core/router.ts server/src/personas/PSICOPEDAGOGICO.md
git commit -m "fix: roteamento de matérias — anti-keywords história + mapeamento PSICO"
git push origin main
```

**Após deploy Railway (~3 min):** testar "não entendo velocidade média" → deve aparecer VECTOR no header.

---

## Último Slice Completado

**Slice:** QA Rodadas Duplas — Teste pré-famílias (2026-04-04) ✅

---

## Último Slice Completado

**Slice:** QA Rodadas Duplas — teste pré-famílias completo (2026-04-04) ✅

### Resultados QA

| Perfil | Heroes testados | Score médio | Bugs |
|--------|----------------|-------------|------|
| Layla 7_fund | CALCULUS, VERBETTA, NEURON, GAIA, ALKA, FLEX, TEMPUS | 9.3/10 | BUG-55 VECTOR→TEMPUS (fix ✅) |
| Maria Paz 3_fund | CALCULUS, NEURON, VERBETTA, GAIA + QUIZ | 9.4/10 | BUG-56 história→TEMPUS (fix ✅) |
| Leon PAI | CALCULUS PAI, SUPERVISOR, PROFESSOR_IA | 9.6/10 | — |
| **GERAL** | **todos 8 heróis + modos** | **9.4/10** | 2 bugs fixados |

### Fixes aplicados (locais, pendentes push)

**BUG-55 — `server/src/core/llm.ts`** (fix da sessão anterior, já estava no arquivo):
- Adicionado MAPEAMENTO OBRIGATÓRIO MATÉRIA→HERÓI no envelope PSICOPEDAGOGICO
- Previne que PSICO alucine herói (ex: física→TEMPUS por associação tempo/velocidade)

**BUG-56 — `server/src/core/router.ts`** (fix desta sessão):
- `ANTI_KEYWORDS_HISTORIA` antes vazia → agora inclui frases de composição narrativa
- "escrever uma história", "contar uma história", "inventar uma história" etc. → cancela match de HISTORIA → deixa VERBETTA ser ativada primeiro (PORTUGUES vem antes na ordem de verificação)

**`server/src/personas/PSICOPEDAGOGICO.md`** — mapeamento obrigatório adicionado (fix da sessão anterior)

### Validações confirmadas

- ✅ QUIZ: 8 questões para 3_fund, 12 para 7_fund (SP8 funcionando)
- ✅ MODO PAI: badge, tom adulto, nome filho ativo, estratégias parentais
- ✅ SUPERVISOR: lê dados reais Supabase, resumo preciso semana de Layla
- ✅ PROFESSOR_IA: enquadramento "parceiro de estudo, não buscador de respostas"
- ✅ Bubble reveal: revelação balão a balão funcionando em produção
- ✅ PIN 4 dígitos: fluxo de login do responsável funcionando

---

## Estado anterior (Super Prova — manter para referência)

**Slice:** Super Prova — Implementação completa + Bug #53 fix + SP8 quiz adaptativo (2026-04-04) ✅

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

## Estado do Produto

| Bloco | Status | Detalhes |
|-------|--------|---------|
| Fases 1-4 (backend, agentes, frontend, infra) | ✅ 100% | Todos os gates passando |
| PROFESSOR_IA | ✅ Em produção | Google Search grounding ativo |
| SUPERVISOR qualidade | ✅ Em produção | Fixes 1-6 aplicados |
| Super Prova — Fases A+B+C | ✅ Em produção | Commits cea2974 + 6d1e72d + fix SSE |
| Super Prova — Bug #53 fix | ✅ Em produção | quizSsePromise await antes res.end() |
| Super Prova — SP8 quiz adaptativo | ✅ Em produção | questoesPorSerie() 8-20q por série |
| Super Prova — Gate SP7 | ✅ APROVADO | E2E Layla→TEMPUS→QUIZ 4/4 100% |
| Fase 5 SaaS | ❌ | Próxima fase |

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

**0. Escape Hatch IMEDIATO (antes de qualquer sessão nova)**
- Leon roda prompt de push no Claude Code CLI (ver seção AÇÃO PENDENTE acima)
- Confirma VECTOR com "não entendo velocidade média" → header deve mostrar VECTOR

**1. Brainstorm Fase 5 SaaS (OBRIGATÓRIO — CLAUDE.md)**
- Usar skill `superpowers:brainstorming` antes de qualquer código
- Definir escopo: Landing page, Checkout MP, Onboarding, Webhook
- Decidir: nova rota no mesmo app ou subdomínio separado?

**2. Fase 5 SaaS — checklist de tasks**
- 5.1 Landing page (apresentação + planos R$49,90 / R$79,90)
- 5.2 Checkout Mercado Pago (Checkout Pro/Bricks, Pix recorrente)
- 5.3 Onboarding (cadastro família + entrevista psicopedagógica)
- 5.4 Webhook MP (cria família + hash PIN + alunos automaticamente)

**3. Bug #54 (baixa prioridade — não bloqueia Fase 5)**
- `temaDetectado` genérico ("historia") → acervo Idade Média em vez de WWII
- Fix: extrair tópico específico da mensagem do aluno antes de `obterOuGerarAcervo`

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
