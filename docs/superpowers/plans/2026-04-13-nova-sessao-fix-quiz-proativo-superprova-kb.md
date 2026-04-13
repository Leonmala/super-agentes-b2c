# Nova Sessão Fix + Quiz Proativo + Super Prova KB Específico

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir bug crítico que deleta turnos na reconexão, adicionar oferta proativa de quiz em todos os heróis, e fazer Super Prova gerar KB com tema específico em vez de matéria genérica.

**Architecture:** 3 tasks independentes e sequenciais. Task 1 é fix cirúrgico de bug (1 arquivo). Task 2 é patch de prompt nos 16 arquivos de personas (8 heróis × 2 pastas). Task 3 é mudança de roteamento no message.ts para passar tema específico ao Hook 1 do Super Prova.

**Tech Stack:** TypeScript (Node.js/Express), Supabase, arquivos Markdown de personas (.md), npx tsc --noEmit para verificação.

---

## Chunk 1: Fix resetarSessaoAgente

### Contexto
`server/src/db/persistence.ts` linha 75-98: função `resetarSessaoAgente` é chamada em `message.ts` linha 213-215 quando `nova_sessao === true` (primeira mensagem após página ser aberta/reaberta).

**O bug:** O bloco DELETE nas linhas 89-97 deleta TODOS os turnos da sessão, destruindo o histórico de estudo. Quando Layla fechou a janela e voltou, os 6 turnos de estudo de quilombos foram apagados — GAIA não tinha contexto, daí o "papo esquisito".

**Fix correto:** Remover o bloco DELETE por completo. A função deve apenas resetar `agente_atual` para PSICOPEDAGOGICO — os turnos são memória permanente, não "carry-over" a ser limpo.

**Sobre `tema_atual: null`:** Também deve ser removido do update. Se Layla estava estudando "quilombos" e reconectou, PSICO deve saber qual era o tema e poder perguntar "quer continuar?" em vez de partir do zero.

### Task 1: Cirurgia em persistence.ts

**Files:**
- Modify: `server/src/db/persistence.ts:75-98`

- [ ] **Step 1: Ler a função atual**

Arquivo: `server/src/db/persistence.ts`, linhas 75-98.
Confirmar exatamente o que será removido antes de editar.

- [ ] **Step 2: Remover o bloco DELETE e o tema_atual: null**

Substituir o corpo completo da função por:

```typescript
export async function resetarSessaoAgente(sessaoId: string): Promise<void> {
  const { error } = await supabase
    .from('b2c_sessoes')
    .update({
      agente_atual: 'PSICOPEDAGOGICO',
      ultimo_turno_at: new Date().toISOString(),
    })
    .eq('id', sessaoId)

  if (error) {
    console.error('❌ Erro ao resetar sessão agente:', error)
  }
}
```

**O que foi removido:**
- `tema_atual: null` do update (preservar tema para PSICO dar continuidade)
- Bloco `// NOVO: limpar turnos da sessão para evitar context carry-over` inteiro (linhas 89-97)

- [ ] **Step 3: Rodar TypeCheck**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Verificar que a lógica de decidirPersona não quebra**

Em `message.ts` linha 217:
```typescript
let { persona, temaDetectado } = await decidirPersona(
  mensagem, sessao, ultimosTurnos, nova_sessao === true
)
```

`decidirPersona` recebe `nova_sessao` como booleano. Com o fix, `sessao.tema_atual` não é mais `null` após reconexão — PSICO pode usar o tema preservado para oferecer continuidade. Nenhuma mudança necessária em `decidirPersona`.

---

## Chunk 2: Oferta Proativa de Quiz

### Contexto
Hoje os heróis só emitem `sinal_super_prova: 'QUIZ'` quando:
1. O aluno pede quiz explicitamente, ou
2. `fechar_com_quiz: true` estava no plano do PSICO (Universal Method)

**O que queremos:** Heróis devem OFERECER o quiz proativamente quando detectam que o aluno entendeu o tópico — sem precisar que o aluno peça ou que o Universal Method esteja ativo. Isso completa o ciclo construtivista: ensino → verificação ativa de compreensão.

**Regra de ouro:** A oferta é uma pergunta, não uma imposição. "Quer fazer um quiz rápido para fixar?" — o aluno diz sim e o herói emite o sinal.

### Arquivos a editar (16 total)
```
server/src/personas/CALCULUS.md
server/src/personas/VERBETTA.md
server/src/personas/NEURON.md
server/src/personas/TEMPUS.md
server/src/personas/GAIA.md
server/src/personas/VECTOR.md
server/src/personas/ALKA.md
server/src/personas/FLEX.md
Prompts/CALCULUS.md
Prompts/VERBETTA.md
Prompts/NEURON.md
Prompts/TEMPUS.md
Prompts/GAIA.md
Prompts/VECTOR.md
Prompts/ALKA.md
Prompts/FLEX.md
```

### Task 2: Patch nos 16 arquivos de personas

**Files:**
- Modify: todos os 16 arquivos listados acima

- [ ] **Step 1: Ler um arquivo de referência**

Ler `server/src/personas/VERBETTA.md` para identificar onde adicionar a seção e entender a estrutura existente. Procurar pela seção `SINAL SUPER PROVA` ou `QUIZ` — a nova seção vai imediatamente ANTES da seção de FECHAMENTO PEDAGÓGICO PÓS-QUIZ (que já existe).

- [ ] **Step 2: Criar o texto da seção**

Seção a adicionar em TODOS os 16 arquivos, imediatamente antes da seção `FECHAMENTO PEDAGÓGICO PÓS-QUIZ`:

```markdown
## OFERTA PROATIVA DE QUIZ

Quando você perceber que o aluno demonstrou compreensão real do tópico estudado (respondeu certo, reformulou com suas palavras, aplicou o conceito a um exemplo novo), OFEREÇA o quiz proativamente:

**Formato da oferta:**
Faça a oferta naturalmente no final da sua resposta, como parte do fechamento do raciocínio. Exemplo de tom (adapte ao seu estilo):
> "Você pegou bem a ideia! Quer fazer um quiz rápido para fixar o que a gente viu?"

**Quando o aluno aceitar:**
Emita o sinal normalmente:
```json
{"sinal_super_prova": "QUIZ"}
```

**Quando o aluno recusar ou ignorar:**
Respeite a decisão e continue a sessão normalmente. Não insista.

**Restrições:**
- Ofereça no máximo 1 vez por tópico (não repita se o aluno não reagiu)
- Não ofereça se o aluno ainda está com dificuldade — espere a compreensão estar clara
- Não substitua o fechamento pedagógico natural por uma oferta de quiz imediata
```

- [ ] **Step 3: Aplicar patch nos 8 arquivos de server/src/personas/**

Para cada arquivo em `server/src/personas/` (CALCULUS, VERBETTA, NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX):
- Localizar a seção `## FECHAMENTO PEDAGÓGICO PÓS-QUIZ`
- Inserir a seção `## OFERTA PROATIVA DE QUIZ` imediatamente antes dela

- [ ] **Step 4: Aplicar o mesmo patch nos 8 arquivos de Prompts/**

Para cada arquivo em `Prompts/` (mesmos 8 heróis):
- Mesma operação: inserir `## OFERTA PROATIVA DE QUIZ` antes de `## FECHAMENTO PEDAGÓGICO PÓS-QUIZ`

- [ ] **Step 5: Verificar que os 16 arquivos foram editados**

```bash
grep -r "OFERTA PROATIVA DE QUIZ" /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/personas/ | wc -l
grep -r "OFERTA PROATIVA DE QUIZ" /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/Prompts/ | wc -l
```

Expected: 8 em cada pasta (total 16).

---

## Chunk 3: Super Prova KB Específico

### Contexto
**Problema atual:** Hook 1 do Super Prova (message.ts linhas 341-343 e 630-632) chama `obterOuGerarAcervo(temaDetectado, ...)` onde `temaDetectado` é sempre a matéria genérica ("geografia", "historia") — não o tópico específico da sessão.

**Por que acontece:** O router detecta tema como "geografia" a partir de keywords. O campo `tema_atual` na sessão também é o nome da matéria genérica. Então toda sessão de geografia compartilha o mesmo cache de KB — "quilombos", "amazônia", "clima" todos recebem o mesmo acervo genérico.

**A informação específica existe:** Quando PSICO processa a cascata, ele pode retornar um campo `super_prova_query` com o tópico específico (ex: "quilombos_atualidade"). E quando um herói emite `sinal_super_prova: 'QUIZ'`, ele também pode incluir `super_prova_query`.

**O fix:** No Hook 1, priorizar o tópico específico vindo do PSICO (ou do herói) quando disponível. Fallback para `temaDetectado` genérico quando não há tópico específico.

### Arquivos relevantes
```
server/src/routes/message.ts:339-348   ← Hook 1 Caso A (cascata)
server/src/routes/message.ts:628-637   ← Hook 1 Caso B (continuidade)
```

### Como extrair o tópico específico no Caso A (cascata)
No Caso A, `cascata` é o objeto parsed do PSICO. O PSICO pode incluir `super_prova_query` no JSON. Já existe código que extrai outros campos de `cascata` (linhas 352-369). Basta extrair `super_prova_query` da mesma forma.

### Como extrair no Caso B (continuidade)
No Caso B, o `temaDetectado` vem do router. O herói ainda não respondeu, então não temos `super_prova_query` do herói. Porém, podemos usar `sessao.tema_atual` se ele já tem um valor específico de turno anterior, ou simplesmente aceitar que o Caso B usa temaDetectado (que é ok como fallback).

### Task 3: Usar tema específico no Hook 1

**Files:**
- Modify: `server/src/routes/message.ts` (2 locais)

- [ ] **Step 1: Ler o trecho do Caso A (linhas 334-350)**

Confirmar a estrutura de `cascata` e como outros campos são extraídos.

- [ ] **Step 2: Extrair super_prova_query do cascata no Caso A**

Após a linha que extrai `instrucoesRaw` (por volta da linha 365), adicionar:

```typescript
// Extrair tema específico do PSICO para Super Prova (mais preciso que temaDetectado genérico)
const temaEspecifico_A: string = (
  cascata?.super_prova_query
  || respostaJSON?.super_prova_query
  || temaDetectado
) as string
```

- [ ] **Step 3: Usar temaEspecifico_A no Hook 1 Caso A**

Substituir:
```typescript
obterOuGerarAcervo(temaDetectado, aluno.serie || '7ano', heroiParaMateria(heroiEscolhido), heroiEscolhido)
```

Por:
```typescript
obterOuGerarAcervo(temaEspecifico_A, aluno.serie || '7ano', heroiParaMateria(heroiEscolhido), heroiEscolhido)
```

E atualizar o log:
```typescript
console.log(`[SuperProva] 🔄 Hook 1 ativado (cascata) | ${heroiEscolhido} | tema: "${temaEspecifico_A}" (genérico: "${temaDetectado}")`)
```

- [ ] **Step 4: Fazer o mesmo para o Caso B (continuidade, linhas 628-637)**

No Caso B, adicionar antes do bloco Hook 1:

```typescript
// Usar tema mais específico disponível: sessao.tema_atual (pode ter sido específico antes) ou temaDetectado
const temaEspecifico_B: string = temaDetectado || sessao.tema_atual || 'geral'
```

E substituir no hook:
```typescript
obterOuGerarAcervo(temaEspecifico_B, aluno.serie || '7ano', heroiParaMateria(persona), persona)
```

Log:
```typescript
console.log(`[SuperProva] 🔄 Hook 1 ativado (continuidade) | ${persona} | tema: "${temaEspecifico_B}"`)
```

- [ ] **Step 5: Também persistir o temaEspecifico na sessão**

Quando o PSICO retorna `super_prova_query`, esse valor específico deveria ser salvo em `tema_atual` da sessão — não o genérico. Atualmente, o tema que vai para a sessão é `temaDetectado` (genérico). 

Localizar onde `sessao.tema_atual = temaDetectado` é chamado (linha ~378) e modificar para usar o específico quando disponível:

```typescript
// Preservar tema específico do PSICO quando disponível
if (temaEspecifico_A) sessao.tema_atual = temaEspecifico_A
else if (temaDetectado) sessao.tema_atual = temaDetectado
```

E garantir que `atualizarSessao` também persiste o tema específico:
Verificar onde `tema_atual` é atualizado no banco após cascata e usar `temaEspecifico_A`.

- [ ] **Step 6: TypeCheck final**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server
npx tsc --noEmit
```

Expected: 0 errors.

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/web
npx tsc --noEmit
```

Expected: 0 errors.

---

## Chunk 4: Verificação Final + Memórias

### Task 4: Verificar, Commitar e Atualizar Memórias

- [ ] **Step 1: Confirmar que todos os patches foram aplicados**

```bash
# Fix persistence.ts — não deve ter mais DELETE de turnos
grep -n "delete" /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/db/persistence.ts

# Oferta proativa — 16 arquivos
grep -r "OFERTA PROATIVA DE QUIZ" /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/personas/ | wc -l
grep -r "OFERTA PROATIVA DE QUIZ" /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/Prompts/ | wc -l

# temaEspecifico no message.ts
grep -n "temaEspecifico" /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server/src/routes/message.ts
```

- [ ] **Step 2: TypeCheck completo**

```bash
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/server && npx tsc --noEmit
cd /sessions/gracious-hopeful-mayer/mnt/SuperAgentes_B2C_V2/web && npx tsc --noEmit
```

- [ ] **Step 3: Montar Escape Hatch para Leon**

```bash
cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
git add server/src/db/persistence.ts server/src/routes/message.ts server/src/personas/CALCULUS.md server/src/personas/VERBETTA.md server/src/personas/NEURON.md server/src/personas/TEMPUS.md server/src/personas/GAIA.md server/src/personas/VECTOR.md server/src/personas/ALKA.md server/src/personas/FLEX.md Prompts/CALCULUS.md Prompts/VERBETTA.md Prompts/NEURON.md Prompts/TEMPUS.md Prompts/GAIA.md Prompts/VECTOR.md Prompts/ALKA.md Prompts/FLEX.md
git commit -m "fix: nova_sessao preserva turnos + quiz proativo 8 herois + superprova tema especifico"
git push origin main
```

- [ ] **Step 4: Atualizar MEMORIA_CURTA.md e CHECKLIST_PROJETO.md**

Marcar as tasks implementadas como concluídas e atualizar o estado imediato.

---

## Resumo de Mudanças

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `server/src/db/persistence.ts` | Bug fix | Remover DELETE de turnos + `tema_atual: null` de `resetarSessaoAgente` |
| `server/src/routes/message.ts` | Feature | Hook 1 usa `temaEspecifico` (do PSICO) em vez de `temaDetectado` genérico |
| `server/src/personas/*.md` (8) | Feature | Adicionar seção `OFERTA PROATIVA DE QUIZ` antes de FECHAMENTO PÓS-QUIZ |
| `Prompts/*.md` (8) | Feature | Mesmo patch |

**Comportamento esperado pós-fix:**
1. Layla fecha janela e volta → `resetarSessaoAgente` reseta para PSICO mas PRESERVA turnos e tema → GAIA/PSICO tem contexto completo → "quer continuar com quilombos?" em vez de "li um texto sobre quilombo..."
2. GAIA percebe que aluno entendeu o tema → pergunta "quer fazer um quiz?" → aluno diz sim → GAIA emite `sinal_super_prova: 'QUIZ'` → Super Prova gera quiz
3. PSICO detecta `super_prova_query: "quilombos_atualidade"` → Hook 1 usa esse tema → Super Prova gera KB específico sobre quilombos, não genérico de geografia
