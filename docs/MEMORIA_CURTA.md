# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-13 (Teste em produção — bugs críticos corrigidos)

---

## Estado Imediato

**Fase atual:** App testada em produção (Railway) por Leon e filhas. 4 bugs de produção corrigidos.
**Status:** App FUNCIONANDO em produção. Meninas testando no celular.
**Próximo:** Fase 5 (Landing page, Checkout Mercado Pago, Onboarding) + Fase 2.5 (PROFESSOR_IA)

## Último Slice Completado

**Slice:** Bugs de produção descobertos no teste real com usuários (Leon + Layla + Maria Paz)

**O que foi feito nesta sessão:**
1. **Criação de usuário real no Supabase:**
   - Família Malatesta (plano familiar, 3 filhos, 3 dispositivos)
   - Leon (pai): leon@pense-ai.com, senha: 3282, PIN: 3282
   - Layla Estefan Malatesta: 12 anos, 7ª série (ID: 0fb1c38f-7d34-45b1-8ff2-3e5c4ccff71e)
   - Maria Paz Estefan Malatesta: 7 anos, 3ª série (ID: 6fa15ba4-38e8-4628-9b51-e0a3076d631a)
   - Família ID: 36b55aa5-3da9-4d28-b560-d0f4b59678d3

2. **Bug fix: Personas não encontradas em produção (CRÍTICO)**
   - Causa: `tsc` não copia `.md` para `dist/`. `carregarPersona()` usava `__dirname` relativo.
   - Fix: `build:server` agora faz `tsc && cp -r src/personas dist/personas`

3. **Bug fix: JSON bruto na tela do aluno (CRÍTICO)**
   - Causa: LLM retornava `mensagem_ao_aluno` em vez de `resposta_para_aluno`. Extrator não conhecia o campo.
   - Fix: `extrairTextoDoJSON()` com 9 campos possíveis em ordem de prioridade.

4. **Bug fix: Cascata PSICO→Herói falhava (CRÍTICO)**
   - Causa: LLM usava `agente_destino: "VERBETA"` em vez de `heroi_escolhido: "VERBETTA"`.
   - Fix: Extração robusta de herói (4 campos), fuzzy match de nomes (`normalizarNomeHeroi()`),
     extração robusta de plano (3 campos) e instruções (3 campos + string/objeto).

5. **Bug fix: Limite de 5 turnos atingido após 5 mensagens**
   - Causa: `incrementarTurnoCompleto()` chamado em toda mensagem.
   - Fix: Turno completo só incrementa em troca de matéria.

6. **UX melhorias implementadas (sessão anterior):**
   - Markdown rico (remark-gfm: tabelas, strikethrough, etc.)
   - CSS para `.chat-bubble-content` (tabelas, código, blockquotes, listas, headings)
   - Typing effect (`useTypingEffect` hook: 3 chars/25ms, pausa 400ms entre parágrafos)
   - Logo login aumentado (h-16 → h-32)

## Próximo Passo Exato

1. **Fase 5** → Landing page + Checkout Mercado Pago + Onboarding
2. **Fase 6** → Deploy final + E2E
3. **Fase 2.5** → Workshop PROFESSOR_IA (último)

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ criadas ✅)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 18 + Tailwind + remark-gfm + useTypingEffect
- Testes: Gate 1 (21/21) ✅, Gate 2 (13/13) ✅, Gate 3 smoke (6/6) ✅, Gate 4 (12/12) ✅, Gate 5 E2E (14/14) ✅
- Deploy: Railway FUNCIONANDO ✅ — App testada por Leon e filhas no celular
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Família teste: leon@pense-ai.com / 3282 (Layla 7ª, Maria Paz 3ª)
