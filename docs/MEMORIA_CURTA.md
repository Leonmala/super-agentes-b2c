# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-04-03 — Supervisor 100% funcional. Sessão por família + nome do pai + qualidade de resposta resolvida. Próximo: git push + Brainstorm Super Prova.

---

## Estado Imediato

**Fase atual:** Polimento Pré-Venda — SUPERVISOR ✅ 100% completo → Próximo: git push + Brainstorm Super Prova (PE3) → Fase 5 SaaS
**Status:** Supervisor funcionando com tom PENSE-AI, sessão por família, saudação personalizada com nome do pai.
**URL Railway:** `https://independent-eagerness-production-7da9.up.railway.app`
**Próximo (INÍCIO DA PRÓXIMA SESSÃO):** git push via Escape Hatch → Brainstorm Super Prova com Leon

---

## Último Slice Completado

**Slice:** SUPERVISOR completo (2026-04-03) ✅

### Fixes aplicados (nesta sessão):

**Fix 1 — diasAtras bug (message.ts):**
- Fix: `buscarTurnosDaFilha(aluno_id, 50, 30)` — busca 30 dias atrás

**Fix 2 — Instruções no contexto (message.ts):**
- Fix: contexto contém APENAS dados (padrão PROFESSOR_IA)

**Fix 3 — Prompt contradição (SUPERVISOR_EDUCACIONAL.md):**
- Fix: removida estrutura numerada, substituída por prosa

**Fix 4 — Instrução de formato (llm.ts):**
- Temperature 0.3, frases proibidas reforçadas

**Fix 5 — Sessão por família (persistence.ts + message.ts):**
- Bug: `buscarOuCriarSessaoSupervisor` tinha `alunoId` como parâmetro → criava sessão por filha, não por família
- Fix: removido `alunoId` da função. Sessão é por `familia_id` apenas.
- Pai pode conversar sobre Layla e depois Maria Paz sem resetar sessão
- Flush acontece apenas ao entrar no agente (nova_sessao=true do frontend)

**Fix 6 — Nome do responsável no contexto (persistence.ts + message.ts):**
- Adicionado: `buscarNomeResponsavel(familiaId)` — busca `b2c_responsaveis.nome` por `familia_id`
- Injeta `RESPONSÁVEL: Leon` no contexto do SUPERVISOR
- Prompt atualizado para usar o nome na saudação de abertura

### Resultado dos testes (04/04):
- ✅ "ola" → "Olá, Leon! Tudo bem? Sobre qual das meninas você gostaria de conversar hoje, a Layla ou a Maria Paz?"
- ✅ "quero saber sobre a Layla" → cita dados reais ("21-01=18...em que mundo isso calculus")
- ✅ "e sobre a Maria Paz?" (aluno_id trocado, sem nova_sessao) → identifica zero dados, sugere engajamento
- ✅ Sessão mantida ao trocar de filha — sem flush indevido
- ✅ Prosa sem listas, sem closings CSR

---

## Estado do Produto (local — aguardando push)

| Bloco | Status | Detalhes |
|-------|--------|---------|
| Fases 1-4 (backend, agentes, frontend, infra) | ✅ 100% | Todos os gates passando |
| PROFESSOR_IA | ✅ Em produção | Google Search grounding ativo |
| SUPERVISOR qualidade | ✅ RESOLVIDO hoje | diasAtras + contexto limpo + prompt fix |
| Super Prova (PE3) | ❌ | Brainstorm pendente |
| Fase 5 SaaS | ❌ | Após Super Prova |

---

## Arquivos modificados (aguardando git push)

- `server/src/routes/message.ts` — diasAtras fix + contexto sem instruções + sessão por família + nome responsável
- `server/src/core/llm.ts` — temperature 0.3 SUPERVISOR + frases proibidas
- `server/src/personas/SUPERVISOR_EDUCACIONAL.md` — removida estrutura numerada + doc RESPONSÁVEL
- `server/src/db/persistence.ts` — buscarOuCriarSessaoSupervisor sem alunoId + buscarNomeResponsavel

---

## Próximo Passo Exato — BOOT DE AMANHÃ

1. Escape Hatch → git push para Railway (arquivos modificados acima)
2. Brainstorm Super Prova com Leon (PE3)
3. Fase 5 SaaS (Landing + Checkout + Onboarding)

---

## Contexto Crítico Para Boot

- Supabase: `ahopvaekwejpsxzzrvux.supabase.co` — MCP correto: `mcp__0150fe87` (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6 + React 18 + Tailwind CSS + Plus Jakarta Sans
- Testes: Gate 1-5 ✅, Gate Bloco H 16/16 ✅, unitários 9/9 ✅, classificador 306/306 ✅, TypeScript 0 erros ✅
- Deploy: Railway ATIVO ✅
- Repo GitHub: `https://github.com/Leonmala/super-agentes-b2c`
- Família teste: `leon@pense-ai.com` / PIN 3282 (Layla 7ª, Maria Paz 3ª)
- **LLM SDK:** `@google/generative-ai` NATIVO (não OpenAI-compat).
- **Router (CRÍTICO):** Keywords ≤4 chars usam word boundary. Stickiness guard em decidirPersona — NUNCA remover.
- **agente_override (CRÍTICO):** Só agentes em `AGENTES_OVERRIDE_VALIDOS` são aceitos.
- **Escape Hatch:** Para git push/permissões — montar prompt para Leon rodar no Claude Code CLI local.
- **b2c_qdrant_refs:** Colunas reais: id, aluno_id, namespace, semana_ref, ponto_ids, resumo_semantico, created_at, responsavel_id. NÃO tem coluna `tipo`.

---

## O que NÃO fazer

- ❌ NÃO usar Paperclip (agentes autônomos) — experiência negativa, sem controle
- ❌ NÃO criar envelope separado para SUPERVISOR — usar o mesmo GESTOR dos heróis (PROFESSOR_IA é o modelo)
- ❌ NÃO misturar instruções dentro do contexto — contexto = dados, instruções = persona prompt
- ❌ NÃO iniciar Fase 5 SaaS antes de Super Prova estar pronto
- ❌ NÃO fazer brainstorm de features sozinho — sempre com Leon
