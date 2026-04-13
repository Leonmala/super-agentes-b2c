# PLANO DE MELHORIAS V2 — Super Agentes Educacionais
> **Autor:** Lucas Pessoa | **Data:** 2026-04-13 | **Status:** Proposta para aprovação Leon
> **Contexto:** Resultado da análise da sessão real de Layla (88 turnos, 2026-04-12, score 6.0/10)

---

## SUMÁRIO EXECUTIVO

A sessão da Layla expôs quatro problemas sistêmicos que se reforçam mutuamente:

1. **Router promíscuo** — CALCULUS intercepta mensagens de Português porque `'-'`, `'+'`, `'='` e `'número'` disparam falso positivo de matemática. Confirmado: 3 intrusões em 88 turnos.
2. **Ausência de Método Universal** — PSICO encaminha sem estruturar o estudo. O herói recebe uma intenção vaga e abre espaço para conversa ilimitada. Layla usou 30 turnos para um tópico que 8 resolveriam com processo.
3. **Construtivismo rígido dos heróis** — VERBETTA recusou resumos por confundir "apoio cognitivo" com "cola". Isso vai acontecer nos outros 7 heróis se não corrigirmos agora.
4. **Super Prova desconectada** — quiz gerado de acervo genérico, herói não oferece proativamente, não recebe resultado, não faz followup. Inútil como ferramenta pedagógica real.

Os quatro problemas têm solução. Este plano detalha o diagnóstico técnico exato e as mudanças precisas a fazer.

---

## ÁREA 1 — ROUTER: CORRIGIR FALSOS POSITIVOS CALCULUS

### 1.1 Diagnóstico Técnico

Arquivo: `server/src/core/router.ts`

**Problema raiz A — Símbolos de 1 caractere como keyword:**
```typescript
// Linha 28 — CRÍTICO
const KEYWORDS_MATEMATICA = [
  // ...
  '+', '-', '=',  // ← qualquer traço, lista, subtítulo dispara CALCULUS
  // ...
]
```

Quando Layla escreveu `"- Crônica: leitura, compreensão"` o `'-'` fez match antes de "crônica" chegar a ser avaliada como keyword de Português.

**Problema raiz B — MATEMATICA é avaliada ANTES de PORTUGUES:**
```typescript
// Linha 264 — ordem de avaliação
if (matchKeyword(KEYWORDS_MATEMATICA, ANTI_KEYWORDS_MATEMATICA)) return 'matematica'
if (matchKeyword(KEYWORDS_PORTUGUES,  ANTI_KEYWORDS_PORTUGUES))  return 'portugues'
```

Dupla desvantagem: falso positivo dispara primeiro E Português nunca tem chance de corrigir.

**Problema raiz C — `'número'` e `'média'` com anti-keywords insuficientes:**
- `'número'` está nas keywords de MATEMATICA sem anti-keywords. "flexão de número" (Português!) dispara CALCULUS.
- `'média'` só tem `'idade média'` como anti-keyword. "média da frase" ou qualquer uso textual não é bloqueado.

### 1.2 Correções Propostas

**Fix 1 — Remover `'-'`, `'+'`, `'='` de KEYWORDS_MATEMATICA:**

Esses símbolos são demasiado ambíguos. Um aluno de Português usa `-` em listas e títulos o tempo todo. A detecção de operação matemática já é coberta por keywords compostas como `'soma de'`, `'menos que'`, `'igual a'`, e pelos heróis especializados que existem no fallback LLM.

```typescript
// REMOVER das KEYWORDS_MATEMATICA:
// '-', '+', '='

// ADICIONAR em KEYWORDS_MATEMATICA (contextos compostos que são inequivocamente math):
'mais que',   // evita confundir com uso genérico de 'mais'  
'menos que',
'igual a',
'dividido por',
'multiplicado por',
```

**Fix 2 — Anti-keywords robustas para `'número'` e `'média'`:**

```typescript
// ADICIONAR em ANTI_KEYWORDS_MATEMATICA:
'número de vezes',
'número de',       // "número de alunos", "número de páginas" = uso de língua, não math
'flexão de número', // gramática portuguesa
'número gramatical',
'concordância em número',
'média das notas',  // deixar passar — ainda é math
// mas bloquear:
'em média',        // uso coloquial ("em média ele estuda 2h")
'média das palavras', // análise textual
```

Na prática, a solução mais robusta para `'número'` é **exigir contexto adjacente**: só contar como keyword de matemática se `'número'` aparecer adjacente a outro sinal claro de math (dígito, operação, unidade). Isso requer uma função auxiliar `matchKeywordComContexto`.

**Fix 3 — Inversão de ordem quando stickiness indica herói de Português/Ciências/etc.:**

```typescript
// Na função detectarTema(), verificar primeiro a matéria do herói ativo
const heroiAtivo = ctx.heroiAtivo // vem do contexto
const ORDEM_AVALIACAO = heroiAtivo === 'VERBETTA' || heroiAtivo === 'NEURON'
  ? ['portugues', 'ciencias', 'matematica', ...]
  : ['matematica', 'portugues', ...]  // padrão atual

// Usar ORDEM_AVALIACAO para decidir qual matchKeyword testar primeiro
```

Isso garante que quando Layla está estudando com VERBETTA, uma mensagem ambígua como "como fica o número do verbo?" é avaliada primeiro como Português (e acerta: "número" + "verbo" = flexão nominal/verbal) antes de tentar math.

**Fix 4 — `'vezes'` com anti-keyword `'às vezes'` e `'de vez em quando'`:**

Já existe `'às vezes'` mas não `'de vez em quando'`, `'muitas vezes'`, `'poucas vezes'`. Completar o bloqueio.

### 1.3 Impacto Esperado

Eliminação de ~90% dos falsos positivos documentados na sessão Layla. O Fix 1 (remover símbolos 1-char) sozinho teria eliminado 2 das 3 intrusões confirmadas.

---

## ÁREA 2 — PSICO: MÉTODO UNIVERSAL DE ESTUDO

### 2.1 Diagnóstico

O PSICOPEDAGOGICO atual é um excelente **roteador** — qualifica em 1-2 turnos, detecta continuidade, mapeia riscos. Mas falta a camada de **orquestração do processo de aprendizagem**.

Quando Layla disse "quero estudar formas nominais do verbo", o PSICO enviou o herói com um objetivo genérico ("auxiliar a aluna com formas nominais"). O VERBETTA abriu a conversa, e os 30 turnos seguintes foram uma exploração livre sem destino claro.

O que deveria ter acontecido: PSICO lê a memória semântica (Qdrant) da Layla, vê que ela está no 7º ano, identifica que "formas nominais" tem 3 itens concretos (infinitivo, gerúndio, particípio), monta um plano de 4 etapas, e envia ao VERBETTA com instrução de executar item por item.

### 2.2 O Método Universal

```
Método Universal de Estudo (por tópico com N itens):

ABERTURA DO TÓPICO
  Herói: "Hoje vamos estudar [tópico]. Dividi em [N] partes.
          Começamos pela primeira: [nome do item 1]."

POR ITEM (repetir N vezes):
  1. Explicação → herói apresenta o conceito com linguagem da série
  2. Construção → herói faz pergunta guiada, aluno responde
  3. Prova de proficiência → mini-exercício ou aplicação
  4. Fechamento → herói confirma entendimento, anuncia próximo item
     ("Ótimo! Agora você domina [item]. Vamos pro [item+1].")

FECHAMENTO DO TÓPICO
  Herói: síntese dos N itens como uma narrativa conectada
  (isso É o resumo que o aluno pediu — entregue naturalmente ao final)

CLAUSURA OPCIONAL (quando plano_estudo.quiz_no_fechamento = true):
  Herói: "Que tal um quiz rápido para fixar o que estudamos?"
  → sinal_super_prova: "QUIZ"
```

**Contagem de turnos esperada:** 2-3 turnos por item + 2 para abertura/fechamento. Para 3 itens: 8-11 turnos. Versus os 30 de Layla.

### 2.3 O que o PSICO Precisa Fazer Diferente

**Quando encaminhar para herói com tópico que tem múltiplos conceitos:**

1. PSICO lê a intenção + memória semântica
2. Se o tópico tem 2+ conceitos identificáveis → cria `plano_estudo`
3. Lista os itens em ordem pedagógica (do mais simples ao mais complexo)
4. Usa a memória do aluno para priorizar: item que o aluno errou antes vem antes dos itens novos
5. Decide se o plano fecha com quiz (tópico longo ou novo = sim; dúvida pontual = não)

### 2.4 Mudança no JSON de Saída do PSICO

Adicionar campo `plano_estudo` no formato ENCAMINHAR_PARA_HEROI:

```json
{
  "acao": "ENCAMINHAR_PARA_HEROI",
  "agente_destino": "VERBETTA",
  "plano_pedagogico": { 
    "tom": "...",
    "abordagem": "...",
    "complexidade": "...",
    "objetivo_da_interacao": "Executar Método Universal para tópico [X]",
    "alertas": [],
    "observacoes_importantes": "..."
  },
  "plano_estudo": {
    "ativo": true,
    "topico_geral": "Formas nominais do verbo",
    "total_itens": 3,
    "itens": [
      "1. Infinitivo — definição, terminação em -ar/-er/-ir, usos como substantivo e em locuções verbais",
      "2. Gerúndio — terminação em -ndo, valor progressivo e adverbial, uso em perífrases",
      "3. Particípio — terminação em -ado/-ido/-to/-so, voz passiva, função adjetiva"
    ],
    "instrucao_execucao": "Execute item por item. Por item: (a) explique com 1-2 exemplos concretos, (b) faça pergunta guiada para o aluno construir entendimento, (c) aplique mini-exercício de identificação ou criação, (d) confirme compreensão antes de avançar ao próximo item. Após o último item, entregue síntese narrativa conectando os 3 itens — esse é o resumo que o aluno merece.",
    "quiz_no_fechamento": true
  },
  "instrucoes_para_agente": { ... },
  "sinalizadores": { "manter_em_psico": false },
  "resumo_para_estado": {
    "materia": "portugues",
    "tema": "formas nominais do verbo",
    "risco": "nenhum"
  }
}
```

**Quando NÃO criar plano_estudo (deixar ativo = false):**
- Dúvida pontual e específica ("qual a diferença entre mal e mau?") — 1-2 turnos, sem estrutura
- Exercício com enunciado já dado — herói resolve com o aluno diretamente
- Continuidade de sessão anterior — herói retoma onde parou

### 2.5 Mudança no Prompt PSICO

Adicionar seção nova no prompt:

```
MÉTODO UNIVERSAL — QUANDO E COMO CRIAR PLANO_ESTUDO

Quando o aluno (ou pai) pedir ajuda com um tópico que tem 2 ou mais conceitos 
identificáveis, você DEVE criar o campo plano_estudo na sua resposta ENCAMINHAR_PARA_HEROI.

COMO IDENTIFICAR SE CABE PLANO_ESTUDO:
- "quero estudar X" → sim, se X tem sub-itens identificáveis
- "me explica X, Y e Z" → sim, 3 itens claros
- "não entendi esse capítulo" + contexto de matéria → sim
- "qual é a diferença entre A e B?" → não (dúvida pontual)
- "me ajuda com esse exercício" → não (exercício específico)

COMO MONTAR O PLANO:
1. Use buscar_memoria_semantica para verificar quais sub-tópicos o aluno já tem dificuldade
2. Liste os itens do mais concreto/simples ao mais abstrato/complexo
3. Use 'instrucao_execucao' para dar ao herói o roteiro claro de como executar cada item
4. Defina quiz_no_fechamento: true para tópicos novos ou com 3+ itens; false para revisões rápidas

REGRA DE TAMANHO:
- Máximo 5 itens por plano. Tópicos maiores = dividir em duas sessões.
- Se o aluno claramente está no meio de um tópico (continuidade), não criar novo plano.
```

---

## ÁREA 3 — PATCH DE HERÓIS: CORREÇÕES PARA TODOS OS 8

As correções abaixo vão como seção nova nos prompts de todos os heróis (arquivo `server/src/personas/NOME.md` + `Prompts/NOME.md`).

### 3.1 Bloco Universal — Adicionar em todos os 8 heróis

```markdown
══════════════════════════════════════════════════════════════
MÉTODO UNIVERSAL — EXECUÇÃO DO PLANO DE ESTUDO
══════════════════════════════════════════════════════════════

Quando você receber as instruções do PSICO com `plano_estudo.ativo = true`:

1. ABERTURA: Apresente o tópico e a estrutura de forma natural.
   Exemplo: "Hoje vamos ver [tópico]! Preparei [N] partes para você.
   Começamos com a primeira: [item 1]."
   NÃO liste todos os itens de uma vez — mencione apenas que existe uma estrutura.

2. POR ITEM (siga a ordem do plano_estudo.itens):
   (a) Explicação: conceito com 1-2 exemplos concretos para a série do aluno
   (b) Pergunta guiada: faça uma pergunta que leva o aluno a construir o entendimento
   (c) Prova: mini-exercício ou "me dá um exemplo agora" ou "identifica aqui no texto"
   (d) Fechamento do item: confirme que entendeu. Diga claramente que fechou aquele item
       e anuncia o próximo. "Perfeito! [Item 1] dominado. Vamos pro [item 2]."

3. FECHAMENTO DO TÓPICO: Após o último item, entregue uma síntese narrativa conectando
   todos os itens. Isso é o RESUMO que o aluno construiu ao longo da sessão.
   Não peça permissão. Entregue como parte natural do processo.

4. QUIZ (quando plano_estudo.quiz_no_fechamento = true):
   Após a síntese, proponha: "Que tal um quiz rápido para fixar?"
   Se o aluno aceitar → sinal_super_prova: "QUIZ"
   Se recusar → respeite. A sessão está completa.

REGRA CRÍTICA: Se o aluno pedir para pular um item ou ir direto ao próximo,
respeite. O processo é guia, não prisão. O aluno tem autonomia.
```

### 3.2 Bloco de Resumo — Adicionar em todos os 8 heróis

```markdown
══════════════════════════════════════════════════════════════
RESUMO = APOIO COGNITIVO, NÃO COLA
══════════════════════════════════════════════════════════════

Quando o aluno pedir um resumo, síntese, ou "junta tudo que falamos":

SEMPRE ENTREGUE. Isso é apoio cognitivo legítimo.

Construtivismo significa CONSTRUIR o caminho até o conhecimento, não negar o
conhecimento quando o aluno chegou até ele. Se o aluno passou por um processo
de aprendizagem com você (ou com o Método Universal), ele MERECE a síntese.

O resumo de fechamento cumpre três funções pedagógicas:
1. Consolidação da memória de trabalho
2. Visão integrada dos conceitos que antes estavam separados
3. Sinal de conclusão ("chegamos até aqui")

NUNCA recuse um resumo com frases como "prefiro que você construa" ou
"tente você mesmo resumir primeiro". Isso é construtivismo mal aplicado —
o aluno já construiu ao longo da sessão. O resumo é a colheita.
```

### 3.3 Bloco Anti-Drift de Matéria — Adicionar em todos os 8 heróis

```markdown
══════════════════════════════════════════════════════════════
FOCO DE MATÉRIA — RESISTÊNCIA A FALSO POSITIVO DE ROUTER
══════════════════════════════════════════════════════════════

Você é especialista em [MATÉRIA]. Quando o aluno usar palavras que existem
em outras matérias (ex: "número", "média", "média das notas"), interprete
SEMPRE dentro do contexto da sua matéria.

Exemplos para VERBETTA:
- "flexão de número" = gramática (não matemática)
- "média das frases" = análise textual (não média aritmética)
- "o texto tem 3 partes" = estrutura textual (não contagem matemática)

Se você receber a mensagem e perceber que claramente é sobre outra matéria,
responda: "Parece que essa dúvida é de [outra matéria]. Posso te ajudar com
[sua matéria]. Quer continuar com [tópico atual]?"

NUNCA mude de matéria sem confirmar com o aluno.
```

### 3.4 Patch Específico para VERBETTA

Além dos blocos universais acima, VERBETTA recebe uma adição específica sobre construtivismo:

```markdown
══════════════════════════════════════════════════════════════
CONSTRUTIVISMO SEM RIGIDEZ — REGRA VERBETTA
══════════════════════════════════════════════════════════════

Construtivismo aplicado ao Português significa:
✅ Perguntar "o que você acha que significa essa palavra?" antes de explicar
✅ Guiar o aluno a identificar o padrão antes de nomear a regra
✅ Usar o texto do aluno como ponto de partida para a análise
✅ Fazer o aluno produzir (criar frases, exemplos) não só reconhecer

Construtivismo NÃO significa:
❌ Recusar síntese após processo de aprendizagem já construído
❌ Bloquear resposta quando o aluno demonstrou que entendeu
❌ Transformar cada interação em interrogatório pedagógico
❌ Ignorar que às vezes o aluno simplesmente quer confirmar que entendeu certo

REGRA: Se o aluno demonstrou entendimento (respondeu corretamente, aplicou o
conceito, criou um exemplo válido), a resposta direta e a síntese são o passo
NATURAL seguinte — não uma concessão pedagógica, mas a conclusão do processo.
```

---

## ÁREA 4 — SUPER PROVA: REDESENHO DA INTEGRAÇÃO

### 4.1 Diagnóstico Técnico

**Investigação no Supabase confirmou:**
```
VERBETTA 7_fund acervo:
  id         = ec84a361
  criado em  = 2026-04-04  (9 dias antes da sessão da Layla)
  tema_hash  = "portugues" (genérico — não "tempos_modo_indicativo")
  blocos     = antes_depois, ancora_sentido, micro_producao, estrutura_textual, funcao_linguistica
```

Os blocos são genéricos de Português, não sobre o que Layla estudou no dia. O quiz gerado foi de "Português 7º ano" — não de "formas nominais do verbo + tempos do modo indicativo".

**Código de gerar-quiz.ts recebe `resumoConversa`** — o mecanismo para quiz contextual JÁ EXISTE. O problema é que:
1. O `tema` passado para o quiz ainda é o genérico ("portugues") quando deveria ser o tema da sessão
2. O herói só dispara o sinal QUIZ quando o aluno pede — nunca proativamente
3. O herói não recebe o resultado do quiz de volta — não faz followup pedagógico

### 4.2 Fix 1 — tema_hash = tema da sessão, não da matéria

**Problema atual:**
```typescript
// index.ts linha 90-96
const { error: upsertErr } = await supabase.from('b2c_super_prova_acervo').upsert({
  serie,
  tema_hash: temaHash,    // ← "portugues" — genérico
  tema_label: tema,
  materia,
  heroi_id: heroiId,
  ...
})
```

O `temaHash` vem de `normalizarTema(tema)` onde `tema` é o que o PSICO detectou. O problema está em o que o PSICO passa como tema: quando a mensagem do aluno é vaga ("quero estudar verbos"), o tema vira "verbos" ou "portugues" — não o tópico específico.

**Fix: PSICO deve incluir `tema_especifico` no JSON de encaminhamento:**

```json
"resumo_para_estado": {
  "materia": "portugues",
  "tema": "formas_nominais_verbo",  // ← específico, não "portugues"
  "risco": "nenhum"
}
```

E o `message.ts` deve usar `resumo_para_estado.tema` (não a matéria) para chamar `obterOuGerarAcervo`.

Isso faz com que o acervo seja gerado especificamente para "formas nominais do verbo 7º ano", e o quiz que fechar a sessão teste exatamente o que foi estudado.

### 4.3 Fix 2 — Herói proativamente oferece quiz ao fim do plano

**Atual:** herói só dispara `sinal_super_prova: "QUIZ"` quando o aluno pede explicitamente.

**Proposto:** quando `plano_estudo.quiz_no_fechamento = true` e o herói acabou de entregar o fechamento do último item, ele naturalmente oferece:

```
"Estudamos [N itens] hoje. Ficou muito bem! 🎯
Que tal um Quiz Rápido para fixar? São [X] perguntas sobre tudo que vimos. Bora?"
```

Se o aluno aceitar qualquer confirmação ("sim", "bora", "pode ser", "ok") → `sinal_super_prova: "QUIZ"`.

Isso muda o quiz de "recurso de desespero do aluno" para "fechamento natural de uma sessão com processo".

### 4.4 Fix 3 — Herói recebe resultado do quiz e faz followup (MVP)

Este é o fix mais arquitetural. Requer 3 mudanças coordenadas:

**a) Frontend envia resultado de volta:**
```typescript
// Após o aluno terminar o quiz, frontend envia:
POST /api/quiz-resultado
{
  sessao_id: "...",
  aluno_id: "...",
  heroi_id: "VERBETTA",
  tema: "formas_nominais_verbo",
  total_questoes: 12,
  acertos: 9,
  erros_por_item: [
    { item: "particípio irregular", acertou: false }
  ]
}
```

**b) Backend persiste no campo `super_prova_quiz_resultado` na sessão** (novo campo em `b2c_sessoes` ou `b2c_uso_diario`)

**c) Context builder injeta no próximo turno:**
```
QUIZ_RESULTADO:
  O aluno acabou de fazer um quiz sobre [tema].
  Acertos: 9/12 (75%)
  Itens com erro: "particípio irregular — voz passiva com verbos irregulares"
  
  Na sua próxima resposta, faça um breve followup pedagógico:
  reconheça o resultado, elogie os acertos, e ofereça revisão específica dos erros.
  Não peça que o aluno refaça o quiz — ofereça uma explicação focada nos pontos de dificuldade.
```

**Implementação MVP (sem mudar o fluxo principal):**
Para não bloquear as outras melhorias, o Fix 3 pode ser implementado em 2 etapas:
- **Etapa 3a:** endpoint `/api/quiz-resultado` + persistência na sessão + context injection (1 sprint)
- **Etapa 3b:** herói recebe e faz followup sofisticado (ajuste de prompt, 0.5 sprint)

### 4.5 Resumo das Mudanças Super Prova

| Problema | Fix | Impacto |
|----------|-----|---------|
| tema_hash genérico | PSICO passa tema_especifico; message.ts usa ele | Quiz sobre o que foi estudado, não "Português em geral" |
| Herói nunca oferece quiz | Adicionar oferta proativa após Método Universal | Quiz passa de 0% de uso orgânico para fechamento padrão |
| Sem followup de resultados | Endpoint + context injection + patch de prompt | Herói fecha o loop pedagógico — erros viram oportunidade |

---

## ORDEM DE IMPLEMENTAÇÃO (PROPOSTA)

### Sprint 1 — Urgente (bug-fix + quick wins)
1. **Router Fix 1:** Remover `'-'`, `'+'`, `'='` de KEYWORDS_MATEMATICA → `router.ts`
2. **Router Fix 2:** Anti-keywords robustas para `'número'` e `'média'` → `router.ts`
3. **Router Fix 3:** Inversão de ordem quando stickiness indica herói não-math → `router.ts`
4. **Hero Patch — Blocos universais:** resumo + anti-drift + construtivismo → todos os 8 `.md`

Estimativa: 1 dia de trabalho. Resolve os problemas imediatos de intrusão e rigidez.

### Sprint 2 — Método Universal
5. **PSICO — Seção Método Universal:** nova seção no prompt PSICO → `PSICOPEDAGOGICO.md`
6. **PSICO — Campo plano_estudo no JSON:** adicionar ao schema de saída do PSICO
7. **Hero — Bloco de execução do Método Universal:** seção nova em todos os 8 `.md`
8. **Router Fix 4 — tema_especifico:** PSICO passa tema preciso para acervo Super Prova

Estimativa: 1-2 dias. Muda o comportamento central do produto.

### Sprint 3 — Super Prova Fechamento
9. **Hero — Oferta proativa de quiz** ao fin do Método Universal
10. **Frontend + Backend — Endpoint quiz-resultado** + persistência
11. **Context builder — Injeção de QUIZ_RESULTADO** no próximo turno
12. **Hero — Followup pedagógico pós-quiz** via patch de prompt

Estimativa: 2 dias. Fecha o loop de aprendizagem.

---

## O QUE ISSO MUDA NA EXPERIÊNCIA DO ALUNO

**Sessão Layla ANTES das melhorias (2026-04-12):**
- 30 turnos vagando por verbos sem estrutura
- 3 intrusões de CALCULUS por causa de traço/lista
- Pediu resumo, levou sermão construtivista
- Pediu quiz, recebeu perguntas sobre o que não estudou naquele dia
- Score: 6.0/10

**Sessão Layla DEPOIS das melhorias (projetado):**
- "Quero estudar formas nominais" → PSICO monta plano de 3 itens
- VERBETTA: "Vamos em 3 partes! Começamos pelo infinitivo."
- ~8-10 turnos com processo claro, item por item, com mini-exercício e fechamento por item
- VERBETTA fecha: síntese natural dos 3 itens (o resumo que Layla queria)
- "Que tal um quiz?" → aluno aceita → quiz sobre infinitivo/gerúndio/particípio (não genérico)
- Próxima sessão: VERBETTA recebe resultado, revisita particípio irregular que Layla errou
- Score projetado: **9.0+/10**

---

## NOTA SOBRE PROPAGAÇÃO

Leon identificou corretamente: a fórmula de correção vista no VERBETTA precisa ir para todos os 8 heróis. Os blocos das Áreas 3.1, 3.2 e 3.3 são universais. Ao aplicar em VERBETTA, aplicar simultaneamente em CALCULUS, NEURON, TEMPUS, GAIA, VECTOR, ALKA e FLEX.

A única diferença é o bloco 3.4 (Construtivismo sem rigidez), que tem exemplos específicos de VERBETTA — cada herói precisa de uma versão adaptada para sua matéria. Mas o princípio é idêntico: **construtivismo = construir o caminho, não bloquear a chegada.**

---

*Este plano está pronto para debate e aprovação. Nenhum código será escrito antes do alinhamento com Leon.*
