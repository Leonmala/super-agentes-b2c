# Universal Method + Router Audit + Super Prova Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 3 CALCULUS falsos positivos recorrentes (root cause: stickiness timeout + keywords perigosas), implementar o Método Universal no PSICO (com qualificação de tópicos), patchear os 8 heróis com anti-drift e suporte ao plano estruturado, e transformar o Super Prova de acervo genérico em quiz sessão-aware com feedback loop para o herói.

**Architecture:** Quatro mudanças independentes mas complementares: (1) router.ts recebe correção cirúrgica no stickiness guard + remoção de keywords de risco; (2) PSICOPEDAGOGICO.md recebe novo protocolo de qualificação de tópicos + JSON `plano_universal`; (3) todos os 8 prompts de heróis recebem patches padronizados de anti-drift + fechamento de tópicos; (4) Super Prova muda de acervo estático para geração dinâmica por sessão.

**Tech Stack:** TypeScript, Express, Node.js, Supabase, Gemini Flash, arquivos Markdown de persona.

---

## Chunk 1: Router — Auditoria Completa de Falsos Positivos e Correções

### Análise de Root Cause (leitura obrigatória antes de codar)

O router.ts tem **dois problemas distintos** que se combinam para produzir as intrusões de CALCULUS:

**Problema 1 — BUG CRÍTICO (root cause das intrusões T6, T50, T79):**
```typescript
// LINHA 573-576 — stickiness guard com lógica INVERTIDA:
if (!temaLLMConfirm || temaLLMConfirm === 'indefinido') {
  return decidirComTema(temaKeywords, sessao, ultimosTurnos) // TROCA quando LLM falha!
}
```
O guard foi desenhado para PROTEGER contra falsos positivos, mas quando o classificador LLM tem timeout (500ms — muito curto para Gemini), retorna `null`, e o guard cai no branch `!temaLLMConfirm` → **confia nas keywords e troca para CALCULUS**. O comportamento correto é o INVERSO: sem confirmação LLM, mantém o herói ativo.

**Problema 2 — Keywords de risco em KEYWORDS_MATEMATICA:**
- `'-'` (traço/hífen) → Layla escreveu `- ele entendeu` antes de uma frase → CALCULUS
- `'+'` → "bom + barato" estilo redes sociais → CALCULUS
- `'='` → menos comum mas possível em contexto coloquial
- `'área'`/`'area'` → "nessa área", "área de estudo" → CALCULUS
- `'número'`/`'numero'` → "número de páginas", "número do WhatsApp" → CALCULUS
- `'metade'` → "metade do texto", "metade da aula" → CALCULUS
- `'vezes'` → parcialmente coberto por anti-keywords, mas "três vezes ao dia" ainda dispara
- Frações de data: `'1/2'`, `'3/4'` → "fiz 1/2 das matérias" → CALCULUS (word boundary não protege aqui)

**Problema 3 — Timeout do classificador (500ms) é muito curto:**
O Gemini 2.5 Flash frequentemente demora 800ms-1200ms. O timeout de 500ms garante null com frequência → alimenta o Problema 1.

---

### Task 1.1: Corrigir o stickiness guard (BUG crítico)

**Files:**
- Modify: `server/src/core/router.ts:573-576`

- [ ] **Step 1.1.1: Abrir router.ts e localizar o stickiness guard**

Arquivo: `server/src/core/router.ts`
Localizar bloco:
```typescript
const temaLLMConfirm = await classificarTema(mensagem)
if (!temaLLMConfirm || temaLLMConfirm === 'indefinido') {
  console.log(`[stickiness] keywords='${temaKeywords}' LLM timeout/indefinido → confiando em keywords → trocando`)
  return decidirComTema(temaKeywords, sessao, ultimosTurnos)
}
```

- [ ] **Step 1.1.2: Aplicar fix — LLM timeout/indefinido agora MANTÉM herói ativo**

Substituir:
```typescript
if (!temaLLMConfirm || temaLLMConfirm === 'indefinido') {
  console.log(`[stickiness] keywords='${temaKeywords}' LLM timeout/indefinido → confiando em keywords → trocando`)
  return decidirComTema(temaKeywords, sessao, ultimosTurnos)
}
// LLM confirma nova matéria → permitir troca
console.log(`[stickiness] LLM='${temaLLMConfirm}' confirma troca de ${sessao.tema_atual} → ${temaLLMConfirm}`)
return decidirComTema(temaLLMConfirm, sessao, ultimosTurnos)
```

Por:
```typescript
if (!temaLLMConfirm || temaLLMConfirm === 'indefinido') {
  // LLM não confirmou: herói ativo se mantém. Keywords sem confirmação LLM = falso positivo ignorado.
  console.log(`[stickiness] LLM timeout/indefinido com keywords='${temaKeywords}' → mantendo ${sessao.agente_atual}`)
  return { persona: sessao.agente_atual!, temaDetectado: sessao.tema_atual }
}
// LLM confirma nova matéria → permitir troca
console.log(`[stickiness] LLM='${temaLLMConfirm}' confirma troca de ${sessao.tema_atual} → ${temaLLMConfirm}`)
return decidirComTema(temaLLMConfirm, sessao, ultimosTurnos)
```

- [ ] **Step 1.1.3: Aumentar timeout do classificador de 500ms para 2000ms**

Na função `classificarTema` (linha ~389):
```typescript
// ANTES:
const timeoutPromise = new Promise<null>((resolve) => {
  setTimeout(() => resolve(null), 500)
})
// DEPOIS:
const timeoutPromise = new Promise<null>((resolve) => {
  setTimeout(() => resolve(null), 2000) // 500ms era muito curto para Gemini Flash
})
```

- [ ] **Step 1.1.4: Verificar TypeScript**

```bash
cd /path/to/SuperAgentes_B2C_V2
npx tsc --noEmit
```
Esperado: 0 erros.

- [ ] **Step 1.1.5: Commit**

```bash
git add server/src/core/router.ts
git commit -m "fix: stickiness guard timeout → mantém herói ativo, não troca; timeout LLM 500ms→2000ms"
```

---

### Task 1.2: Remover keywords de risco de KEYWORDS_MATEMATICA

**Files:**
- Modify: `server/src/core/router.ts:13-40` (KEYWORDS_MATEMATICA)
- Modify: `server/src/core/router.ts:127-133` (ANTI_KEYWORDS_MATEMATICA)

- [ ] **Step 1.2.1: Remover operadores isolados que causam falsos positivos**

Em KEYWORDS_MATEMATICA, remover:
```typescript
// REMOVER estas 3 linhas:
'+', '-', '=',
```

**Justificativa:** Operadores isolados são demasiado genéricos. O classificador LLM lida melhor com "2+3=?" do que keywords. O traço `-` como marcador de lista é causa documentada das intrusões T6/T50/T79.

- [ ] **Step 1.2.2: Adicionar anti-keywords para `área`, `número`, `metade` em contextos não-matemáticos**

Em ANTI_KEYWORDS_MATEMATICA, adicionar:
```typescript
const ANTI_KEYWORDS_MATEMATICA: string[] = [
  // Contextos de frequência — 'vezes' não é matemática
  'às vezes', 'as vezes', 'umas vezes', 'outras vezes', 'algumas vezes',
  'muitas vezes', 'poucas vezes', 'várias vezes', 'varias vezes',
  'quantas vezes', 'várias vezes que', 'mais vezes',
  // 'média' no sentido histórico
  'idade média', 'idade media',
  // 'área' em contextos não-matemáticos
  'nessa área', 'nesta área', 'essa área', 'esta área', 'minha área',
  'área de concentração', 'área de concentracao',
  'área de estudo', 'área de estudos',
  'área profissional', 'área de trabalho', 'área de atuação', 'área de atuacao',
  'mesma área', 'outra área', 'qualquer área',
  // 'número' em contextos não-matemáticos  
  'número de páginas', 'numero de paginas',
  'número de capítulos', 'numero de capitulos',
  'número do', 'número da', 'número de telefone',
  'número de whatsapp', 'número de pessoas',
  // 'metade' em contextos não-matemáticos (texto corrido)
  'metade do texto', 'metade da aula', 'metade do livro',
  'metade do tempo', 'metade da turma', 'metade das',
]
```

**Nota sobre frações de data:** `'1/2'`, `'2/3'`, `'3/4'` como keywords usam word boundary (comprimento ≤4, sem espaço). "fiz 3/4 dos exercícios" → char antes de `3/4` é espaço (não word char), char depois é espaço → MATCH legítimo. "data: 3/4" → mesma análise → MATCH. Risco baixo porque o LLM classifier confirma ou nega. Com o Fix 1.1, falso positivo de data seria bloqueado pelo stickiness guard mesmo se keywords disparassem.

- [ ] **Step 1.2.3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 1.2.4: Commit**

```bash
git add server/src/core/router.ts
git commit -m "fix: remover operadores isolados +/-/= das keywords; anti-keywords para área/número/metade"
```

---

### Task 1.3: Teste de regressão manual do router (QA rápido)

**Files:**
- Read: `server/src/core/router.ts` (para referenciar no teste)

- [ ] **Step 1.3.1: Criar arquivo de teste rápido**

Criar `server/src/core/router.test.manual.ts` com casos de teste documentados:

```typescript
// Teste manual — não executa via jest, serve como documentação de casos críticos
// Executar com: npx ts-node server/src/core/router.test.manual.ts

import { detectarTema } from './router.js'

const casos = [
  // FALSOS POSITIVOS QUE DEVEM RETORNAR NULL (não matematica)
  { input: '- ele entendeu o conceito', esperado: null, desc: 'traço antes de frase' },
  { input: 'nessa área estudamos muito', esperado: null, desc: 'área não-matemática' },
  { input: 'qual o número de páginas do livro', esperado: null, desc: 'número de páginas' },
  { input: 'metade do texto fala sobre verbos', esperado: null, desc: 'metade em contexto português' },
  { input: 'três vezes ao dia', esperado: null, desc: 'vezes de frequência' },
  // VERDADEIROS POSITIVOS QUE DEVEM RETORNAR matematica
  { input: 'preciso de ajuda com frações', esperado: 'matematica', desc: 'fração explícita' },
  { input: 'qual é a área do triângulo', esperado: 'matematica', desc: 'área geométrica' },
  { input: 'como faço 1/2 + 1/3', esperado: 'matematica', desc: 'soma de frações' },
  { input: 'o número primo mais próximo de 10', esperado: 'matematica', desc: 'número primo' },
  // PORTUGUÊS NÃO DEVE VIRAR MATEMÁTICA
  { input: 'vou estudar crase e concordância', esperado: 'portugues', desc: 'português direto' },
  { input: '- preciso estudar verbo', esperado: 'portugues', desc: 'traço + keyword português' },
]

let passed = 0
let failed = 0
for (const caso of casos) {
  const resultado = detectarTema(caso.input)
  const ok = resultado === caso.esperado
  if (ok) { passed++; console.log(`✅ ${caso.desc}`) }
  else { failed++; console.log(`❌ ${caso.desc}: esperado=${caso.esperado} obtido=${resultado}`) }
}
console.log(`\nResultado: ${passed}/${casos.length} passaram`)
```

- [ ] **Step 1.3.2: Executar e verificar que todos passam**

```bash
cd server && npx ts-node src/core/router.test.manual.ts
```
Esperado: todos os casos passam.

- [ ] **Step 1.3.3: Commit do arquivo de teste**

```bash
git add server/src/core/router.test.manual.ts
git commit -m "test: casos de regressão para keywords CALCULUS falso positivo"
```

---

## Chunk 2: PSICO — Universal Method + Qualificação de Tópicos

### Análise da lacuna (o "furo no plano" de Leon)

**Fluxo atual:**
```
Aluno clica "Matemática" → matéria = matematica → ENCAMINHAR_PARA_HEROI imediatamente
```
PSICO não tem tópico. CALCULUS recebe instrução vaga. Sessão fica sem estrutura → 30 turnos sobre o mesmo assunto.

**Novo fluxo:**
```
Aluno envia mensagem sobre Matemática
  → PSICO detecta matéria MAS sem lista de tópicos específicos
  → PSICO faz UMA pergunta de qualificação: "Quais tópicos você precisa cobrir hoje?"
  → Aluno lista: "frações e geometria"
  → PSICO constrói plano_universal com 2 itens
  → PSICO envia para CALCULUS com plano estruturado
  → CALCULUS executa: tópico 1 → tópico 2 → fechamento
```

**Definição: "sem tópico suficiente"** — PSICO deve perguntar se:
1. A mensagem é só uma saudação + matéria ("oi, preciso de matemática")
2. A mensagem pede ajuda com "matemática" ou "português" sem especificar subtema
3. A mensagem menciona "prova" ou "lista de exercícios" sem listar o que está na prova/lista

PSICO NÃO deve perguntar se:
1. O aluno já listou tópico(s) explicitamente: "quero aprender frações e equações"
2. O aluno tem enunciado de exercício específico: "não entendi a questão 5 sobre triângulo retângulo"
3. Continuidade de sessão: herói já ativo + memória recente = contexto já definido

---

### Task 2.1: Adicionar protocolo de qualificação de tópicos ao PSICO

**Files:**
- Modify: `server/src/personas/PSICOPEDAGOGICO.md`
- Modify: `Prompts/PSICOPEDAGOGICO.md` (mesmo conteúdo, dois arquivos em sync)

- [ ] **Step 2.1.1: Ler arquivo atual para identificar ponto de inserção**

Ler `server/src/personas/PSICOPEDAGOGICO.md`, seção "QUANDO VOCÊ DEVE ENCAMINHAR PARA HERÓI".

- [ ] **Step 2.1.2: Inserir protocolo de qualificação de tópicos**

Após a seção "QUANDO VOCÊ DEVE ENCAMINHAR PARA HERÓI" (linha ~121), adicionar nova seção:

```markdown
══════════════════════════════════════════════════════════════
PROTOCOLO DE QUALIFICAÇÃO DE TÓPICOS (UNIVERSAL METHOD — GATE)
══════════════════════════════════════════════════════════════

OBJETIVO: Antes de encaminhar para o herói, garantir que há tópicos suficientes para montar
um plano estruturado. Uma sessão sem tópico explícito vira conversa aberta — o aluno se perde.

QUANDO PERGUNTAR TÓPICOS (antes de encaminhar ao herói):

Você deve usar PERGUNTAR_AO_ALUNO com qualificação de tópicos quando:
- A matéria está clara, MAS o tópico é vago ou ausente ("preciso de ajuda com matemática")
- O aluno menciona "prova" sem listar o que está na prova ("tenho prova de português amanhã")
- O aluno menciona "lista de exercícios" sem especificar o tema
- O aluno diz "quero estudar" + matéria sem subtema

Você NÃO deve perguntar tópicos quando:
- O aluno listou 1 ou mais tópicos explícitos ("quero aprender frações e equações de 1º grau")
- O aluno trouxe um exercício/enunciado específico (o exercício já define o tópico)
- É continuidade: herói ativo na memória recente (contexto já estabelecido)
- O tópico é implícito pelo enunciado ("não entendi como calcular área do triângulo retângulo")

MENSAGEM DE QUALIFICAÇÃO DE TÓPICOS (adaptar ao contexto, não copiar literalmente):
"Legal! Para a gente organizar bem o estudo de [matéria], quais tópicos você precisa cobrir hoje?
Pode listar tudo que precisar — tipo: [exemplo 1], [exemplo 2], [exemplo 3]... Assim monto um
plano certinho pra você! 😊"

APÓS RECEBER OS TÓPICOS:
Você constrói o `plano_universal` e encaminha para o herói (ver formato abaixo).

══════════════════════════════════════════════════════════════
PLANO UNIVERSAL — FORMATO E USO
══════════════════════════════════════════════════════════════

Quando você tem tópicos definidos (via qualificação ou mensagem do aluno), você DEVE incluir
`plano_universal` no JSON de ENCAMINHAR_PARA_HEROI.

REGRA DE GRANULARIDADE:
- 1 tópico: "frações" → plano com 1 item
- 2-4 tópicos: "frações e geometria" → plano com 2 itens
- 5+ tópicos: dividir em duas sessões; perguntar por qual começa
- Tópico amplo ("verbos"): expandir em subtópicos: ["verbos regulares", "verbos irregulares", "conjugação presente"]
- Tópico específico ("concordância verbal"): 1 item

CAMPO plano_universal (adicionar dentro de ENCAMINHAR_PARA_HEROI):
```json
"plano_universal": {
  "ativo": true,
  "topicos": [
    { "id": 1, "nome": "frações", "status": "pendente" },
    { "id": 2, "nome": "geometria básica", "status": "pendente" }
  ],
  "topico_atual_id": 1,
  "total": 2,
  "fechar_com_quiz": false
}
```

QUANDO `fechar_com_quiz: true`:
- Use quando: sessão de revisão para prova, aluno pediu quiz explicitamente, ou 3+ tópicos concluídos
- O herói gera um quiz ao final baseado NO CONTEÚDO DA SESSÃO (não genérico)
- O quiz cobre todos os tópicos do plano

QUANDO `fechar_com_quiz: false` (padrão):
- Sessões curtas (1-2 tópicos), dúvida pontual, exercício específico

══════════════════════════════════════════════════════════════
INSTRUÇÕES ATUALIZADAS PARA O HERÓI (UNIVERSAL METHOD)
══════════════════════════════════════════════════════════════

Quando `plano_universal.ativo = true`, adicionar em `instrucoes_para_agente.o_que_fazer`:

"MÉTODO UNIVERSAL ATIVO: Siga a sequência para cada tópico:
1. ABERTURA: explique o tópico [nome] em 2-3 frases (contexto geral)
2. CONSTRUÇÃO: 1 pergunta/exercício por vez — aguarde resposta do aluno
3. VALIDAÇÃO: confirme compreensão com feedback específico ('Exato! Você pegou o conceito X')
4. FECHAMENTO DO TÓPICO: ao validar proficiência, diga: 'Ótimo! Cobrimos [tópico]. [1-2 linha de resumo]. Pronto para [próximo tópico]?'
5. PRÓXIMO TÓPICO: repita o ciclo (tópico id+1)
6. FECHAMENTO FINAL: 'Cobrimos tudo hoje! Resumo: [lista de tópicos com 1 frase cada].'
Se `fechar_com_quiz: true`: gere quiz de 4-6 questões cobrindo os tópicos da sessão ANTES do fechamento final."

Quando `plano_universal` não está presente (dúvida pontual, enunciado específico):
- Fluxo construtivista normal, sem sequência de tópicos obrigatória
```

- [ ] **Step 2.1.3: Atualizar o formato de ENCAMINHAR_PARA_HEROI no PSICO para incluir plano_universal**

Na seção "FORMATO OBRIGATÓRIO DA SAÍDA", atualizar o bloco B:

```json
B) ENCAMINHAR_PARA_HEROI
{
  "acao": "ENCAMINHAR_PARA_HEROI",
  "agente_destino": "CALCULUS|VERBETTA|...",
  "plano_universal": {
    "ativo": true,
    "topicos": [{ "id": 1, "nome": "...", "status": "pendente" }],
    "topico_atual_id": 1,
    "total": 1,
    "fechar_com_quiz": false
  },
  "plano_pedagogico": { ... },
  "instrucoes_para_agente": { ... },
  "sinalizadores": { "manter_em_psico": false },
  "resumo_para_estado": { "materia": "...", "tema": "...", "risco": "nenhum" }
}
```
Nota: `plano_universal` é opcional — inclua somente quando tópicos estão definidos.

- [ ] **Step 2.1.4: Replicar exatamente o mesmo conteúdo em Prompts/PSICOPEDAGOGICO.md**

Os dois arquivos devem ser idênticos. Copiar as mesmas seções adicionadas.

- [ ] **Step 2.1.5: Verificar TypeScript (nenhuma mudança de código — só .md, mas verificar se há tipos)**

```bash
npx tsc --noEmit
```

- [ ] **Step 2.1.6: Commit**

```bash
git add server/src/personas/PSICOPEDAGOGICO.md Prompts/PSICOPEDAGOGICO.md
git commit -m "feat: PSICO — protocolo qualificação de tópicos + plano_universal + Universal Method"
```

---

### Task 2.2: Adicionar tipo TypeScript para plano_universal

**Files:**
- Modify: `server/src/db/supabase.ts` ou `server/src/types.ts` (onde estiverem os tipos do projeto)

- [ ] **Step 2.2.1: Localizar arquivo de tipos**

```bash
grep -r "PlanoUniversal\|plano_universal\|InstrucoesParaAgente" server/src/
```
Se não existir tipo dedicado para a resposta do PSICO, criar em `server/src/types/psico.ts`.

- [ ] **Step 2.2.2: Adicionar tipo PsicoPlanoUniversal**

```typescript
export interface TopicoPlano {
  id: number
  nome: string
  status: 'pendente' | 'em_progresso' | 'concluido'
}

export interface PsicoPlanoUniversal {
  ativo: boolean
  topicos: TopicoPlano[]
  topico_atual_id: number
  total: number
  fechar_com_quiz: boolean
}

// Estender resposta do PSICO existente:
export interface PsicoRespostaEncaminhar {
  acao: 'ENCAMINHAR_PARA_HEROI'
  agente_destino: string
  plano_universal?: PsicoPlanoUniversal  // opcional
  plano_pedagogico: Record<string, unknown>
  instrucoes_para_agente: Record<string, unknown>
  sinalizadores: { manter_em_psico: boolean }
  resumo_para_estado: Record<string, unknown>
}
```

- [ ] **Step 2.2.3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 2.2.4: Commit**

```bash
git add server/src/types/
git commit -m "feat: tipo PsicoPlanoUniversal para suporte ao Universal Method"
```

---

## Chunk 3: Universal Patches para os 8 Heróis

### Análise — O que cada herói precisa

Todos os 8 heróis (CALCULUS, VERBETTA, NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX) precisam dos mesmos 3 patches:

**Patch A — Universal Method Protocol:** Saber executar sequência estruturada quando `plano_universal` chega via PSICO.
**Patch B — Anti-Drift:** Não se desviar para tópicos tangentes (erros ortográficos durante aula de matemática, pergunta lateral durante aula de história).
**Patch C — Resumos são consolidação, não cola:** VERBETTA estava recusando resumos. Todos os heróis devem entender que resumo de conteúdo JÁ estudado na sessão é consolidação válida — diferente de "dar resposta pronta".

---

### Task 3.1: Preparar texto padrão dos 3 patches

- [ ] **Step 3.1.1: Escrever texto canônico dos patches (usado em todos os prompts)**

```markdown
══════════════════════════════════════════════════════════════
MÉTODO UNIVERSAL DE ESTUDO (ATIVAR QUANDO plano_universal PRESENTE)
══════════════════════════════════════════════════════════════

Quando você receber `plano_universal` nas instruções do PSICO:

CICLO POR TÓPICO (repetir para cada tópico do plano):
1. ABERTURA: "Vamos para [tópico N]!" + explicação geral em 2-3 frases (nunca mais que isso — contexto, não palestra)
2. CONSTRUÇÃO GUIADA: 1 pergunta ou exercício por vez. Aguarde o aluno responder antes de continuar.
3. FEEDBACK ESPECÍFICO: Quando o aluno acertar: "Isso! Você entendeu [conceito concreto]." Quando errar: leve guiado sem entregar a resposta.
4. VALIDAÇÃO DE PROFICIÊNCIA: Ao notar que o aluno compreendeu, confirme: "Antes de passar para o próximo, me diz: [pergunta de verificação curta]?"
5. FECHAMENTO DO TÓPICO: "Ótimo! Cobrimos [tópico]. Em resumo: [1-2 linhas do que foi aprendido]. Pronto para [próximo tópico]?"
6. Se `fechar_com_quiz: true` (ultimo tópico): gere quiz de 4-6 questões cobrindo a sessão ANTES do fechamento final. Use o conteúdo que você e o aluno trabalharam — não questões genéricas.
7. FECHAMENTO FINAL: "Cobrimos tudo hoje! Resumo da sessão: [lista dos tópicos com 1 frase cada]."

══════════════════════════════════════════════════════════════
ANTI-DRIFT — FOCO NO TÓPICO ATIVO
══════════════════════════════════════════════════════════════

- Se o aluno cometer erro tangente (ex: erro ortográfico durante aula de Matemática): registre mentalmente, NÃO desvie. Continue o tópico atual.
- Se surgir dúvida lateral interessante: "Boa pergunta! Anota aí — depois a gente vê. Agora terminemos [tópico]."
- O tópico atual SÓ fecha quando o aluno demonstrar compreensão OU pedir explicitamente para pular.
- Você é o guardião do ritmo da sessão. Não deixe o fio condutor se perder.

══════════════════════════════════════════════════════════════
RESUMOS SÃO CONSOLIDAÇÃO, NÃO COLA
══════════════════════════════════════════════════════════════

Quando o aluno pedir um resumo, organização ou síntese do que estudamos:
- Isso é CONSOLIDAÇÃO DE APRENDIZADO — diferente de entregar resposta pronta.
- O resumo reflete o que o aluno JÁ construiu com você nessa sessão.
- Entregue de forma clara e organizada. Nunca recuse resumo de conteúdo JÁ estudado.
- Só recuse "resumo" quando o aluno estiver pedindo que você FAÇA O TRABALHO DELE por ele (ex: "faz o resumo do livro todo pra mim" sem ter estudado nada na sessão).
- Regra rápida: se construímos juntos → posso resumir. Se o aluno quer que eu substitua o estudo → não.
```

---

### Task 3.2: Aplicar patches nos 8 arquivos de herói

**Files:**
- Modify: `server/src/personas/CALCULUS.md`
- Modify: `server/src/personas/VERBETTA.md`
- Modify: `server/src/personas/NEURON.md`
- Modify: `server/src/personas/TEMPUS.md`
- Modify: `server/src/personas/GAIA.md`
- Modify: `server/src/personas/VECTOR.md`
- Modify: `server/src/personas/ALKA.md`
- Modify: `server/src/personas/FLEX.md`
- Modify: os 8 correspondentes em `Prompts/`

> **Nota para agente executor:** Repita os steps 3.2.1 a 3.2.3 para cada um dos 8 heróis. O conteúdo do patch é IDÊNTICO para todos — só o nome do herói difere nos exemplos (adapte "tópico atual" para a matéria do herói quando necessário).

- [ ] **Step 3.2.1: Ler o arquivo de cada herói para localizar ponto de inserção**

Estratégia: inserir os 3 patches ANTES da última seção do prompt (tipicamente antes de "REGRAS DE SEGURANÇA" ou antes do fechamento do prompt). Se o herói já tiver seção de "CONSTRUTIVISMO", inserir APÓS ela.

- [ ] **Step 3.2.2: Inserir os 3 patches no arquivo `server/src/personas/<HEROI>.md`**

Copiar o texto canônico do Step 3.1.1. Manter todo o conteúdo original intacto — apenas ACRESCENTAR as novas seções.

- [ ] **Step 3.2.3: Replicar em `Prompts/<HEROI>.md`**

Os dois arquivos devem ser idênticos em conteúdo.

- [ ] **Step 3.2.4: Verificar que nenhum arquivo foi corrompido**

```bash
for f in server/src/personas/*.md; do echo "=== $f ===" && wc -l $f; done
```
Todos devem ter mais linhas que antes (nunca menos).

- [ ] **Step 3.2.5: Commit**

```bash
git add server/src/personas/ Prompts/
git commit -m "feat: patch Universal Method + anti-drift + resumos=consolidação em todos os 8 heróis"
```

---

## Chunk 4: Super Prova — Session-Aware Quiz

### Análise do estado atual

**Problema documentado (Supabase query confirmada):**
- `b2c_super_prova_acervo`: 1 entrada VERBETTA para 7_fund, `tema_hash = "portugues"`, `created_at = 2026-04-04`
- Blocos: genéricos (concordância, crase, estrutura textual) — não refletem sessão de Layla
- VERBETTA nunca recebe os resultados do quiz → sem feedback loop educacional
- Aluno acessa Super Prova como feature paralela — não integrada ao fluxo pedagógico

**Novo design:**

```
[sessão com Universal Method]
    → PSICO define fechar_com_quiz: true para sessões de revisão
    → herói, ao finalizar último tópico, GERA quiz inline da sessão
    → quiz baseado nos turnos da sessão (conteúdo real, não acervo)
    → aluno responde quiz
    → herói recebe resultado → faz follow-up educacional ("você errou X, vamos revisar")
    → sessão fecha com mapa de compreensão
```

---

### Task 4.1: Patch nos heróis para gerar quiz session-aware

**Files:**
- Modify: `server/src/personas/<todos>.md` (adicionar à seção de MÉTODO UNIVERSAL inserida no Chunk 3)

- [ ] **Step 4.1.1: Adicionar instrução de geração de quiz ao patch Universal Method (Chunk 3)**

Na seção `MÉTODO UNIVERSAL DE ESTUDO`, o item 6 já instrui o herói a gerar quiz quando `fechar_com_quiz: true`. Expandir com formato:

```markdown
FORMATO DO QUIZ (quando fechar_com_quiz: true):

Gere o quiz DIRETAMENTE no chat, sem mencionar "Super Prova" ou "acervo":
"Antes de fecharmos, que tal um mini-quiz do que vimos hoje? Sem pressão — é só pra fixar! 🎯

**Quiz da sessão — [data/tema]**
1. [questão sobre tópico 1 — múltipla escolha ou aberta]
2. [questão sobre tópico 2]
3. [questão integradora — combina conceitos]
(máximo 5 questões)

Responde à vontade!"

APÓS RECEBER RESPOSTAS DO QUIZ:
- Corrija questão a questão, com explicação curta
- Para cada erro: "No item X você colocou Y — lembra que vimos Z? [micro-revisão de 1-2 linhas]"
- Fechamento: "Você acertou N/5! [encorajamento genuíno baseado na performance real]"
- NÃO finja que o aluno foi bem se ele errou muita coisa — seja honesto e encorajador ao mesmo tempo
```

- [ ] **Step 4.1.2: Commit patch de quiz**

```bash
git add server/src/personas/ Prompts/
git commit -m "feat: heróis geram quiz session-aware quando plano_universal.fechar_com_quiz=true"
```

---

### Task 4.2: Endpoint para persistir resultado de quiz na sessão

**Files:**
- Modify: `server/src/core/context.ts` (ou arquivo de persistência equivalente)

- [ ] **Step 4.2.1: Localizar onde turnos são salvos no Supabase**

```bash
grep -r "inserir_turno\|salvar_turno\|b2c_turnos\|INSERT INTO" server/src/
```

- [ ] **Step 4.2.2: Adicionar campo `quiz_resultado` nos metadados do turno**

Na estrutura de turno persistido, adicionar campo opcional:
```typescript
interface TurnoMetadados {
  agente?: string
  psico_plano?: PsicoPlanoUniversal
  quiz_resultado?: {
    total: number
    acertos: number
    erros: Array<{ questao: number; topico: string }>
  }
}
```

Este campo permite que o PSICO, numa sessão futura, veja histórico de quiz e calibre o plano pedagógico ("aluno errou frações no quiz anterior → incluir revisão").

- [ ] **Step 4.2.3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4.2.4: Commit**

```bash
git add server/src/core/context.ts server/src/types/
git commit -m "feat: metadados de turno agora incluem quiz_resultado para memória de performance"
```

---

### Task 4.3: Deprecação gradual do acervo genérico (b2c_super_prova_acervo)

**Files:**
- Nenhum arquivo de código — decisão arquitetural documentada

- [ ] **Step 4.3.1: Documentar decisão no LOG_ERROS.md**

Adicionar em `docs/LOG_ERROS.md`:
```markdown
## DECISÃO ARQUITETURAL — 2026-04-13
### Super Prova: acervo estático → quiz session-aware

**Contexto:** b2c_super_prova_acervo contém 1 entrada genérica para VERBETTA 7_fund criada em
2026-04-04. O quiz não reflete o conteúdo da sessão. VERBETTA nunca vê resultados.

**Decisão:** O quiz é agora responsabilidade do herói (gerado inline ao final da sessão via
Universal Method com fechar_com_quiz=true). O acervo genérico permanece como fallback mas
não é mais o canal primário de quiz.

**Ação para b2c_super_prova_acervo:** Manter tabela, não deletar. Pode ser reutilizada
futuramente para quizzes offline ou exportação de material. Não popular mais com conteúdo
genérico — novos quizzes vêm do contexto da sessão.
```

- [ ] **Step 4.3.2: Commit da documentação**

```bash
git add docs/LOG_ERROS.md
git commit -m "docs: decisão arquitetural Super Prova — acervo estático substituído por quiz session-aware"
```

---

## Chunk 5: Verificação Final e Atualização de Memória

### Task 5.1: QA de sanidade do sistema completo

- [ ] **Step 5.1.1: Build sem erros TypeScript**

```bash
cd server && npx tsc --noEmit
```
Esperado: 0 erros.

- [ ] **Step 5.1.2: Executar teste de regressão do router**

```bash
npx ts-node src/core/router.test.manual.ts
```
Esperado: todos os casos passam.

- [ ] **Step 5.1.3: Verificar que todos os 8 arquivos de herói foram patcheados**

```bash
grep -l "MÉTODO UNIVERSAL" server/src/personas/*.md Prompts/*.md
```
Esperado: 16 arquivos listados (8 em cada pasta).

- [ ] **Step 5.1.4: Verificar que PSICOPEDAGOGICO.md tem as novas seções**

```bash
grep -n "PROTOCOLO DE QUALIFICAÇÃO\|plano_universal\|fechar_com_quiz" server/src/personas/PSICOPEDAGOGICO.md
```
Esperado: pelo menos 3 matches.

---

### Task 5.2: Atualizar MEMORIA_CURTA.md

- [ ] **Step 5.2.1: Atualizar estado imediato**

Reescrever `docs/MEMORIA_CURTA.md` com:
- Fase atual: implementação do Universal Method completa
- Próximas tasks: push de todos os commits + QA com Layla (sessão 2)
- Agenda sugerida: testar Universal Method em sessão real; monitorar CALCULUS nas primeiras 20 interações
- Pushes pendentes: incluir os 4 anteriores + os novos commits desta implementação

---

### Task 5.3: Marcar tasks no CHECKLIST_PROJETO.md

- [ ] **Step 5.3.1: Marcar como concluídas as tasks desta implementação no checklist**

Abrir `docs/CHECKLIST_PROJETO.md`, adicionar seção "Universal Method + Router Audit (2026-04-13)" e marcar:
- [x] Router: stickiness guard corrigido (LLM timeout → mantém herói)
- [x] Router: keywords perigosas removidas/protegidas (+/−/=, área, número, metade)
- [x] PSICO: protocolo de qualificação de tópicos
- [x] PSICO: plano_universal com fechar_com_quiz
- [x] 8 heróis: patch Universal Method + anti-drift + resumos=consolidação
- [x] Super Prova: quiz session-aware via herói (acervo depreciado)
- [ ] QA: sessão real com Layla validando Universal Method (próxima sessão)

---

## Notas de Execução

### Ordem recomendada
1. Chunk 1 (router fix) — impacto imediato, sem risco de regressão
2. Chunk 2 (PSICO) — depende do entendimento do Chunk 1
3. Chunk 3 (heróis) — pode ser paralelizado com Chunk 2
4. Chunk 4 (Super Prova) — menos urgente, pode ser split em sprint separado se necessário
5. Chunk 5 (verificação) — sempre ao final

### Arquivos NÃO tocados neste plano
- `web/` (frontend) — quiz é inline no chat, sem mudança de UI neste plano
- `server/src/core/message.ts` — lógica de routing não muda, apenas router.ts
- `server/src/db/` — nenhuma migration de banco necessária neste plano

### Critério de aceite
- Zero ocorrências de CALCULUS durante sessão de Português com >20 turnos
- PSICO faz pergunta de qualificação quando aluno não lista tópicos
- Herói executa sequência estruturada (abertura → construção → validação → fechamento)
- Aluno não fica "perdido" em sessão com múltiplos tópicos
- Resumo não é recusado quando conteúdo foi estudado na sessão
