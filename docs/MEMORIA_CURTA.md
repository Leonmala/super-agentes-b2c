# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-13 (Gate 5 E2E PASSED — 14/14)

---

## Estado Imediato

**Fase atual:** Gate 5 E2E PASSED ✅ (14/14 testes, média 9.3/10) → Próximo: Push + Fase 5 (SaaS)
**Status:** Todos os 8 heróis validados E2E com LLM-as-judge. Cascata, continuidade, modo pai e troca de matéria OK.
**Fase 2.5:** ADIADA — Workshop PROFESSOR_IA será por último (após Fases 5→6).
**Próximo:** Push para GitHub + Fase 5 (Landing page, Checkout Mercado Pago, Onboarding)

## Último Slice Completado

**Slice:** Gate 5 E2E — Validação dos 8 agentes
**O que foi feito:**
- Bug fix CRÍTICO: "revolução" matchava "evolução" (substring) → ciências em vez de história
  - Fix: reordenar detectarTema (historia ANTES de ciencias)
  - Fix: trocar keyword "evolução" por "teoria da evolução"/"evolução das espécies"
- Bug fix: "me conta" (verbo contar) matchava "conta" (aritmética) em KEYWORDS_MATEMATICA
  - Fix: trocar "conta"/"contas" por "conta de matematica"/"fazer conta"/"fazer contas"
- Bug fix: modelo gemini-2.0-flash deprecated → atualizado default para gemini-2.5-flash em llm.ts
- Bug fix: b2c_uso_diario faltava colunas updated_at/created_at → migração aplicada
- Bug fix: PSICO alucinava heroi_escolhido → override por keyword em message.ts
- Bug fix: estado de sessão poluído entre testes → limparSessoesAluno() deleta sessões+turnos+uso
- Bug fix: removerAcentos() + dual matching para robustez de encoding
- Gate 5 E2E: 14/14 testes passando, média 9.3/10
- Relatório: server/tests/reports/gate5-2026-03-13-1817.md

## Próximo Passo Exato

1. **Push para GitHub** → Claude Code CLI (escape hatch para Leon)
2. **Fase 5** → Landing page + Checkout Mercado Pago + Onboarding
3. **Fase 6** → Deploy final + E2E
4. **Fase 2.5** → Workshop PROFESSOR_IA (último)

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ criadas ✅)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 18 + Tailwind
- Testes: Gate 1 (21/21) ✅, Gate 2 (13/13) ✅, Gate 3 smoke (6/6) ✅, Gate 4 (12/12) ✅, Gate 5 E2E (14/14) ✅
- Deploy: Railway FUNCIONANDO ✅
- Novas env vars necessárias: QDRANT_URL, QDRANT_API_KEY, EMBEDDING_PROVIDER=gemini, TZ=America/Sao_Paulo
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
