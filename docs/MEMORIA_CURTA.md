# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização.  
> **Última atualização:** 2026-04-13 — Link Guardian completo + TypeCheck 0 erros ✅ Push pendente.

---

## Estado Imediato

**Fase atual:** Hook 0 — Link Guardian totalmente implementado. Quando aluno envia URL → sistema pede contexto (Branch A) ou Super Prova investiga link via Gemini e injeta KB para o herói (Branch B). TypeCheck server 0 erros. Push + SQL migration pendentes via Escape Hatch.

**Próxima ação:**
1. Push via Escape Hatch (inclui SQL migration no Supabase)
2. QA com Layla: enviar link solto → sistema pede contexto; enviar link+contexto → herói responde com conhecimento do conteúdo
3. QA 3 fixes anteriores: reconexão preserva contexto, quiz proativo, KB específica

---

## O QUE FOI FEITO HOJE (2026-04-13 — Sessão 4)

### Hook 0 — Link Guardian — IMPLEMENTADO ✅

**Motivação:** Layla mandou um link de texto do professor → GAIA funcionou (Gemini lê URL). Mas quando heróis migrarem para Kimi K2.5 (sem Google Search), URLs irão quebrar silenciosamente. Além disso, link solto sem contexto não deveria ser processado direto.

**Arquitetura:** "Quadrado dentro do círculo" — Hook 0 roda após `resetarSessaoAgente`, antes de `decidirPersona()`. Quando termina, fluxo existente continua intacto.

**Branch A — Link sem contexto:**
- `detectarURL()` encontra URL, `textoAlem.length < 10`
- Salva `link_pendente` na sessão
- Responde: "Oi [nome]! Antes de eu abrir esse link, me conta: do que ele trata e o que a gente vai estudar com ele?"
- `res.end()` — fluxo encerra aqui

**Branch B — Link + contexto (ou `link_pendente` + qualquer resposta):**
- Emite SSE `'search'` → "🔍 analisando conteúdo do link..."
- `await investigarLink(url, mensagem, serie, heroiId)` — Gemini lê URL, retorna KB estruturada
- `persistirKnowledgeBase()` — KB injetada para o herói
- `atualizarSessao({ link_pendente: null })` — estado limpo
- Fluxo continua para `decidirPersona()` normalmente

**Arquivos criados/modificados:**
- `server/src/utils/detect-url.ts` — função pura `detectarURL()`, regex `https?://` apenas
- `server/src/super-prova/investigar-link.ts` — Gemini lê URL, falha silenciosamente
- `server/src/super-prova/index.ts` — re-exporta `investigarLink`
- `server/src/routes/message.ts` — imports + Hook 0 inserido
- `server/src/db/supabase.ts` — `link_pendente: string | null` na interface `Sessao`
- `server/src/db/persistence.ts` — `link_pendente?: string | null` em `atualizarSessao`

**TypeCheck:** 0 erros ✅

**Migration SQL pendente (Escape Hatch):**
```sql
ALTER TABLE b2c_sessoes ADD COLUMN IF NOT EXISTS link_pendente TEXT DEFAULT NULL;
```

---

## O QUE FOI FEITO HOJE (2026-04-13 — Sessão 3)

### Fix 1: Bug nova_sessao destrói turnos — IMPLEMENTADO ✅

**Problema:** `resetarSessaoAgente` em `persistence.ts` deletava TODOS os turnos da sessão quando `nova_sessao === true` (primeira mensagem após abrir/reabrir página). Layla saiu sem querer e voltou → 6 turnos de quilombos deletados → GAIA sem contexto → "papo esquisito".

**Solução cirúrgica:**
- `server/src/db/persistence.ts`: Removido bloco DELETE de b2c_turnos (linhas 89-97 originais)
- `server/src/db/persistence.ts`: Removido `tema_atual: null` do update — PSICO agora preserva tema para oferecer continuidade ("quer continuar estudando quilombos?")
- Função agora apenas reseta `agente_atual` para PSICOPEDAGOGICO + `ultimo_turno_at`

### Fix 2: Oferta Proativa de Quiz — IMPLEMENTADO ✅ (16 arquivos)

**Problema:** Heróis só emitiam QUIZ quando aluno pedia ou quando `fechar_com_quiz: true` no Universal Method. Nenhuma oferta proativa.

**Solução:**
- Seção `OFERTA PROATIVA DE QUIZ` adicionada em todos os 8 heróis × 2 pastas (16 arquivos)
- Regra: quando herói detecta compreensão real → oferece gentilmente ("Quer fazer um quiz rápido?")
- Máximo 1 oferta por tópico. Respeitar recusa. Não oferecer enquanto ainda há dificuldade.
- Inserida imediatamente antes de `FECHAMENTO PEDAGÓGICO PÓS-QUIZ`

### Fix 3: Super Prova KB Específico — IMPLEMENTADO ✅

**Problema:** Hook 1 do Super Prova usava `temaDetectado` genérico ("geografia") para gerar KB. Todas as sessões de geografia compartilhavam o mesmo acervo genérico, independente do tópico específico.

**Solução:**
- `server/src/core/response-processor.ts`: Campo `super_prova_query: string | null` adicionado ao tipo `IntencaoCascata` + `extrairCascata` popula o campo do JSON do PSICO
- `server/src/routes/message.ts` Hook 1 Caso A: `temaEspecifico_A` = `cascata.super_prova_query || respostaJSON.super_prova_query || temaDetectado`
- `server/src/routes/message.ts`: `sessao.tema_atual` persistido com tema específico (não genérico)
- `server/src/routes/message.ts` Hook 1 Caso B: `temaEspecifico_B` = `temaDetectado || sessao.tema_atual`

**Resultado esperado:** PSICO emite `super_prova_query: "quilombos_atualidade"` → KB gerada sobre quilombos, não sobre "geografia" genérica.

**TypeCheck:** server 0 erros, web 0 erros ✅

---

## O QUE FOI FEITO HOJE (2026-04-13 — Sessões 1 e 2)

### Quiz Result Feedback Loop — IMPLEMENTADO ✅

**Loop completo:**
```
PSICO plano → herói executa tópicos → herói emite sinal QUIZ → Super Prova gera quiz →
QuizCard roda → resultado → ChatContext.fecharQuiz → enviar "[Quiz concluído]" →
herói recebe → fechamento pedagógico → Método Universal completo ✅
```

### Universal Method + Router + Super Prova Session-Aware — IMPLEMENTADOS ✅

(ver MEMORIA_LONGA.md Sessões 17-18 para detalhes completos)

---

## ANÁLISE ROOT CAUSE — SESSÃO LAYLA GAIA (2026-04-13)

**Bug confirmado:** `b2c_uso_diario` mostrava 11 interações hoje vs 5 turnos em `b2c_turnos` → 6 turnos deletados.
**Causa:** `resetarSessaoAgente` em `persistence.ts` tinha bloco DELETE que apagava todos os turnos da sessão.
**Gatilho:** Frontend envia `nova_sessao: true` na primeira mensagem de cada conexão → `message.ts` linha 213-215 chama `resetarSessaoAgente`.

**BUG-CRON:** CRON NUNCA FOI IMPLEMENTADO. Foi planejado para n8n, Leon rejeitou n8n, está em checklist futuro para implementar no mesmo ambiente. Qualquer referência a "CRON rodou domingo" é incorreta.

**Super Prova KB genérica:** `temaDetectado` no router é sempre a matéria genérica (keywords → "historia", "geografia"). O tema específico vem do PSICO via `super_prova_query`, que não estava sendo usado no Hook 1. Fix implementado na sessão de hoje.

---

## PUSHES PENDENTES (acumulados)

**Escape Hatch completo (copiar e colar no Claude Code CLI local):**

**PASSO 1 — SQL migration no Supabase (rodar uma vez):**
```sql
ALTER TABLE b2c_sessoes ADD COLUMN IF NOT EXISTS link_pendente TEXT DEFAULT NULL;
```

**PASSO 2 — Git push:**
```bash
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add -A
git commit -m "feat: Link Guardian (Hook 0) + fix nova_sessao turnos + quiz proativo + superprova KB especifico"
git push origin main
```

| Item | Arquivos | Status |
|------|----------|--------|
| Router Fixes (fb4e84a) | `server/src/core/router.ts` + PSICO.md | Commitado, push pendente |
| EmptyState buttons | `web/src/components/EmptyState.tsx` | Push pendente |
| MODO PAI dois estados | `server/src/core/context.ts` + 16 personas | Push pendente |
| CLAUDE.md organogram | `CLAUDE.md` | Push pendente |
| Universal Method completo | 16+ arquivos personas + message.ts + QuizCard + ChatContext | Push pendente |
| Fix nova_sessao turnos | `server/src/db/persistence.ts` | Push pendente |
| Quiz proativo 16 arquivos | 8 heróis × 2 pastas | Push pendente |
| Super Prova KB específico | `message.ts` + `response-processor.ts` | Push pendente |
| Link Guardian (Hook 0) | `detect-url.ts` + `investigar-link.ts` + `message.ts` + `supabase.ts` + `persistence.ts` | Push pendente + SQL migration |

---

## CONTEXTO CRÍTICO PARA BOOT

- App: `https://independent-eagerness-production-7da9.up.railway.app`
- Conta: `leon@pense-ai.com` / senha `3282` / PIN responsável: `3282`
- Layla: 7º ano | aluno_id: `0fb1c38f-7d34-45b1-8ff2-3e5c4ccff71e`
- Maria Paz: 3º ano | aluno_id: `6fa15ba4-38e8-4628-9b51-e0a3076d631a`
- Tabela de uso: `b2c_uso_diario` — resetar antes de cada fluxo de QA
- Repo: `https://github.com/Leonmala/super-agentes-b2c`
- LLM dev: Gemini 2.5 Flash (`GOOGLE_API_KEY`)
- LLM prod: Kimi K2.5 (Moonshot AI)

---

## AGENDA SUGERIDA — 2026-04-14 (Terça)

1. **Push geral** (todos os commits acumulados) via Escape Hatch no Windows
2. **QA sessão real com Layla** — validar os 3 fixes:
   - Reconexão: GAIA mantém contexto (turnos preservados)
   - Quiz proativo: GAIA oferece quiz quando percebe compreensão
   - KB específica: logs Railway devem mostrar tema específico no Hook 1
3. **Monitorar logs** (Railway) por 15min após push
4. **SEO + site de vendas** — retomar planejamento (pendente desde 2026-04-07)
