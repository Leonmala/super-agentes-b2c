# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-13 (madrugada — pós-implementação Fase 3)

---

## Estado Imediato

**Fase atual:** Deploy Railway (entre Fase 3 e Fase 4)
**Status:** Fases 1-3 completas. Primeiro deploy Railway falhou por Node.js 22.11 < 22.12 (requisito Vite 8) + rolldown native binding.
**Fix aplicado:** `.node-version`, `nixpacks.toml`, engines >=22.12.0, `--include=optional` no install.
**Aguardando:** Push via Claude Code CLI + redeploy Railway.

## Último Slice Completado

**Slice:** Fix deploy Railway — Node.js version + rolldown bindings
**O que foi feito:**
- Criado `.node-version` (22) para Nixpacks
- Criado `nixpacks.toml` com nodejs_22
- Atualizado engines no root package.json para >=22.12.0
- Adicionado `--include=optional` no install:all (garante @rolldown/binding-linux-x64-gnu)
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Deploy automático: Railway (conectado ao repo)

## Próximo Passo Exato

1. **Push fix via Claude Code CLI** → Leon roda prompt no terminal local
2. **Railway redeploy automático** → verificar se build passa
3. **Se OK:** testar app em produção (URL Railway)
4. **Fase 2.5** → Workshop PROFESSOR_IA
5. **Fase 4** → CRON, Qdrant, Limites

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ criadas ✅)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: porta 5173 (dev), proxy configurado para :3001
- Testes backend: Gate 1 (21/21) ✅, Gate 2 (13/13) ✅
- Testes frontend: Gate 3 smoke (6/6) ✅
- Imagens heróis: `web/public/heroes/[heroi]_buble.png`, `[heroi]-card.png`, `[heroi]-logo.png`, `[heroi]-limpo.png`
- Logos institucionais: `web/public/logo.png` (retangular), `web/public/logo-buble.png` (circular amarelo)
- CLAUDE.md contém Ralph Loop completo — seguir protocolo

## Arquivos Frontend Criados

```
web/
├── package.json, tsconfig.json, vite.config.ts, tailwind.config.js
├── index.html
├── public/
│   ├── logo.png, logo-buble.png
│   └── heroes/ (31 arquivos de imagens)
└── src/
    ├── main.tsx, App.tsx
    ├── types.ts, constants.ts
    ├── api/ (client.ts, auth.ts, chat.ts)
    ├── contexts/ (AuthContext.tsx, ChatContext.tsx)
    ├── components/ (10 componentes)
    ├── pages/ (LoginPage.tsx, ChatPage.tsx)
    └── __tests__/ (setup.ts, gate3-smoke.test.tsx)
```
