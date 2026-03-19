# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-18 (Router Fix PE2 — 3 fixes + 306 testes — TypeScript 0 erros ✅)

---

## Estado Imediato

**Fase atual:** PE2 COMPLETO LOCALMENTE ✅ (aguardando commit/deploy)
**Status:** Código alterado localmente, testes 306/306 PASS, TypeScript 0 erros — commit pendente via escape hatch
**URL Railway:** `https://independent-eagerness-production-7da9.up.railway.app`
**Próximo:** Commit + deploy via escape hatch → PF1: Brainstorm NotebookLM / Super Prova com Leon

## Último Slice Completado

**Slice:** PE2 — Router Fix: Stickiness Guard + Word Boundary + 306 Testes (2026-03-18)

### Problema Identificado

Leon encontrou dois bugs críticos de roteamento em teste manual de produção:

1. **VECTOR em sessão de História:** Aluno comentou "hahahaha...antes era grego" durante sessão sobre Hitler/Nazismo → sistema trocou para VECTOR (Física). Causa: `detectarTema()` retornou null → LLM classificador rodou → Gemini Flash associou "grego" a letras gregas em Física (α,β,ω) → override para VECTOR.

2. **GAIA em sessão de Matemática:** Aluno respondeu "nossa...nao sei..o proprio 40" → sistema trocou para GAIA (Geografia). Causa: `'rio'` (3 chars) em `KEYWORDS_GEOGRAFIA` fazia `.includes()` match dentro de "próprio" → detectarTema retornou 'geografia' → override para GAIA.

### O que foi implementado

**`server/src/core/router.ts` — 3 fixes:**

**Fix 1 — Word Boundary para keywords curtas:**
- Helper `reWordBoundary(keyword)` com lookbehind/lookahead `(?<![a-zA-Z...])kw(?![a-zA-Z...])`
- `temKeyword()` modificado: keywords ≤4 chars sem espaços usam word boundary regex
- Threshold 4 (não 6) para não quebrar plurais (guerra→guerras, molar→molaridade)
- 'rio', 'pais', 'base', 'arte', 'luz', 'mar' agora só matcham como palavras inteiras

**Fix 2 — Remoção de keywords ultra-genéricas + anti-keywords:**
- Removidos `' mais '`, `' menos '` de KEYWORDS_MATEMATICA
- ANTI_KEYWORDS_MATEMATICA: 'às vezes', 'as vezes', 'umas vezes', 'idade média', 'idade media'
- ANTI_KEYWORDS_PORTUGUES: 'em espanhol', 'de espanhol', 'en español', 'em inglês', 'de inglês'
- ANTI_KEYWORDS_FISICA estendida: 'energia da', 'que calor', 'movimento de dança', etc.
- Adicionadas keywords relevantes: área, perímetro, ângulo, triângulo, raiz quadrada, logaritmo, média, moda, mediana (MATEMATICA); sistema imunológico, vertebrado, mamífero (CIENCIAS); verbos en español (ESPANHOL)

**Fix 3 — Stickiness Guard em decidirPersona():**
- Quando keywords detectam tema DIFERENTE do agente ativo → exige confirmação do LLM
- Se LLM classifica como 'indefinido' → mantém herói atual (sem troca)
- Se LLM confirma troca → prossegue normalmente
- Condição: `temaKeywords !== sessao.tema_atual && sessao.agente_atual && sessao.agente_atual !== 'PSICOPEDAGOGICO' && sessao.tema_atual !== null`

**`server/tests/router-classificador.test.ts` — 306 testes:**
- 21 describe blocks, seções A-G cobrindo todos os cenários
- Casos tricky: substrings, falsos positivos semânticos, mensagens sociais, trocas explícitas
- Resultado final: **306/306 PASS** ✅

**Verificações:**
- TypeScript: 0 erros ✅
- Testes: 306/306 PASS ✅
- Ralph Loop docs: LOG_ERROS (erros 41-46) + CHECKLIST (PE2) atualizados ✅

### Commits PE2 (PENDENTES — precisam do escape hatch)

Arquivos modificados localmente:
- `server/src/core/router.ts` — 3 fixes
- `server/tests/router-classificador.test.ts` — criado (306 casos)
- `docs/MEMORIA_CURTA.md` — este arquivo
- `docs/LOG_ERROS.md` — erros 41-46
- `docs/CHECKLIST_PROJETO.md` — PE2 marcado

## Próximo Passo Exato

1. **Commit + Deploy via Escape Hatch** — Leon roda no Claude Code CLI:
   ```
   cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
   git add server/src/core/router.ts server/tests/router-classificador.test.ts docs/
   git commit -m "fix(router): word boundary + stickiness guard + 306 testes classificador"
   git push origin main
   ```

2. **PF1:** Brainstorm NotebookLM / Super Prova com Leon — nova feature

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ + 3 novas colunas em b2c_turnos + índice parcial)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6 + React 19 + Tailwind 4 + Plus Jakarta Sans
- Testes: Gate 1-5 ✅, Gate Bloco H 16/16 ✅, unitários 9/9 ✅, classificador 306/306 ✅, TypeScript 0 erros ✅
- Deploy: Railway ATIVO ✅ — PE1 em produção e validado
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Família teste: leon@pense-ai.com / 3282 (Layla 7ª, Maria Paz 3ª)
- **Imagens:** Originais em `Imagens/`, servidas de `web/public/` com nomes diferentes. SEMPRE copiar ao atualizar.
- **LLM SDK:** `@google/generative-ai` NATIVO (não OpenAI-compat). Multimodal = `inlineData`, não `image_url`.
- **Router (CRÍTICO):** Keywords ≤4 chars usam word boundary. Stickiness guard em decidirPersona — NUNCA remover. NUNCA adicionar preposições ou palavras genéricas a keywords de matéria.
