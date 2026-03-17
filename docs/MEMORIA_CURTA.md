# MEMÓRIA CURTA — Última Atividade (Ralph Loop Snapshot)

> **Propósito:** Snapshot do estado imediato. Lido PRIMEIRO em qualquer reinicialização (Boot do Ralph Loop).
> **Última atualização:** 2026-03-17 (Bloco H — Disjuntores Arquiteturais)

---

## Estado Imediato

**Fase atual:** Bloco H COMPLETO — 5 disjuntores instalados, 9/9 testes, TypeScript 0 erros, migration Supabase aplicada
**Status:** Código no mount, PRECISA de push + deploy. URL Railway: `https://independent-eagerness-production-7da9.up.railway.app`
**Próximo:** (1) Push via Claude Code CLI, (2) Deploy + validação prod, (3) PE1: Botão "+" para fotos/câmera

## Último Slice Completado

**Slice:** Bloco H — Disjuntores Arquiteturais (2026-03-17)

**Bugs corrigidos:**
- **Bug #37**: PSICO JSON truncado por maxOutputTokens → cascata morria → JSON raw enviado ao aluno
- **Bug #38**: Herói JSON com aspas malformadas → JSON.parse falha → JSON raw exposto ao pai
- **Bug #39**: Backend nunca processava `sinal_psicopedagogico`, `motivo_sinal`, `observacoes_internas` dos heróis

**O que foi feito:**

### response-processor.ts (NOVO — pipeline central)
- Pipeline de 4 camadas: JSON.parse → markdown block → regex fallback → texto puro
- Sanitizador INCONDICIONAL — SEMPRE remove resíduos JSON antes de enviar ao aluno
- Fallback messages amigáveis por persona (10 personas + DEFAULT)
- Interfaces: `ProcessedResponse`, `SinaisPedagogicos`, `IntencaoCascata`
- 9/9 testes unitários passando

### llm.ts (MODIFICADO)
- Import `processarRespostaLLM` do response-processor
- `RespostaLLM` interface: `jsonData?: any` → `processed: ProcessedResponse`
- Nova interface `ResultadoStream` com `processed`
- maxOutputTokens: PSICO 3000→8000, heróis 3000→4000
- `chamarLLM` e `chamarLLMStream` usam pipeline processado
- Removidas `extrairTextoDoJSON()` e `extrairJSONouTexto()` (absorvidas pelo processor)
- `err: any` → `err: unknown` (TypeScript strict)

### message.ts (MODIFICADO)
- Import `ResultadoStream` e `SinaisPedagogicos`
- CASO A (PSICO cascata): usa `processed.cascata` em vez de `respostaJSON`
- CASO B (herói direto): captura `sinaisHeroi` do resultado
- Ambos caminhos logam SINAL PSICOPEDAGÓGICO quando detectado
- Persistência passa `sinaisHeroi` para `persistirTurno()`

### persistence.ts (MODIFICADO)
- `persistirTurno` aceita `sinais?: SinaisPedagogicos | null`
- Persiste: `sinal_psicopedagogico`, `motivo_sinal`, `observacoes_internas`
- Nova função `buscarSinaisAluno()` para SUPERVISOR

### supabase.ts (MODIFICADO)
- Interface `Turno`: 3 novos campos

### Migration Supabase
- 3 colunas em `b2c_turnos`: `sinal_psicopedagogico` (BOOLEAN), `motivo_sinal` (TEXT), `observacoes_internas` (TEXT)
- Índice parcial `idx_b2c_turnos_sinais` para consultas do SUPERVISOR

## Próximo Passo Exato

1. **Push via Claude Code CLI** — tudo no mount, pronto para commit
2. **Deploy Railway** — validar que disjuntores funcionam em prod
3. **PE1: Botão "+"** para fotos/câmera
4. **PF1: Brainstorm NotebookLM** com Leon

## Contexto Crítico Para Boot

- Supabase: ahopvaekwejpsxzzrvux (9 tabelas b2c_ + 3 novas colunas em b2c_turnos + índice parcial)
- MCP: usar `mcp__0150fe87` para Supabase (não `mcp__supabase`)
- Server backend: porta 3001, TypeScript strict, ESM modules
- Frontend: Vite 6.3.5 + React 19 + Tailwind 4 + Plus Jakarta Sans
- Testes: Gate 1-5 ✅, Bloco H 9/9 ✅, TypeScript 0 erros ✅
- Deploy: Railway — PRECISA push + deploy
- Repo GitHub: https://github.com/Leonmala/super-agentes-b2c
- Família teste: leon@pense-ai.com / 3282 (Layla 7ª, Maria Paz 3ª)
- **Logo correto:** `LogoPenseAI.png` (cubo 3D "Pense AI!") — NÃO usar `logo-penseai.png`
