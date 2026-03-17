# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-17 (Bloco G — Robustez + UX + Testes)

---

## Estado Imediato

**Fase atual:** Bloco G implementado (router + UX + infra testes)
**Status:** 8 tasks implementadas, pendente: Gate 6 tests, QA script, deploy + push
**Próximo:** (1) Push + deploy Railway, (2) Gate 6 + QA em produção, (3) Botão "+" para fotos/câmera, (4) Brainstorm agente NotebookLM

## Último Slice Completado

**Slice:** Bloco G — Robustez + UX + Testes em Produção (2026-03-17)

**O que foi feito nesta sessão:**

### Backend — Router Refactor
- Migração SQL: `ultimo_turno_at` (TIMESTAMPTZ) adicionado à `b2c_sessoes`
- Funções: `atualizarUltimoTurno()` e `resetarSessaoAgente()` em persistence.ts
- `decidirPersona()` agora é ASYNC com 5 caminhos de decisão:
  1. Timeout 15min ou `nova_sessao` flag → reset agente
  2. Keywords → fluxo normal (PSICO cascata ou herói direto)
  3. Classificador LLM leve (`classificarTema`) — Gemini Flash, temp=0, 500ms timeout
  4. Indefinido + agente ativo → continuidade
  5. Erro/sem agente → PSICOPEDAGOGICO
- `message.ts` atualizado: extrai `nova_sessao` do body, chama `atualizarUltimoTurno()` após cada mensagem
- Removida dependência de `classificarTemaInteligente` (heavy, 1500+ tokens) — substituída por `classificarTema` (10 tokens)

### Frontend — Bubble-by-Bubble Reveal
- `TypingDots.tsx` — 3 pontinhos animados com bounce CSS (substituiu StreamingCursor)
- `useBubbleReveal.ts` — hook de revelação balão por balão com tempo de leitura
- `ChatContext.tsx` refatorado: removeu useTypingEffect, adicionou pendingReveal + nova_sessao flag
- `ChatMessages.tsx` refatorado: integra useBubbleReveal + TypingDots
- `ChatBubble.tsx` refatorado: exporta splitSentences, props singleBubble/bubbleIndex para reveal
- `chat.ts`: body agora inclui `nova_sessao`

### Infraestrutura de Testes
- `API_URL` configurável no TestClient (process.env.API_URL || localhost:3001)
- Scripts: `test:prod`, `gate:6`, `qa`, `qa:prod`
- MCP Bridge: `/api/mcp` com 5 endpoints + auth JWT+PIN + rate limiting

### Arquivos Deletáveis (não consegui deletar por permissão do mount)
- `web/src/hooks/useTypingEffect.ts` — ninguém importa mais
- `web/src/components/StreamingCursor.tsx` — ninguém importa mais

## Próximo Passo Exato

1. **Leon faz push** via Claude Code CLI (prompt abaixo no final da sessão)
2. **Gate 6 + QA** rodar contra produção após deploy
3. **PE1: Botão "+"** para fotos/câmera
4. **PF1: Brainstorm NotebookLM** com Leon

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ + coluna ultimo_turno_at)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 19 + Tailwind 4 + Plus Jakarta Sans
- Testes: Gate 1-5 ✅ passando, Gate 6 criado mas não executado
- Deploy: Railway FUNCIONANDO ✅
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Família teste: leon@pense-ai.com / 3282 (Layla 7ª, Maria Paz 3ª)
- **Logo correto:** `LogoPenseAI.png` (cubo 3D "Pense AI!") — NÃO usar `logo-penseai.png`
- **Spec:** `docs/superpowers/specs/2026-03-17-bloco-g-robustez-ux-testes-design.md`
- **Plano:** `docs/superpowers/plans/2026-03-17-bloco-g-robustez-ux-testes.md`
