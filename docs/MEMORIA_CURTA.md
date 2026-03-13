# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-13 (sessão deploy + visual polish)

---

## Estado Imediato

**Fase atual:** Entre Fase 3 e Fase 4 — Deploy Railway FUNCIONANDO ✅
**Status:** App rodando em produção no Railway. Interface visual aprovada pelo Leon.
**Fase 2.5:** ADIADA — Workshop PROFESSOR_IA será com Leon descansado.
**Próximo:** Fase 4 (CRON, Qdrant, Limites)

## Último Slice Completado

**Slice:** Deploy Railway + Visual Polish
**O que foi feito:**
- Fix deploy Railway: downgrade Vite 8→6.3.5 (eliminou rolldown + Node version issue)
- Variáveis de ambiente configuradas no Railway
- App rodando em produção ✅
- Visual polish aprovado pelo Leon:
  - Sistema de cores por perfil: pai=azul (#2563EB), filhos=paleta vibrante (amarelo/vermelho/verde/laranja/roxo/ciano)
  - Header e SlideMenu com fundo colorido do perfil ativo
  - Logo retangular (logo.png) no header (h-16) e menu (h-12)
  - Menu items em cards brancos arredondados
  - ChatBubble do agente com tint da cor do herói (15% opacidade)
  - ProfileModal com cores casando (FILHO_COLORS por índice)
  - Bug fix: Professor IA só visível para ensino médio e pai (antes aparecia para todos)
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Deploy automático: Railway (conectado ao repo)

## Próximo Passo Exato

1. **Push visual polish** → Claude Code CLI (ProfileModal + ChatHeader + SlideMenu + constants + AuthContext + docs)
2. **Fase 2.5** → Workshop PROFESSOR_IA (sessão colaborativa com Leon)
3. **Fase 4** → CRON semanal, Qdrant embeddings, Limites, Dispositivos simultâneos

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ criadas ✅)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 18 + Tailwind (downgraded de Vite 8 para fix Railway)
- Testes: Gate 1 (21/21) ✅, Gate 2 (13/13) ✅, Gate 3 smoke (6/6) ✅
- Deploy: Railway FUNCIONANDO ✅ (variáveis de ambiente configuradas)
- CLAUDE.md contém Ralph Loop + Escape Hatch Claude Code CLI
- Sistema de cores: constants.ts → FILHO_COLORS[], PAI_COLOR, getProfileColor()
- AuthContext: perfilAtivo agora tem `filhoIndex` e `cor`
