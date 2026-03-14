# Bloco A — Bugs Críticos (Polimento Pré-Venda)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 3 bugs críticos identificados no teste de produção com Layla: JSON vazando no stream dos heróis, Vector invadindo conversa de ciências, e logo do herói ilegível no header.

**Architecture:** Todos os fixes são cirúrgicos — modificam lógica existente sem alterar a arquitetura GESTOR+personas. O fix de streaming muda a estratégia de buffer-and-extract. O fix de routing implementa sistema de anti-keywords (blocklist) para resolver colisões de termos ambíguos de forma extensível. O fix de logo é puramente CSS.

**Tech Stack:** TypeScript (server), React + Tailwind (web)

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `server/src/core/llm.ts` | Modificar (linhas 121-150) | Fix streaming JSON detection — buffer completo + extract |
| `server/src/core/router.ts` | Modificar | Implementar sistema de anti-keywords (blocklist) + corrigir 'trabalho' |
| `web/src/components/ChatHeader.tsx` | Modificar (linha 41) | Logo herói h-12 → h-16 (igualar buble) |

---

## Chunk 1: Bug Fixes

### Task 1: Fix JSON Leaking in Hero Stream

**Problema:** `chamarLLMStream` tenta detectar JSON olhando se `rawAcumulado` começa com `{`. Falha quando: (a) LLM emite whitespace/newline antes do `{`, (b) JSON começa mid-stream após texto, (c) detecção funciona mas extração falha e envia raw JSON.

**Solução:** Mudar para estratégia "buffer completo + extract no final". O `useTypingEffect` no frontend já cria animação gradual, então enviar o texto limpo de uma vez ao final do stream mantém a UX de digitação.

**Files:**
- Modify: `server/src/core/llm.ts:115-168` (função `chamarLLMStream`)

- [ ] **Step 1: Reescrever chamarLLMStream com buffer completo**

Substituir o bloco de streaming (linhas 121-150) por:

```typescript
    let rawAcumulado = ''

    for await (const chunk of result.stream) {
      const texto = chunk.text()
      if (!texto) continue
      rawAcumulado += texto
    }

    // Extrair texto limpo — funciona tanto para JSON quanto para texto puro
    const parsed = extrairJSONouTexto(rawAcumulado, persona)
    const textoLimpo = parsed.texto

    if (textoLimpo) {
      onChunk(textoLimpo)
    }
```

Este bloco substitui as linhas 121-150 do `chamarLLMStream`. Remove toda a lógica de `jsonDetectado`/`bufferJSON` e envia o texto limpo de uma única vez ao final.

- [ ] **Step 2: Build e verificar compilação**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2 && cd server && npx tsc --noEmit`
Expected: 0 erros

- [ ] **Step 3: Commit**

```bash
git add server/src/core/llm.ts
git commit -m "fix: buffer completo no stream — elimina JSON leaking para heróis"
```

---

### Task 2: Sistema de Anti-Keywords + Fix Vector Invading Ciências

**Problema:** `KEYWORDS_FISICA` contém `'trabalho'` que em português escolar significa "lição de casa", não o conceito físico. "Trabalho de ciências" ativa VECTOR. A solução pontual (trocar keyword) não escala — colisões vão continuar aparecendo com uso real.

**Solução (ideia do Leon):** Implementar sistema de anti-keywords (blocklist) por tema. Cada conjunto de keywords ganha uma lista de expressões que, quando presentes na mesma mensagem, cancelam o match. Extensível: conforme testes revelam colisões, basta adicionar anti-keywords sem mexer na lógica.

**Files:**
- Modify: `server/src/core/router.ts` (estrutura de keywords + função detectarTema)

- [ ] **Step 1: Criar estrutura de tema com keywords + anti-keywords**

Adicionar interface e refatorar os arrays de keywords para objetos que incluem blocklist:

```typescript
interface TemaConfig {
  keywords: string[]
  antiKeywords: string[]  // Se presentes na mensagem, cancelam o match
}
```

Criar `ANTI_KEYWORDS_FISICA`:
```typescript
const ANTI_KEYWORDS_FISICA = [
  'trabalho de ciências', 'trabalho de ciencias',
  'trabalho de história', 'trabalho de historia',
  'trabalho de português', 'trabalho de portugues',
  'trabalho de geografia', 'trabalho de quimica', 'trabalho de química',
  'trabalho de inglês', 'trabalho de ingles',
  'trabalho de casa', 'trabalho escolar', 'trabalho da escola',
]
```

- [ ] **Step 2: Refatorar detectarTema para usar anti-keywords**

Modificar a função `detectarTema` para checar anti-keywords antes de confirmar match:

```typescript
const matchKeywordComBloqueio = (keywords: string[], antiKeywords: string[]) => {
  const temMatch = keywords.some(k => msg.includes(k) || msgSemAcento.includes(removerAcentos(k)))
  if (!temMatch) return false
  const bloqueado = antiKeywords.some(ak => msg.includes(ak) || msgSemAcento.includes(removerAcentos(ak)))
  return !bloqueado
}
```

- [ ] **Step 3: Aplicar anti-keywords a KEYWORDS_FISICA (caso 'trabalho')**

Trocar a checagem de física para usar a nova função com blocklist. Os outros temas começam com anti-keywords vazias (`[]`), extensíveis conforme necessidade.

- [ ] **Step 4: Build e verificar compilação**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2 && cd server && npx tsc --noEmit`
Expected: 0 erros

- [ ] **Step 5: Commit**

```bash
git add server/src/core/router.ts
git commit -m "feat: sistema de anti-keywords no router — resolve colisão 'trabalho' física/ciências"
```

---

### Task 3: Fix Hero Logo Height no Header

**Problema:** Logo do herói no header está com `h-12` (48px) enquanto o buble está com `h-16 w-16` (64px). O logo fica diminuto e ilegível.

**Solução:** Mudar `h-12` para `h-16` na tag img do logo, igualando a altura do buble.

**Files:**
- Modify: `web/src/components/ChatHeader.tsx:41`

- [ ] **Step 1: Ajustar altura do logo**

Na linha 41, mudar `h-12` para `h-16`:

```tsx
              className="h-16 object-contain shrink-0"
```

- [ ] **Step 2: Verificar build frontend**

Run: `cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2 && cd web && npx tsc --noEmit`
Expected: 0 erros

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ChatHeader.tsx
git commit -m "fix: logo herói no header h-12 → h-16 (igualar altura do buble)"
```

---

## Verificação Final

- [ ] **Build completo do projeto**

```bash
cd /sessions/bold-jolly-cori/mnt/SuperAgentes_B2C_V2
npm run build
```
Expected: Build sem erros

- [ ] **Atualizar docs de memória (Ralph Loop PERSIST)**

Atualizar MEMORIA_CURTA.md, CHECKLIST_PROJETO.md, LOG_ERROS.md com os 3 fixes.
