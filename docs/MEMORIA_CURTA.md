# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização.  
> **Última atualização:** 2026-04-06 (fim de sessão) — QA v1 executado, inconclusivo por limite. QA v2 desenhado. Amanhã: QA v2 sequencial por perfil + início do SEO.

---

## Estado Imediato

**Fase atual:** QA v1 executado (inconclusivo) → **QA v2 desenhado e pronto para execução** → **SEO do site de vendas planejado em paralelo**

---

## O QUE FOI FEITO HOJE (2026-04-06)

### 1. QA v1 — Executado (parcialmente)
- 5 agentes Playwright paralelos na mesma conta
- Limite de 25 interações/dia esgotado em ~20 minutos (contador compartilhado por família)
- Resultados parciais capturados
- **BUG CRÍTICO ENCONTRADO:** CALCULUS violou o método construtivista — resolveu "quanto é 2/3 + 1/4?" diretamente. Bloqueador para lançamento.
- Limite de dispositivos: aumentado para 6 durante QA, revertido para 3 e deployado ✅
- Relatório histórico do QA v1 salvo: `qa/reports/2026-04-06/qa-historico.md`

### 2. Pense-Intelligence — Melhorias implementadas
- `src/pipeline/quality_scorer.py` criado (score 0–100 por pipeline)
- `src/pipeline/failure_tracker.py` criado (loga falhas, cria item no BACKLOG após 3x)
- `src/pipeline/run.py` atualizado com calls para ambos

### 3. QA v2 — Desenhado e documentado
- Nova spec: `docs/superpowers/specs/2026-04-07-qa-v2-design.md`
- 3 fluxos sequenciais independentes: Layla → Maria Paz → PAI
- Reset automático de contador entre fluxos via Supabase
- Avaliação explícita do limite de 25 interações/dia incluída
- Melhorias de processo documentadas (construtivismo todos os heróis, timeout, JSON por turno)

---

## AGENDA DE AMANHÃ (2026-04-07)

### Prioridade 1 — QA v2 (sequencial por perfil)
Seguir spec: `docs/superpowers/specs/2026-04-07-qa-v2-design.md`

**Pré-requisitos:**
1. Verificar health check: GET `https://independent-eagerness-production-7da9.up.railway.app` → 200 OK
2. Verificar que o limite de dispositivos está em 3 (já revertido)
3. Corrigir BUG CRÍTICO primeiro: CALCULUS está resolvendo problemas diretamente — revisar `server/src/personas/CALCULUS.md` e `Prompts/CALCULUS.md` para reforçar o método construtivista antes de rodar o QA

**Execução:**
- Fluxo 1: Layla → reset contador → bateria completa → relatório `qa/reports/2026-04-07/layla-report.md`
- Fluxo 2: Maria Paz → reset contador → bateria completa → relatório `qa/reports/2026-04-07/mariapaz-report.md`
- Fluxo 3: PAI → reset contador → bateria completa → relatório `qa/reports/2026-04-07/pai-report.md`
- Consolidado: `qa/reports/2026-04-07/consolidado.md`

**Reset de contador antes de cada fluxo:**
```sql
-- Layla:
UPDATE b2c_uso_diario SET interacoes = 0 WHERE aluno_id = '0fb1c38f-7d34-45b1-8ff2-3e5c4ccff71e' AND data = CURRENT_DATE;
-- Maria Paz:
UPDATE b2c_uso_diario SET interacoes = 0 WHERE aluno_id = '6fa15ba4-38e8-4628-9b51-e0a3076d631a' AND data = CURRENT_DATE;
```

### Prioridade 2 — SEO do site de vendas SuperAgentes
**Contexto:** O site de vendas do SuperAgentes ainda não existe como página standalone. A estratégia de SEO precisa ser planejada antes de criar o site.

**Escopo do SEO:**
- Pesquisa de mercado: quem são os concorrentes no segmento de edtech B2C Brasil?
- Keywords: pais procuram por quê? ("tutoria IA para filhos", "professor IA", "ajuda lição de casa IA"?)
- Posicionamento: SuperAgentes vs. concorrentes (método construtivista é diferencial real)
- Arquitetura do site de vendas: quantas páginas, quais CTAs, qual estrutura

**Ferramenta:** Pense-Intelligence pipeline para análise de concorrentes + Ahrefs MCP para keywords

---

## Contexto Crítico Para Boot

- App: `https://independent-eagerness-production-7da9.up.railway.app`
- Conta: `leon@pense-ai.com` / senha `3282` / PIN responsável: `3282`
- Layla: 7º ano | aluno_id: `0fb1c38f-7d34-45b1-8ff2-3e5c4ccff71e`
- Maria Paz: 3º ano | aluno_id: `6fa15ba4-38e8-4628-9b51-e0a3076d631a`
- Tabela de uso: `b2c_uso_diario` — resetar antes de cada fluxo de QA
- Limite dispositivos: 3 (já revertido, em produção) ✅
- Repo: `https://github.com/Leonmala/super-agentes-b2c`
- LLM: `@google/generative-ai` nativo (não OpenAI compat) — variável: `GOOGLE_API_KEY`

---

## BUG ABERTO — Bloqueador de Lançamento

**BUG-QA-003 (MAIOR):** CALCULUS resolve problemas matemáticos diretamente em vez de guiar.  
**Input:** "quanto é 2/3 + 1/4?" com CALCULUS ativo em MODO FILHO  
**Output:** Explicou MMC e resolveu o problema completo passo a passo  
**Esperado:** Pergunta guiada ("Para somar frações, precisamos de uma coisa em comum. O que você acha que é?")  
**Arquivo:** `server/src/personas/CALCULUS.md` + `Prompts/CALCULUS.md`  
**Fix:** Adicionar instrução explícita no prompt: quando aluno fizer pergunta direta com resultado numérico único, CALCULUS NUNCA fornece o resultado — faz pergunta que leva o aluno a descobrir o próximo passo.

---

## O que NÃO fazer amanhã

- ❌ NÃO rodar QA v2 sem antes corrigir BUG-QA-003 (CALCULUS construtivismo)
- ❌ NÃO rodar QA v2 sem resetar contador antes de cada fluxo
- ❌ NÃO correr para o SEO antes de ter pelo menos o Fluxo 1 (Layla) aprovado no QA
- ❌ NÃO assumir que TEMPUS, VERBETTA, NEURON também são construtivistas — testar cada um
