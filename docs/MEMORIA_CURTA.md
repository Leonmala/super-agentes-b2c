# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização.  
> **Última atualização:** 2026-04-15 — Sessão de hoje: TEMPUS truncation fix + investigarLink rewrite + F1 fallback + ANTIRESPOSTA 7 heróis + fallback googleSearch.

---

## Estado Imediato

**Produção (Railway):** rebuilding (commit 4bb4787). Todos os fixes desta sessão em produção.

**Próxima ação:**
1. QA com Layla — 8 testes pendentes do Plano Isabela (ver tabela abaixo)
2. Após QA aprovado → SEO + site de vendas

---

## O QUE FOI FEITO HOJE (2026-04-15)

### Sessão 1: Bug TEMPUS + Bug Super Prova KB

**Bug 1 — TEMPUS parava no meio da frase (turnos 114 e 117):**
- Causa raiz: `gemini-2.5-flash` é modelo de pensamento. Tokens de thinking consumiam o budget de `maxOutputTokens: 4000`, truncando o JSON antes do campo `observacoes_internas`
- Fix: adicionado `thinkingConfig: { thinkingBudget: 0 }` em `chamarLLMStream` (llm.ts)
- Evidência pós-fix: turnos 119-121 todos com `observacoes_internas` preenchido

**Bug 2 — Super Prova servindo KB errada (Grandes Navegações para União Ibérica):**
- Causa raiz: PSICO não gerava `super_prova_query` → tema_hash defaultava para "historia" genérico → hit no cache de 2026-04-04
- Fix: adicionado campo `"super_prova_query": null` + regras de preenchimento no PSICOPEDAGOGICO.md (ambas as pastas)
- Evidência pós-fix: PSICO gerou `tema_hash: "redacaocronicanoticia"` no teste seguinte

**Commit 8e9883c** — ambos os fixes.

### Sessão 2: investigarLink + ANTIRESPOSTA

**F1: Fallback KB quando link inacessível (message.ts):**
- Quando `investigarLink` retorna null, injeta KB instruindo herói a pedir o trecho ao aluno
- `linkKbSalvaNesteTurno = true` mesmo no fallback (protege contra sobrescrita do Hook 1)

**Rewrite investigarLink (investigar-link.ts):**
- Substituiu Google Search grounding por `fetch()` nativo com timeout 10s + stripHtml + Gemini sem tools
- Google Search apenas buscava no Google (não fazia fetch direto) → sites institucionais não indexados falhavam silenciosamente

**F2: ANTIRESPOSTA EXCEÇÃO nos 7 heróis:**
- Bloco `EXCEÇÃO — FRUSTRAÇÃO CLARA (1x por interação)` + `MODO IRRESTRITO` adicionado a:
  - VERBETTA, NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX
  - Em ambas as pastas: `server/src/personas/` e `Prompts/` (14 arquivos)
- Padrão CALCULUS replicado — sinaliza `sinal_psicopedagogico: true` + `motivo_sinal: "RELAXAMENTO_CONSTRUTIVISMO_ATIVADO"`

**Commit d04a93c** — todos esses fixes.

**Fallback automático fetch → Google Search (investigar-link.ts + index.ts):**
- Se `fetch()` falha, tenta Google Search antes de retornar null
- Exportado como `investigarLinkComFallback`, alias `investigarLink` no index.ts — sem mudança em message.ts
- Decisão tomada: **não** turbinar PSICO com extração de slug do link (baixo ganho, risco real)

**Commit 4bb4787** — fallback.

---

## QA PENDENTE — Testes do Plano Isabela (do dia 2026-04-14)

Executar com Layla. Critérios completos em `docs/RELATORIO_CORRECAO_2026-04-14.md`.

| Teste | O que verifica |
|-------|---------------|
| 1.A | Reload de página → turnos anteriores preservados no banco |
| 2.A | Tema específico salvo no banco após cascata (não "historia" genérico) |
| 2.B | `b2c_super_prova_acervo` com tema_hash específico |
| 2.C | Reconexão: KB injetada é sobre o tema específico, não genérico |
| 3.A | Link sem contexto → PSICO aparece (não herói anterior), turno PAUSA no banco |
| 3.B | Link + contexto → PSICO cria plano → herói entra com KB do link |
| 3.C | Após Branch B, 2+ turnos: `super_prova_kb` ainda tem conteúdo do link |
| 3.D | Conversa normal sem link → fluxo PSICO→herói intacto (regressão) |

**Adicionais desta sessão (2026-04-15):**
| 4.A | VERBETTA com frustração explícita ("não consigo") → dá resposta + convida para jornada |
| 4.B | VERBETTA modo irrestrito (plano com `construtivismo_irrestrito`) → não dá resposta mesmo com frustração |
| 4.C | Link da OIM ou similar → investigarLink tenta fetch, falha, tenta Search → retorna KB |

---

## CONTEXTO CRÍTICO PARA BOOT

- App: `https://independent-eagerness-production-7da9.up.railway.app`
- Conta: `leon@pense-ai.com` / senha `3282` / PIN responsável: `3282`
- Layla: 7º ano | aluno_id: `0fb1c38f-7d34-45b1-8ff2-3e5c4ccff71e`
- Maria Paz: 3º ano | aluno_id: `6fa15ba4-38e8-4628-9b51-e0a3076d631a`
- Sessão ativa Layla: `3eb3e585-57c7-48a6-af2d-4b9c2e598e84`
- Tabela de uso: `b2c_uso_diario` — resetar antes de cada fluxo de QA
- Repo: `https://github.com/Leonmala/super-agentes-b2c`
- LLM dev: Gemini 2.5 Flash (`GOOGLE_API_KEY`)
- LLM prod: Kimi K2.5 (Moonshot AI)
- Supabase: `ahopvaekwejpsxzzrvux.supabase.co`

---

## COMMITS DESTA SESSÃO (2026-04-15)

| Hash | Descrição |
|------|-----------|
| 8e9883c | fix: thinkingBudget=0 (TEMPUS truncation) + super_prova_query no PSICO |
| d04a93c | fix: investigarLink fetch direto + F1 fallback KB + ANTIRESPOSTA EXCEÇÃO 7 heróis (14 arquivos) |
| 4bb4787 | fix: investigarLink fallback automático fetch → Google Search |

---

## AGENDA SUGERIDA — próxima sessão

1. **QA com Layla** — 11 testes acima (Railway rodando com commits desta sessão)
2. **Monitorar logs Railway** durante QA de link (confirmar qual caminho foi tomado: fetch ou Search)
3. **SEO + site de vendas** — pendente desde 2026-04-07
