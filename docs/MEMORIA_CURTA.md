# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-14 (Bloco A + B completos)

---

## Estado Imediato

**Fase atual:** Polimento pré-venda. Leon decidiu NÃO iniciar Fase 5 — prioridade é polir o produto.
**Status:** Bloco A COMPLETO + Bloco B COMPLETO + Bloco C COMPLETO. Design visual é o próximo.
**Próximo:** Design visual (skill de design) → Bloco D (Brainstorm Super Prova)

## Último Slice Completado

**Slice:** Bloco A — Bugs Críticos (Polimento Pré-Venda)

**O que foi feito nesta sessão (2026-03-14):**

1. **Fix: JSON vazando no stream dos heróis (CRÍTICO)**
   - Causa: `chamarLLMStream` fazia detecção frágil de JSON (checava se começa com `{`). Falhava com whitespace, JSON mid-stream, ou falha na extração.
   - Fix: Buffer completo — acumula toda a resposta, extrai texto limpo no final com `extrairJSONouTexto()`, envia de uma vez. `useTypingEffect` no frontend cria a animação gradual.
   - Arquivo: `server/src/core/llm.ts` (linhas 121-150 reescritas)

2. **Fix: Vector invadindo conversa de ciências (CRÍTICO)**
   - Causa: Keyword "trabalho" em KEYWORDS_FISICA colide com uso escolar ("trabalho de ciências").
   - Fix: Sistema de anti-keywords (blocklist) — se mensagem contém keyword + anti-keyword, match é cancelado. ANTI_KEYWORDS_FISICA com 13 expressões bloqueadoras. Extensível para todos os temas.
   - Arquivo: `server/src/core/router.ts` (nova estrutura + detectarTema refatorado)
   - **Ideia do Leon:** Lógica do contrário — termos proibidos complementam termos ativadores.

3. **Fix: Logo do herói ilegível no header**
   - Causa: Logo `h-12` (48px) vs buble `h-16` (64px). Logo diminuto.
   - Fix: `h-12` → `h-16` igualando altura do buble.
   - Arquivo: `web/src/components/ChatHeader.tsx` (linha 41)

## Bloco B — Concluído (2026-03-14)

1. **Sentence-per-bubble:** splitSentences() no ChatBubble — cada frase em balão visual separado, avatar só no primeiro
2. **Typing mais lento:** CHARS_PER_TICK 3→2, TICK_INTERVAL_MS 25→35, PARAGRAPH_PAUSE_MS 400→800, FLUSH 15→8
3. **Nome no SlideMenu:** Nome + tipo de perfil (Responsável / Aluno) exibido no topo do menu
4. **EmptyState dinâmico:** Textos diferentes por agente (super_agentes/professor_ia/supervisor) + MODO PAI/FILHO. agenteMenu no ChatContext.

## Bloco C — Concluído (2026-03-14)

1. **NEURON:** Seção "EDUCAÇÃO SEXUAL — ABORDAGEM CIENTÍFICA" adicionada ao bloco SEGURANÇA
2. **PSICOPEDAGOGICO:** Seção "EDUCAÇÃO SEXUAL — ANTECIPAÇÃO POR IDADE" com regras por série (7º+, 6º e abaixo, risco)
3. **Demais heróis:** Proibição centralizada em `construirEnvelopeGestor()` — instrução condicional para todos exceto NEURON/PSICO/SUPERVISOR

## Próximo Passo Exato

**Design Visual:** Usar skill de design para avaliar e aprimorar o layout sem alterar usabilidade ou backend.
**Bloco D:** Brainstorm Super Prova/Estudo com Leon (MCP + NotebookLM)

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ criadas ✅)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 18 + Tailwind + remark-gfm + useTypingEffect
- Testes: Gate 1 (21/21) ✅, Gate 2 (13/13) ✅, Gate 3 smoke (6/6) ✅, Gate 4 (12/12) ✅, Gate 5 E2E (14/14) ✅
- Deploy: Railway FUNCIONANDO ✅ — App testada por Leon e filhas no celular
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Família teste: leon@pense-ai.com / 3282 (Layla 7ª, Maria Paz 3ª)
