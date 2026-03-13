# LOG DE ERROS — Super Agentes V1.0

> **Regra:** Toda vez que um teste falha ou um bug é encontrado, registrar aqui ANTES de corrigir.
> Formato: Data | Fase | Descrição | Causa raiz | Correção | Status
> **Última atualização:** 2026-03-12 22:15

---

## Erros Resolvidos

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 1 | 2026-03-12 | Pré-execução | Supabase MCP conectado ao projeto errado (yoxbjkwrpyktdubvcbat) | MCP não configurado para Super Agentes | Descoberto MCP alternativo (0150fe87) que vê o projeto correto | ✅ Resolvido |
| 2 | 2026-03-12 | Pré-execução | Nome VERBETA (1 T) no teste6 vs VERBETTA (2 T) nos prompts | Typo no código original | Padronizado para VERBETTA em todo o código V1 | ✅ Resolvido |
| 3 | 2026-03-12 | Gate 1 | this.timeout(45000) não funciona no Node test runner | Mocha syntax vs Node test runner | Usar `{ timeout: 60000 }` como segundo arg do it() | ✅ Resolvido |
| 4 | 2026-03-12 | Gate 1 | Testes de router retornam PSICOPEDAGOGICO em vez de heróis | Fluxo cascata: tema novo → PSICO primeiro (by design) + últimos 3 turnos insuficientes | Seed turnos prévios + buscar 10 turnos ao invés de 3 | ✅ Resolvido |
| 5 | 2026-03-12 | Gate 1 | Contaminação de estado entre suites de teste | Testes SSE modificam sessão usada pelos testes de Router | Criar aluno dedicado (seedRouterAluno) para isolamento | ✅ Resolvido |
| 6 | 2026-03-12 | Gate 1 | Done event assertion falha (status inexistente) | Done event tem agente/turno/tempo_ms, não status | Assertion corrigida para verificar agente e tempo_ms | ✅ Resolvido |

---

## Erros Resolvidos (Fase 2)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 7 | 2026-03-12 | Gate 2 | Router português falha (Round 1) — "conjugação" não em keywords | Mensagem usava termos não cobertos por KEYWORDS_PORTUGUES | Trocar mensagem para "gramática e ortografia do português" | ✅ Resolvido |
| 8 | 2026-03-12 | Gate 2 | Router português falha (Round 2) — state contamination | Turnos MODO PAI empurram seeded hero turns para fora da janela de 10 turnos | Criar seedRegressionAluno dedicado para testes de regressão | ✅ Resolvido |

## Erros Resolvidos (Deploy)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 9 | 2026-03-13 | Deploy | Railway Node.js 22.11.0 < 22.12 (req Vite 8) + rolldown binding missing | Vite 8 usa rolldown (nativo), Railway usa Docker com Node 22.11, nixpacks.toml ignorado | **Downgrade Vite 8→6.3.5** (usa esbuild, funciona com Node 18+). Também: plugin-react 6→4.3.4, vitest 4→3.2.1, TS 5.9→5.8.3 | ✅ Fix aplicado |
| 10 | 2026-03-13 | Deploy | Tentativa 1: nixpacks.toml + .node-version (não funcionou) | Railway usa Dockerfile, não Nixpacks | Removidos nixpacks.toml e .node-version. Solução real: downgrade Vite | ✅ Resolvido |

## Erros Pendentes

| # | Data | Fase | Descrição | Causa Raiz | Tentativa | Status |
|---|------|------|-----------|------------|-----------|--------|

---

## Bugs Conhecidos (não-bloqueantes)

| # | Descrição | Impacto | Prioridade |
|---|-----------|---------|------------|
| B1 | Keyword "conta" (verbo contar) match com "conta" (math) | Falso positivo no router — roteamento errado para CALCULUS | Baixa — refinar keywords com word boundaries na Fase 2 |
| B2 | "revolução" contém substring "evolução" (ciências) | Falso positivo no router — ciências detectada antes de história | Baixa — reordenar checagem ou usar regex com word boundaries |

---

## Padrões de Erro Recorrentes

_(Atualizar conforme erros se repetem)_

- **Supabase:** MCP padrão (mcp__supabase) vê projeto errado. Usar mcp__0150fe87 para Super Agentes.
- **LLM/Gemini:** PSICOPEDAGOGICO nem sempre retorna JSON correto para cascata. Mitigado com seed de turnos.
- **TypeScript:** Nenhum até agora
- **SSE:** Nenhum até agora
- **Testes:** Isolamento de estado entre suites é crítico — usar alunos/sessões dedicados por suite
