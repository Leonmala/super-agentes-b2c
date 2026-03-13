# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-13 (Fase 4 completa)

---

## Estado Imediato

**Fase atual:** Fase 4 COMPLETA ✅ → Próximo: Fase 5 (SaaS)
**Status:** Gate 4 PASSED (12/12 testes). CRON, Qdrant, Dispositivos, Limites implementados.
**Fase 2.5:** ADIADA — Workshop PROFESSOR_IA será por último (após Fases 4→5→6).
**Próximo:** Fase 5 (Landing page, Checkout Mercado Pago, Onboarding)

## Último Slice Completado

**Slice:** Fase 4 — Infraestrutura completa
**O que foi feito:**
- Bug fix BLOQUEADOR: interfaces TypeScript corrigidas (UsoDiario.turnos→turnos_completos, DispositivoAtivo campos errados)
- Bug fix: usage-queries.ts INSERT e SELECT agora usam coluna correta `turnos_completos`
- Nova função `incrementarTurnoCompleto()` — incrementa após resposta do herói
- Qdrant Cloud integration: `server/src/db/qdrant.ts` (inicializar, embedding, search, upsert)
- CRON semanal: `server/src/core/cron.ts` (flush turnos → resumo LLM → embedding → backup → delete → encerrar sessões)
- CRON registrado no boot do Express (`index.ts`)
- Controle de dispositivos: `server/src/core/dispositivos.ts` (registro, verificação limite=3, cleanup)
- Device check wired em `routes/message.ts` (após JWT decode, antes do processamento)
- Frontend: `X-Device-Token` header em todas as requisições (localStorage UUID)
- Dependência `@qdrant/js-client-rest` instalada
- Gate 4: 12/12 testes passando
- QdrantRef interface adicionada em supabase.ts

## Próximo Passo Exato

1. **Push Fase 4** → Claude Code CLI (escape hatch para Leon)
2. **Fase 5** → Landing page + Checkout Mercado Pago + Onboarding
3. **Fase 6** → Deploy final + E2E
4. **Fase 2.5** → Workshop PROFESSOR_IA (último)

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ criadas ✅)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 18 + Tailwind
- Testes: Gate 1 (21/21) ✅, Gate 2 (13/13) ✅, Gate 3 smoke (6/6) ✅, Gate 4 (12/12) ✅
- Deploy: Railway FUNCIONANDO ✅
- Novas env vars necessárias: QDRANT_URL, QDRANT_API_KEY, EMBEDDING_PROVIDER=gemini, TZ=America/Sao_Paulo
- Novos arquivos: server/src/db/qdrant.ts, server/src/core/cron.ts, server/src/core/dispositivos.ts
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
