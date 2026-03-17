# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-17 (Bloco H — VALIDADO EM PRODUÇÃO)

---

## Estado Imediato

**Fase atual:** Bloco H COMPLETO E VALIDADO — Gate Bloco H 16/16 em produção, ZERO JSON leaks
**Status:** Deploy ativo no Railway. Commit `92d492e` (Bloco H) + `64d0d0f` (logos) pushed.
**URL Railway:** `https://independent-eagerness-production-7da9.up.railway.app`
**Próximo:** (1) PE1: Botão "+" para fotos/câmera, (2) PF1: Brainstorm NotebookLM com Leon

## Último Slice Completado

**Slice:** Bloco H — Disjuntores Arquiteturais + Validação E2E (2026-03-17)

**Bugs corrigidos:**
- **Bug #37**: PSICO JSON truncado por maxOutputTokens → cascata morria → JSON raw enviado ao aluno
- **Bug #38**: Herói JSON com aspas malformadas → JSON.parse falha → JSON raw exposto ao pai
- **Bug #39**: Backend nunca processava `sinal_psicopedagogico`, `motivo_sinal`, `observacoes_internas` dos heróis

**5 Disjuntores instalados:**
1. **D1 — Extração robusta:** Pipeline 4 camadas (JSON.parse → markdown → regex → texto puro)
2. **D2 — Sanitizador incondicional:** SEMPRE roda antes de enviar texto ao aluno
3. **D3 — Cascata resiliente:** PSICO cascata usa `processed.cascata` tipada
4. **D4 — Pipeline de sinais:** Herói → persistência → Supabase (3 colunas + índice)
5. **D5 — maxOutputTokens:** PSICO 3000→8000, heróis 3000→4000

**Validação em produção (Gate Bloco H):**
- 16/16 testes passaram (8 heróis × 2 modos)
- ZERO JSON leaks (verificado contra 10 padrões regex)
- Todos os 16 turnos persistidos no Supabase (verificado via SQL direto)
- MODO FILHO: respostas construtivistas, linguagem adaptada à idade
- MODO PAI: respostas com estratégias práticas para ensinar em casa
- Tempos médios: 7-20s (cascata PSICO+herói), 8-18s (herói direto)

**Limitações conhecidas dos testes:**
- Nenhum herói ativou `sinal_psicopedagogico = true` nos testes (pipeline de sinais testado apenas em unitários)
- Qualidade pedagógica avaliada visualmente, sem LLM-as-judge
- JSON malformado testado em unitários (T4, T5, T7, T8), não provocado em produção

### Arquivos criados/modificados no Bloco H
- `server/src/core/response-processor.ts` (NOVO — ~300 linhas, pipeline central)
- `server/tests/response-processor.test.ts` (NOVO — 9 testes unitários)
- `server/tests/gate-bloco-h-*.ts` (NOVO — testes E2E de produção)
- `server/src/core/llm.ts` (MODIFICADO — processador, interfaces, maxOutputTokens)
- `server/src/routes/message.ts` (MODIFICADO — cascata via processed, sinais)
- `server/src/db/supabase.ts` (MODIFICADO — 3 campos Turno)
- `server/src/db/persistence.ts` (MODIFICADO — sinais + buscarSinaisAluno)

### Fix de imagens (mesmo dia)
- `Imagens/Logo_SuperAgentesPenseAI.png` → copiado para `web/public/LogoPenseAI.png`
- `Imagens/SuperAgentesPenseAi_buble.png` → copiado para `web/public/logo-buble.png`
- Problema: Leon atualizava originais em `Imagens/` mas app serve de `web/public/` com nomes diferentes

## Próximo Passo Exato

1. **PE1: Botão "+"** para fotos/câmera
2. **PF1: Brainstorm NotebookLM** com Leon

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ + 3 novas colunas em b2c_turnos + índice parcial)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 19 + Tailwind 4 + Plus Jakarta Sans
- Testes: Gate 1-5 ✅, Gate Bloco H 16/16 ✅, unitários 9/9 ✅, TypeScript 0 erros ✅
- Deploy: Railway ATIVO ✅ — commit `92d492e` + `64d0d0f`
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Família teste: leon@pense-ai.com / 3282 (Layla 7ª, Maria Paz 3ª)
- **Logo correto:** `LogoPenseAI.png` (cubo 3D "Pense AI!") — copiado de `Imagens/Logo_SuperAgentesPenseAI.png`
- **Imagens:** Originais em `Imagens/`, servidas de `web/public/` com nomes diferentes. SEMPRE copiar ao atualizar.
