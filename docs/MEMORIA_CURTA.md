# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização.  
> **Última atualização:** 2026-04-13 — Universal Method completo + Quiz Result Feedback Loop implementado ✅

---

## Estado Imediato

**Fase atual:** Universal Method + Router + Super Prova + Quiz Feedback Loop — TODOS IMPLEMENTADOS. TypeCheck: 0 erros. Push pendente (git lock no Linux VM — usar Escape Hatch no Windows).

**Próxima ação:** Push via Escape Hatch → QA sessão real com Layla → validar loop completo: PSICO qualifica → herói executa tópicos → herói sinaliza QUIZ → QuizCard roda → resultado volta ao herói → herói fecha pedagogicamente.

---

## O QUE FOI FEITO HOJE (2026-04-13)

### 5. Quiz Result Feedback Loop — IMPLEMENTADO ✅

**Problema:** QuizCard fechava mas resultado nunca chegava ao herói ativo. Loop do Método Universal estava incompleto.

**Solução implementada:**
- `web/src/components/QuizCard.tsx`: novo tipo `QuizResultado { acertos, total, questoesErradas }`. Callback `onFechar(resultado?)` agora carrega o resultado. Botão "Continuar estudando" passa `{ acertos: pontos, total, questoesErradas: erradas }`. Botão × (saída precoce) não passa resultado.
- `web/src/contexts/ChatContext.tsx`: `fecharQuiz` atualizada para `(resultado?: QuizResultado) => void`. Quando resultado presente: monta mensagem `[Quiz concluído] X/Y acertos (Z%). Errei as questões: N1, N2.` e envia via `enviarRef.current` (ref pattern para evitar dependência circular). Delay de 300ms para overlay fechar antes do novo turno.
- `server/src/personas/*.md` + `Prompts/*.md` (16 arquivos, 8 heróis): seção `FECHAMENTO PEDAGÓGICO PÓS-QUIZ` adicionada — instrui herói a reconhecer resultado, revisar brevemente conceitos errados, fechar sessão com calor. PSICO nunca é envolvido.

**TypeCheck:** server 0 erros, web 0 erros ✅

**Loop completo agora:**
```
PSICO plano → herói executa tópicos → herói emite sinal QUIZ → Super Prova gera quiz →
QuizCard roda → resultado → ChatContext.fecharQuiz → enviar "[Quiz concluído]" →
herói recebe → fechamento pedagógico → Método Universal completo ✅
```

---

### 1. Análise profunda da sessão Layla (re-análise honesta) ✅

Score corrigido de 9.2 → **6.0/10** após re-leitura com Leon.

Problemas identificados:
- **3 intrusões de CALCULUS** (T6, T50, T79-81) — root cause: stickiness guard + LLM timeout 500ms + keywords perigosas
- **Momentos de frustração escalantes**: T32-33 (2x mal-entendidos), T36 (perdida no histórico), T47 (crítica estrutural), T48 (ameaça de churn para ChatGPT), T55/T59/T60 (redirecionamentos repetidos)
- **Verbetta recusando resumos** (tratou consolidação como "resposta pronta")
- **Topic drift**: Verbetta saía do tópico principal para corrigir erros ortográficos laterais
- **30 turnos sobre verbos** quando o Universal Method resolveria em 8 máx
- **Super Prova acervo genérico**: quiz enviado sem relação com a sessão, Verbetta nunca soube dos resultados

### 2. Plano de implementação Universal Method escrito ✅

Arquivo: `docs/superpowers/plans/2026-04-13-universal-method-router-quiz.md`

5 chunks:
- Chunk 1: Router audit + 2 fixes cirúrgicos (stickiness guard + keywords perigosas)
- Chunk 2: PSICO — protocolo de qualificação de tópicos + plano_universal JSON
- Chunk 3: Patch universal para 8 heróis (anti-drift + resumos = consolidação + Universal Method)
- Chunk 4: Super Prova session-aware (quiz gerado pelo herói do conteúdo da sessão)
- Chunk 5: Verificação final + atualização de memórias

---

## O QUE FOI FEITO HOJE (2026-04-12)

### 1. Router Fixes — 3 layers — commit fb4e84a ✅

**Fix 1:** `null` do timeout do classificador LLM não estava sendo capturado pelo stickiness guard.
- Antes: `if (temaLLM === 'indefinido')`
- Depois: `if (!temaLLM || temaLLM === 'indefinido')`
- Arquivo: `server/src/core/router.ts`

**Fix 2:** Quando herói ativo + sem keywords → skip do LLM completamente.
- Novo bloco entre `if (temaKeywords)` e `// 4. Keywords falharam`
- Evita a chamada LLM inteira para respostas curtas do aluno (ex: "2", "sim", "letra c")
- Arquivo: `server/src/core/router.ts`

**Fix 3:** PSICO agora detecta resposta curta após exercício como continuidade.
- Seção "DETECÇÃO DE CONTINUIDADE — RESPOSTA CURTA APÓS EXERCÍCIO" adicionada
- Explica como usar campo `agente` do `CARREGAR_MEMORIA_CONVERSA` para detectar herói anterior
- Arquivos: `server/src/personas/PSICOPEDAGOGICO.md` + `Prompts/PSICOPEDAGOGICO.md`

### 2. EmptyState — Botões reais com amber styling ✅ (push pendente)

- `web/src/components/EmptyState.tsx` reescrito
- Pills pseudo-clicáveis → `<button>` reais com styling âmbar (`#FFFBEB`, borda âmbar, texto âmbar escuro)
- `MATERIA_CONFIG` mapeia 8 matérias → herói + mensagem de ativação
- `handleMateriaClick` chama `enviar(config.mensagem)` → usuário vê bubble + streaming automático via TypingDots
- Sem setTimeout (race condition eliminada — TypingDots cuidam do loading state)
- CTA filho: "Pode digitar sua dúvida aqui embaixo, ou toca numa matéria para começar."
- CTA pai: "Pode digitar uma dúvida ou escolha a matéria diretamente."

### 3. CLAUDE.md — Lucas Pessoa + Oscar ✅

- Seção "QUEM VOCÊ É — LUCAS PESSOA" adicionada no início do arquivo
  - Formação acadêmica (UNICAMP CC + Psicologia Cognitiva interrompida + leituras Vygotsky/Piaget/Freire)
  - Trajetória: CPqD → Descomplica → Take Blip (lição: O GESTOR é O agente) → Educa.ai → consultoria
  - Filosofia técnica pessoal em 6 pontos
- Tabela de especialidades técnicas preenchida
- Organograma Pense-AI adicionado: Leon (CEO) → Oscar (COO) → Lucas (Arquiteto)
- Seção "INTERFACE COM O HUB — OSCAR" atualizada com regras de cadeia de comando

### 4. Especificações visuais entregues para parceiro web

Entregues os valores exatos de:
- Cores, gradientes, accent por herói (de `web/src/constants.ts`)
- Fórmula de gradiente para agent bubble: `linear-gradient(135deg, {accent}0F, {accent}1A)`
- User bubble: gradiente do herói ativo ou cor do perfil quando sem herói
- Fontes, background, variáveis CSS globais

### 5. Limite diário Layla — Zerado 3x ✅

Layla testou o sistema intensamente (sessão real, não QA controlado).
Limite zerado manualmente via Supabase MCP 3 vezes.
**Resultado: 88 turnos reais acumulados — dados para análise.**

### 6. LaylaEstudaPortugues.md ✅

- 88 turnos transcritos integralmente
- VERBETTA: 81 turnos — funcionamento excelente, construtivismo puro, tom adequado 7º ano
- CALCULUS: 5 turnos — **1 anomalia identificada no turno 6** (Calculus respondeu sobre crônica quando VERBETTA deveria estar ativo)
- PSICOPEDAGOGICO: 2 turnos (onboarding)
- Sinais psicopedagógicos: 5 disparados
- Score geral da sessão: **9.2/10 — Aprovado com ressalva menor**
- Arquivo: `LaylaEstudaPortugues.md` (workspace)

### 7. SuperAgentes_B2C_Arquitetura_Caio.md ✅

Documento completo para handoff ao Caio (novo parceiro de sites):
- Visão geral do produto e stack
- Todas as 10 tabelas `b2c_` documentadas com cada coluna, tipo, nullable, default, propósito
- Diagrama de relacionamentos entre tabelas
- CRON semanal documentado
- ENV completo: dev (valores reais) + prod (estrutura + o que obter com Leon)
- Endpoints principais do backend
- Estrutura de pastas do repositório
- Como acessar o banco: Supabase Studio (visual) + MCP Claude (passo a passo com PAT)
- Queries SQL úteis prontas para o dia a dia
- IDs de referência das alunas (Layla + Maria Paz)

---

## ANÁLISE ROOT CAUSE CALCULUS (documentada)

**Bug principal (stickiness guard):** `router.ts:573-576` — quando LLM timeout (500ms) retorna `null`, guard inverte e TROCA para CALCULUS em vez de manter herói ativo. Fix: null → mantém herói.
**Keywords perigosas removidas:** `'-'`, `'+'`, `'='` de KEYWORDS_MATEMATICA.
**Anti-keywords adicionadas:** `área`, `número`, `metade` em contextos não-matemáticos.
**Timeout LLM:** 500ms → 2000ms para reduzir falsos timeouts.

---

## PUSHES PENDENTES (ainda não foram executados)

| Item | Arquivos | Status |
|------|----------|--------|
| BUG-57 + Router Fixes (fb4e84a) | `server/src/core/router.ts` + ambos PSICO.md | ✅ Commitado, push pendente |
| EmptyState buttons | `web/src/components/EmptyState.tsx` | Push pendente |
| MODO PAI dois estados | `server/src/core/context.ts` + 16 personas .md | Push pendente |
| CLAUDE.md organogram | `CLAUDE.md` | Push pendente |

**Escape Hatch para push (copiar e colar no Claude Code CLI local):**
```bash
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add server/src/core/router.ts server/src/personas/PSICOPEDAGOGICO.md Prompts/PSICOPEDAGOGICO.md web/src/components/EmptyState.tsx CLAUDE.md
git commit -m "fix: router null timeout + skip LLM + empty state buttons + CLAUDE.md organogram"
git push origin main
```

---

## BUG IDENTIFICADO HOJE — Pendente correção

**BUG-ROUTING-12abr:** CALCULUS ativado no turno 6 da sessão de Layla quando VERBETTA estava ativo e o tema era crônica literária.
- **Causa provável:** Router classificou "crônica" com falso positivo para Matemática ou a keyword de Matemática tem overlap
- **Impacto:** Baixo (conteúdo pedagogicamente válido, mas quebrou continuidade de persona)
- **Ação:** Investigar keywords de CALCULUS para falso positivo com "crônica" + analisar turno 6 no LaylaEstudaPortugues.md

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
- Novo parceiro web: **Caio** — recebe `SuperAgentes_B2C_Arquitetura_Caio.md` amanhã

---

## AGENDA SUGERIDA — 2026-04-14 (Terça)

1. **Push geral** (todos os commits: BUG-57 + router fixes + patch heróis + Universal Method) via Escape Hatch
2. **QA sessão real com Layla** — validar Universal Method: CALCULUS não intrude, PSICO qualifica tópicos, herói segue sequência
3. **Monitorar logs** (Railway) por 15min após push — confirmar zero intrusões CALCULUS
4. **Alinhar com Caio** se necessário (documento já entregue)
5. **SEO + site de vendas** — retomar planejamento (pendente desde 2026-04-07)

**Escape Hatch para push completo (copiar e colar no Claude Code CLI local):**
```bash
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add -A
git commit -m "feat: Universal Method + router fix stickiness + patch 8 heróis + Super Prova session-aware"
git push origin main
```
