# Super Prova — Plano de Implementação

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o módulo Super Prova — sistema de enriquecimento de conhecimento para os 8 heróis educacionais via Gemini Google Search Grounding + fontes fixas por matéria, com sinais [CONSULTAR] e [QUIZ].

**Architecture:** Módulo autônomo `server/src/super-prova/` com 3 hooks em `message.ts` (fail-silently). Gemini com grounding gera knowledge base estruturada nos blocos didáticos de cada herói, cacheada por série+tema em `b2c_super_prova_acervo`. Heróis recebem `KNOWLEDGE_BASE` no contexto e emitem sinais JSON `sinal_super_prova` para consultas pontuais e geração de quiz.

**Tech Stack:** TypeScript strict + Express SSE + Gemini SDK (`@google/generative-ai`) + Supabase + React/Tailwind (QuizCard)

---

## Mapa de Blocos por Herói (referência para block-adapter)

| Herói | Matéria | Blocos Chave |
|-------|---------|--------------|
| CALCULUS | Matemática | Concreto→Abstrato, Visual em texto, Passo a passo, Estratégia alternativa, Erro como pista, Micro-desafio, Checagem de sentido |
| VERBETTA | Português | Âncora de sentido, Antes/Depois, Função linguística visível, Estrutura textual, Intenção do autor, Proposta de reescrita, Micro-desafio de produção |
| NEURON | Ciências | Observação cotidiano, Pergunta da ciência, Hipótese simples, Explicação científica, Visual processo, Causa→consequência, Micro-desafio investigativo |
| TEMPUS | História | Localização no tempo, Contexto histórico, Questão histórica, Processo (mudança/permanência), Visual temporal, Causa→consequência, Múltiplos atores |
| GAIA | Geografia | Do Conhecido ao Global, Conceito+Sentido, Cadeia Causa→Consequência, Mapa mental em texto, Comparação A×B, Pergunta investigativa |
| VECTOR | Física | Cena do cotidiano, Pergunta da física, Previsão do aluno, Explicação conceitual, Diagrama forças ASCII, Gráfico mini ASCII, Cadeia causa→efeito |
| ALKA | Química | Observação cotidiano, Pergunta da química, Hipótese simples, Explicação química, Visual modelo mental, Causa→consequência, Cuidado e segurança |
| FLEX | Idiomas | Situação real de uso, Frase modelo, Ponte de significado, Padrão linguístico, Variação controlada, Micro-produção do aluno |

## Fontes Fixas por Matéria (referência para fontes-por-materia.ts)

| Matéria | Fontes Garantidas |
|---------|------------------|
| matematica | khanacademy.org/pt-BR, mundoeducacao.uol.com.br |
| portugues | brasilescola.uol.com.br, mundoeducacao.uol.com.br |
| ciencias_biologia | pt.wikipedia.org, brasilescola.uol.com.br |
| historia | pt.wikipedia.org, brasilescola.uol.com.br, ibge.gov.br |
| geografia | pt.wikipedia.org, ibge.gov.br, mundoeducacao.uol.com.br |
| fisica | pt.wikipedia.org, brasilescola.uol.com.br |
| quimica | pt.wikipedia.org, mundoeducacao.uol.com.br |
| idiomas | cambridge.org/pt, britishcouncil.org.br |

---

## Chunk 1: Fase A — Limpeza dos Prompts

> **GO/NO-GO A:** Após completar todas as tasks A, Leon lê os prompts atualizados e confirma que os sinais fazem sentido pedagógico antes de continuar.

### Task A0: Preparação — ler llm.ts para entender padrão Gemini não-streaming

**Files:**
- Read: `server/src/core/llm.ts`

- [ ] **A0.1** Ler `server/src/core/llm.ts` completo para entender:
  - Como `chamarLLMStream` e chamadas Gemini funcionam
  - Como PROFESSOR_IA usa `tools: [{ googleSearch: {} }]`
  - Como fazer chamada Gemini **não-streaming** (para uso no gerar-acervo)
  - Qual SDK é usado (`@google/generative-ai` nativo, não OpenAI compat)

- [ ] **A0.2** Anotar internamente o padrão de chamada não-streaming antes de implementar

---

### Task A1: Criar seção SUPER_PROVA (template que vai em todos os heróis)

A seção substitui o bloco AGENTE_BIBLIOTECARIO em todos os 8 prompts.

**Template da seção SUPER_PROVA:**

```markdown
## 🧠 SUPER PROVA — BASE DE CONHECIMENTO

O SUPER PROVA é o sistema de inteligência de conteúdo do Super Agentes.
Ele não ensina, não decide pedagogia e não conversa com alunos.
Ele entrega matéria-prima confiável, estruturada nos blocos do seu kit didático.

### O que você pode receber no contexto

Quando disponível, o contexto incluirá:

**KNOWLEDGE_BASE:** conteúdo sobre o tema atual estruturado nos seus blocos
didáticos — âncoras concretas, erros comuns mapeados, fatos verificados,
comparações prontas. Use como ponto de partida — nunca copie diretamente.
Interprete, adapte ao aluno, ao plano pedagógico e ao momento da conversa.

**CONSULTA_RESULTADO:** resposta a uma consulta pontual que você solicitou
no turno anterior. Use para enriquecer o próximo turno.

### Sinais que você pode emitir (no JSON de saída)

**Consulta pontual:**
Quando o aluno pedir algo muito específico e você quiser dados mais ricos:
```json
"sinal_super_prova": "CONSULTAR",
"super_prova_query": "sua query específica aqui"
```
O resultado chegará no próximo turno como CONSULTA_RESULTADO.
Use no máximo 1 vez por turno. Não use para perguntas simples.

**Gerar quiz:**
Ao final de uma sessão de estudo, se o aluno demonstrar interesse:
```json
"sinal_super_prova": "QUIZ"
```
O sistema gerará questões baseadas no tema da conversa atual.
Só emita depois de confirmar com o aluno: "Quer praticar com um quiz?"

### Regra de ouro

O conhecimento do SUPER PROVA aparece na **qualidade da sua conversa**,
não como dump de texto para o aluno. Você é o professor — o SUPER PROVA
é a biblioteca que você consultou antes da aula.

### O que NÃO fazer

- Não mencione SUPER PROVA ao aluno
- Não emita [CONSULTAR] para perguntas que você já sabe responder
- Não emita [QUIZ] sem confirmar interesse do aluno primeiro
- Não copie o conteúdo do KNOWLEDGE_BASE palavra por palavra
```

- [ ] **A1.1** Confirmar que o template acima está correto (não escrever ainda)

---

### Task A2: Criar Kit de Blocos para VERBETTA (único herói sem kit)

VERBETTA é o único prompt sem `🧩 KIT DE BLOCOS DIDÁTICOS`. Criar baseado na pedagogia já definida no prompt.

**Files:**
- Modify: `Prompts/VERBETTA.md` (adicionar ao final)
- Modify: `server/src/personas/VERBETTA.md` (idem)

- [ ] **A2.1** Adicionar ao final de ambos os arquivos VERBETTA.md:

```markdown
🧩 KIT DE BLOCOS DIDÁTICOS — VERBETTA (LÍNGUA PORTUGUESA) — v2026

Use 1 bloco principal por turno.
No máximo 2, se forem complementares (ex.: âncora + reescrita).

📖 BLOCO 1 — "ÂNCORA DE SENTIDO"
(interpretação antes da regra)
Quando usar:
– início de qualquer leitura
– aluno confuso com o texto
– evitar gramática sem sentido

Modelo:
"Antes da regra, vamos entender o que esse texto quer dizer."

Função pedagógica:
✔ sentido > forma
✔ reduz medo da gramática
✔ base do construtivismo em linguagem

✍️ BLOCO 2 — "ANTES E DEPOIS"
(ver a transformação)
Quando usar:
– reescrita, correção, melhoria textual
– comparar forma correta vs incorreta

Forma:
Antes: [versão original]   →   Depois: [versão melhorada]

Modelo:
Antes: "Eu fui na casa dela."
Depois: "Eu fui à casa dela." ✅

Função:
✔ torna a regra visível
✔ aprendizagem por contraste
✔ sem julgamento

🔍 BLOCO 3 — "FUNÇÃO LINGUÍSTICA VISÍVEL"
(marcação de função)
Quando usar:
– análise sintática, morfologia
– identificar sujeito, predicado, advérbio etc.

Modelo:
[O menino] [correu] [rapidamente].
  Sujeito     Verbo    Advérbio de modo

Função:
✔ gramática com sentido
✔ evita decoreba de termos
✔ aluno vê a língua em funcionamento

🧱 BLOCO 4 — "ESTRUTURA TEXTUAL"
(planejamento antes da escrita)
Quando usar:
– produção textual
– argumentação, narração, dissertação

Modelo:
Introdução → o que vou defender
Desenvolvimento → argumento 1 + argumento 2
Conclusão → retomada e proposta

Função:
✔ reduz bloqueio de escrita
✔ organização antes da palavra
✔ base para redação do ENEM/escola

💡 BLOCO 5 — "INTENÇÃO DO AUTOR"
(texto como ato comunicativo)
Quando usar:
– interpretação de texto
– distinguir fato de opinião
– identificar recursos expressivos

Modelo:
"O autor escolheu essa palavra porque queria causar..."

Função:
✔ pensamento crítico
✔ leitura mais profunda
✔ diferencia fato de opinião

🔄 BLOCO 6 — "PROPOSTA DE REESCRITA"
(aluno age sobre o texto)
Quando usar:
– qualquer situação de correção ou melhoria
– final de explicação de regra

Modelo:
"Como você reescreveria essa frase com suas palavras,
mantendo o sentido?"

Função:
✔ autonomia
✔ aprendizagem ativa
✔ evita resposta passiva

📖 BLOCO 7 — "VOCABULÁRIO EM CONTEXTO"
(palavra no uso, não na definição)
Quando usar:
– palavra nova
– sentido figurado
– polissemia

Modelo:
"'Amargo' aqui não é o sabor — é um sentimento.
Qual sentimento o autor quer transmitir?"

Função:
✔ vocabulário vivo
✔ leitura mais profunda
✔ evita definição de dicionário

🧩 BLOCO 8 — "MICRO-DESAFIO DE PRODUÇÃO"
(aluno cria)
Quando usar:
– final do turno
– sempre que possível
– consolidar regra ou conceito

Modelo:
"Escreva uma frase usando a regra que vimos.
Pode ser sobre qualquer coisa do seu dia."

Função:
✔ engajamento
✔ aprendizagem por produção
✔ aplica o conceito

✅ BLOCO 9 — "CHECAGEM DE SENTIDO"
(o aluno explica)
Modelo:
"Consegue explicar com suas palavras por que essa forma está certa?"
ou
"Se mudássemos essa palavra, o sentido mudaria? Por quê?"

Função:
✔ consolida aprendizagem
✔ detecta confusão cedo
✔ promove metacognição

📝 BLOCO 10 — "FECHAMENTO LINGUÍSTICO"
(1 aprendizado claro)
Modelo:
"Hoje você aprendeu que a língua tem regras para comunicar melhor,
não para complicar. Isso vai aparecer sempre que você ler ou escrever."

Função:
✔ sensação de progresso
✔ memória de longo prazo
✔ conecta regra com uso real

🧠 REGRA DE OURO DO VERBETTA

1 texto + 1 reflexão + 1 produção = turno perfeito
Sentido antes da forma
Erro é diagnóstico, não punição moral
Sempre perguntar "o que você quis dizer?"
Nunca escrever o texto pelo aluno
```

- [ ] **A2.2** Commit: `git add Prompts/VERBETTA.md server/src/personas/VERBETTA.md && git commit -m "feat: adicionar Kit de Blocos VERBETTA (único herói que faltava)"`

---

### Task A3: Atualizar CALCULUS.md

**Files:**
- Modify: `Prompts/CALCULUS.md`
- Modify: `server/src/personas/CALCULUS.md`

A seção a remover começa em `FERRAMENTAS DE APOIO` e vai até `✅ RESUMO OPERACIONAL\n\nBibliotecário = fábrica de peças confiáveis\nAgente de matéria = arquiteto pedagógico` (linha ~455).

Substituir por a seção SUPER_PROVA do Task A1. O Kit de Blocos (abaixo da linha de PEDAGOGIA) permanece intacto.

- [ ] **A3.1** Em `Prompts/CALCULUS.md` e `server/src/personas/CALCULUS.md`:
  - Remover bloco entre `FERRAMENTAS DE APOIO` e `PEDAGOGIA (CONSTRUTIVISMO)` (exclusive)
  - Inserir seção SUPER_PROVA no lugar

- [ ] **A3.2** Verificar que Kit de Blocos (linhas 547+) permanece inalterado

- [ ] **A3.3** Commit: `git commit -m "refactor: CALCULUS — substituir AGENTE_BIBLIOTECARIO por SUPER_PROVA"`

---

### Task A4: Atualizar VERBETTA.md (SUPER_PROVA)

**Files:**
- Modify: `Prompts/VERBETTA.md`
- Modify: `server/src/personas/VERBETTA.md`

Mesma operação: remover bloco AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA. VERBETTA já terá o Kit de Blocos adicionado na Task A2.

A seção a remover começa em `FERRAMENTAS DE APOIO` (linha ~308) e vai até `✅ RESUMO OPERACIONAL\n\nBibliotecário = fábrica de peças confiáveis\nAgente de matéria = arquiteto pedagógico`.

- [ ] **A4.1** Remover AGENTE_BIBLIOTECARIO de VERBETTA.md e inserir SUPER_PROVA
- [ ] **A4.2** Verificar que PEDAGOGIA (CONSTRUTIVISMO EM LINGUAGEM) está imediatamente após SUPER_PROVA
- [ ] **A4.3** Commit: `git commit -m "refactor: VERBETTA — substituir AGENTE_BIBLIOTECARIO por SUPER_PROVA"`

---

### Tasks A5-A9: Repetir para NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX

**Padrão idêntico para cada herói:**

- [ ] **A5** NEURON.md — remover AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA, commit
- [ ] **A6** TEMPUS.md — remover AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA, commit
- [ ] **A7** GAIA.md — remover AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA, commit
- [ ] **A8** VECTOR.md — remover AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA, commit
- [ ] **A9** ALKA.md — remover AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA, commit
- [ ] **A10** FLEX.md — remover AGENTE_BIBLIOTECARIO, inserir SUPER_PROVA, commit

**Verificação após cada um:**
- Bloco AGENTE_BIBLIOTECARIO removido completamente (incluindo subseções de imagens, mapas, coordenadas, blocos reutilizáveis, modelo de pedido)
- Seção SUPER_PROVA inserida no lugar
- Kit de Blocos do herói preservado intacto
- TypeScript não é afetado (só .md)

---

### ✅ GO/NO-GO A

**Critério de aprovação:**
- [ ] Leon lê a seção SUPER_PROVA em pelo menos 2 prompts diferentes e confirma que faz sentido pedagógico
- [ ] Leon confirma que os sinais (`sinal_super_prova: "CONSULTAR"` e `"QUIZ"`) são claros para o LLM
- [ ] Nenhum Kit de Blocos foi alterado por engano

**Se aprovado:** continuar para Chunk 2.
**Se não aprovado:** ajustar redação da seção SUPER_PROVA e repetir.

---

## Chunk 2: Fase B — Módulo Super Prova (Backend)

> **GO/NO-GO B:** Após implementar B1-B7, rodar `npx tsc --noEmit` (0 erros) e testar manualmente um turno com KNOWLEDGE_BASE no contexto antes de continuar para os hooks em message.ts.

### Task B1: Migration Supabase — tabela b2c_super_prova_acervo

**Files:**
- Execute SQL via MCP Supabase (`mcp__0150fe87`)

- [ ] **B1.1** Executar migration:

```sql
CREATE TABLE IF NOT EXISTS b2c_super_prova_acervo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serie       text NOT NULL,
  tema_hash   text NOT NULL,
  tema_label  text NOT NULL,
  materia     text NOT NULL,
  heroi_id    text NOT NULL,
  blocos      jsonb NOT NULL,
  fontes      jsonb,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(serie, tema_hash, materia, heroi_id)
);

CREATE INDEX idx_super_prova_acervo_lookup
  ON b2c_super_prova_acervo(serie, tema_hash, materia, heroi_id);
```

- [ ] **B1.2** Verificar que tabela foi criada: `SELECT table_name FROM information_schema.tables WHERE table_name = 'b2c_super_prova_acervo';`

---

### Task B2: fontes-por-materia.ts

**Files:**
- Create: `server/src/super-prova/fontes-por-materia.ts`

- [ ] **B2.1** Criar arquivo:

```typescript
// server/src/super-prova/fontes-por-materia.ts

export interface FonteConfig {
  url: string
  nome: string
}

export const FONTES_POR_MATERIA: Record<string, FonteConfig[]> = {
  matematica: [
    { url: 'https://pt.khanacademy.org', nome: 'Khan Academy Brasil' },
    { url: 'https://mundoeducacao.uol.com.br/matematica', nome: 'Mundo Educação' },
  ],
  portugues: [
    { url: 'https://brasilescola.uol.com.br/gramatica', nome: 'Brasil Escola' },
    { url: 'https://mundoeducacao.uol.com.br/gramatica', nome: 'Mundo Educação' },
  ],
  ciencias_biologia: [
    { url: 'https://pt.wikipedia.org/wiki/Biologia', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/biologia', nome: 'Brasil Escola' },
  ],
  historia: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/historiab', nome: 'Brasil Escola' },
  ],
  geografia: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/geografia', nome: 'Brasil Escola' },
  ],
  fisica: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/fisica', nome: 'Brasil Escola' },
  ],
  quimica: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://mundoeducacao.uol.com.br/quimica', nome: 'Mundo Educação' },
  ],
  idiomas: [
    { url: 'https://dictionary.cambridge.org/pt', nome: 'Cambridge Dictionary PT' },
    { url: 'https://www.britishcouncil.org.br', nome: 'British Council Brasil' },
  ],
}

export function getFontesParaMateria(materia: string): FonteConfig[] {
  return FONTES_POR_MATERIA[materia] ?? []
}
```

---

### Task B3: hero-blocks-config.ts

Define os blocos de cada herói para o prompt de síntese Gemini.

**Files:**
- Create: `server/src/super-prova/hero-blocks-config.ts`

- [ ] **B3.1** Criar arquivo com definições dos blocos de cada herói:

```typescript
// server/src/super-prova/hero-blocks-config.ts

export interface HeroBlockDefinition {
  id: string
  nome: string
  descricao: string
  exemplo: string
}

export const HERO_BLOCKS: Record<string, HeroBlockDefinition[]> = {
  CALCULUS: [
    { id: 'concreto_abstrato', nome: 'Concreto → Abstrato', descricao: 'Situação real que leva ao conceito matemático', exemplo: '3 caixas com 4 lápis → 3 × 4' },
    { id: 'visual_texto', nome: 'Visual em Texto', descricao: 'Representação visual usando texto/ASCII', exemplo: 'Arrays, frações em pizza, contas armadas' },
    { id: 'passo_a_passo', nome: 'Passo a Passo Visível', descricao: 'Algoritmo com sentido, numerado', exemplo: '1️⃣ identificar 2️⃣ escolher operação 3️⃣ calcular 4️⃣ conferir' },
    { id: 'erro_como_pista', nome: 'Erro como Pista', descricao: 'Diagnóstico do erro sem julgamento', exemplo: 'Esse resultado mostra que você juntou em vez de repartir' },
    { id: 'micro_desafio', nome: 'Micro-Desafio', descricao: 'Pergunta prática para o aluno resolver', exemplo: 'Desenha mentalmente 4 grupos de 5' },
    { id: 'checagem_sentido', nome: 'Checagem de Sentido', descricao: 'Verificação do resultado no contexto', exemplo: 'Seu número faz sentido para a história?' },
  ],
  VERBETTA: [
    { id: 'ancora_sentido', nome: 'Âncora de Sentido', descricao: 'Interpretação do sentido antes da regra gramatical', exemplo: 'O que esse texto quer dizer antes de analisar a gramática' },
    { id: 'antes_depois', nome: 'Antes e Depois', descricao: 'Comparação de versão original vs corrigida', exemplo: 'Antes: "fui na casa" → Depois: "fui à casa"' },
    { id: 'funcao_linguistica', nome: 'Função Linguística Visível', descricao: 'Marcação visual das funções na frase', exemplo: '[Sujeito] [Verbo] [Advérbio]' },
    { id: 'estrutura_textual', nome: 'Estrutura Textual', descricao: 'Organização do texto antes de escrever', exemplo: 'Introdução → Desenvolvimento → Conclusão' },
    { id: 'micro_producao', nome: 'Micro-Desafio de Produção', descricao: 'Aluno cria uma frase/parágrafo curto', exemplo: 'Escreva uma frase usando a regra vista' },
  ],
  NEURON: [
    { id: 'observacao_cotidiano', nome: 'Observação do Cotidiano', descricao: 'Fenômeno observável que ancora o conceito', exemplo: 'Quando você corre, o coração bate mais rápido' },
    { id: 'hipotese_simples', nome: 'Hipótese Simples', descricao: 'Ideia possível antes da explicação científica', exemplo: 'Uma ideia possível é que o corpo precise de mais energia' },
    { id: 'explicacao_cientifica', nome: 'Explicação Científica Curta', descricao: '1 conceito científico explicado claramente', exemplo: 'Os músculos precisam de oxigênio → coração acelera' },
    { id: 'visual_processo', nome: 'Visual em Texto (Processo)', descricao: 'Diagrama ASCII de sistema ou ciclo', exemplo: 'Pulmões → sangue → músculos' },
    { id: 'causa_consequencia', nome: 'Causa e Consequência', descricao: 'Relação lógica Se X então Y', exemplo: 'Se o coração não acelerasse, os músculos ficariam sem energia' },
    { id: 'micro_desafio', nome: 'Micro-Desafio Investigativo', descricao: 'Pergunta investigativa para o aluno', exemplo: 'O que aconteceria se corrêssemos ainda mais rápido?' },
  ],
  TEMPUS: [
    { id: 'localizacao_tempo', nome: 'Localização no Tempo', descricao: 'Situa o aluno no período histórico', exemplo: 'Estamos falando de um período em que...' },
    { id: 'contexto_historico', nome: 'Contexto Histórico', descricao: 'Situação social/econômica/cultural básica', exemplo: 'A Europa estava dividida entre potências imperialistas' },
    { id: 'processo_historico', nome: 'Processo Histórico', descricao: 'Explica mudança ou permanência histórica', exemplo: 'A revolução não foi um evento único, mas um processo de...' },
    { id: 'visual_temporal', nome: 'Visual Temporal em Texto', descricao: 'Linha do tempo ou comparação temporal ASCII', exemplo: 'Antes → Durante → Depois | [1933] → [1939] → [1945]' },
    { id: 'causa_consequencia', nome: 'Causa e Consequência', descricao: 'Cadeia histórica de causas e efeitos', exemplo: 'Isso aconteceu porque... → Isso gerou...' },
    { id: 'multiplos_atores', nome: 'Múltiplos Atores', descricao: 'Diferentes grupos que viveram o processo', exemplo: 'Para os judeus... Para os alemães comuns... Para os aliados...' },
  ],
  GAIA: [
    { id: 'do_conhecido_ao_global', nome: 'Do Conhecido ao Global', descricao: 'Escalas progressivas do bairro ao mundo', exemplo: 'Seu bairro → cidade → país → mundo' },
    { id: 'conceito_sentido', nome: 'Conceito + Sentido', descricao: 'Definição com propósito e uso real', exemplo: 'Território não é só área no mapa — é espaço controlado' },
    { id: 'cadeia_causa', nome: 'Cadeia Causa → Consequência', descricao: 'Relação geográfica em cadeia', exemplo: 'Desmatamento ↑ → umidade ↓ → chuva ↓' },
    { id: 'mapa_mental_texto', nome: 'Mapa Mental em Texto', descricao: 'Perfil altimétrico ou espacial em ASCII', exemplo: '🌊 Litoral ⛰️ Serra ☀️ Interior' },
    { id: 'comparacao_regioes', nome: 'Comparação A × B', descricao: 'Quadro comparativo de climas/regiões/países', exemplo: 'Equatorial: chuva frequente | Semiárido: chuva irregular' },
  ],
  VECTOR: [
    { id: 'cena_cotidiano', nome: 'Cena do Cotidiano', descricao: 'Situação física do dia a dia como ponto de partida', exemplo: 'Imagina empurrar um carrinho de supermercado...' },
    { id: 'explicacao_conceitual', nome: 'Explicação Conceitual', descricao: 'Fenômeno antes da fórmula', exemplo: 'Força é a causa da mudança de movimento' },
    { id: 'diagrama_forcas', nome: 'Diagrama de Forças ASCII', descricao: 'FBD com setas e nomes', exemplo: 'N↑ [bloco] → F\n← atrito\n↓ P' },
    { id: 'grafico_mini', nome: 'Mini-Gráfico ASCII', descricao: 'Gráfico v×t ou s×t qualitativo', exemplo: 'v| ────── t (velocidade constante)' },
    { id: 'cadeia_causa', nome: 'Cadeia Causa → Efeito', descricao: 'Relação física lógica', exemplo: 'Força resultante ↑ → aceleração ↑' },
  ],
  ALKA: [
    { id: 'observacao_cotidiano', nome: 'Observação do Cotidiano', descricao: 'Fenômeno químico do dia a dia', exemplo: 'Um prego enferruja mas um copo de vidro não' },
    { id: 'hipotese_simples', nome: 'Hipótese Simples', descricao: 'Ideia antes da explicação química', exemplo: 'Uma ideia possível é que o material reagiu com algo do ambiente' },
    { id: 'explicacao_quimica', nome: 'Explicação Química Curta', descricao: '1 conceito químico por vez', exemplo: 'Na ferrugem, o ferro reage com o oxigênio formando nova substância' },
    { id: 'visual_modelo', nome: 'Visual em Texto (Modelo Mental)', descricao: 'Representação da transformação química', exemplo: 'Ferro + Oxigênio → Ferrugem (nova substância)' },
    { id: 'causa_consequencia', nome: 'Causa e Consequência', descricao: 'Se reação química → o quê muda', exemplo: 'Se ocorre reação química, a matéria muda de identidade' },
  ],
  FLEX: [
    { id: 'situacao_uso', nome: 'Situação Real de Uso', descricao: 'Contexto comunicativo real do idioma', exemplo: 'Em inglês, quando queremos pedir algo educadamente...' },
    { id: 'frase_modelo', nome: 'Frase Modelo Curta', descricao: 'Exemplo simples e funcional na língua', exemplo: 'Could you help me? / ¿Puedes ayudarme?' },
    { id: 'ponte_significado', nome: 'Ponte de Significado', descricao: 'Tradução/explicação do sentido em português', exemplo: '"Could" aqui não é passado — é pedido educado' },
    { id: 'padrao_linguistico', nome: 'Padrão Linguístico', descricao: 'Estrutura sem jargão técnico', exemplo: 'Could + you + verbo? = pedido educado' },
    { id: 'micro_producao', nome: 'Micro-Produção do Aluno', descricao: 'Aluno cria frase curta no idioma', exemplo: 'Como você diria "posso sentar aqui?" em inglês?' },
  ],
}

export function getHeroBlocks(heroiId: string): HeroBlockDefinition[] {
  return HERO_BLOCKS[heroiId] ?? []
}
```

---

### Task B4: gerar-acervo.ts

O coração do Super Prova. Chama Gemini com Google Search Grounding e retorna blocos estruturados.

**Files:**
- Create: `server/src/super-prova/gerar-acervo.ts`
- Read first: `server/src/core/llm.ts` (para usar SDK Gemini corretamente)

- [ ] **B4.1** Ler `server/src/core/llm.ts` e identificar:
  - Como `GoogleGenerativeAI` é instanciado
  - Como `tools: [{ googleSearch: {} }]` é usado em PROFESSOR_IA
  - Como fazer `generateContent` (não stream) com grounding

- [ ] **B4.2** Criar `server/src/super-prova/gerar-acervo.ts`:

```typescript
// server/src/super-prova/gerar-acervo.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getFontesParaMateria } from './fontes-por-materia.js'
import { getHeroBlocks, HeroBlockDefinition } from './hero-blocks-config.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export interface AcervoGerado {
  blocos: Record<string, string>  // blockId → conteúdo estruturado
  fontes: string[]
  geradoEm: string
}

function montarPromptSintese(
  tema: string,
  serie: string,
  materia: string,
  heroiId: string,
  blocos: HeroBlockDefinition[],
  fontesTexto: string
): string {
  const blocosDescricao = blocos
    .map(b => `- **${b.nome}** (id: ${b.id}): ${b.descricao}. Exemplo: "${b.exemplo}"`)
    .join('\n')

  return `Você é um assistente pedagógico especializado em educação básica brasileira (BNCC).

Crie uma base de conhecimento sobre "${tema}" para alunos do ${serie}, estruturada para o professor ${heroiId}.

## Conteúdo adicional disponível (fontes garantidas)
${fontesTexto || 'Sem fontes adicionais — use apenas o Google Search.'}

## Blocos didáticos do professor ${heroiId}

${blocosDescricao}

## Sua tarefa

Retorne um JSON com exatamente este formato:
{
  "blocos": {
    "id_do_bloco": "conteúdo rico e específico sobre ${tema} neste formato didático...",
    ... (um campo para cada bloco listado acima)
  },
  "fontes": ["url1", "url2", ...]
}

Regras:
- Cada bloco deve ter conteúdo ESPECÍFICO sobre "${tema}", não genérico
- Use linguagem adequada ao ${serie}
- Alinhamento com BNCC quando relevante
- Inclua fatos concretos, datas importantes, exemplos didáticos
- Para blocos de visual/diagrama, use ASCII simples
- Máximo 300 caracteres por bloco (será expandido pelo professor)
- Retorne SOMENTE o JSON, sem markdown ao redor`
}

async function buscarFontesFixas(materia: string, tema: string): Promise<string> {
  const fontes = getFontesParaMateria(materia)
  if (fontes.length === 0) return ''

  // Fetch simples das fontes principais — apenas título da página
  // O Gemini grounding buscará o conteúdo completo
  const nomeFontes = fontes.map(f => `${f.nome} (${f.url})`).join(', ')
  return `Fontes pedagógicas de referência para esta matéria: ${nomeFontes}. Priorize conteúdo dessas fontes quando disponível.`
}

export async function gerarAcervo(
  tema: string,
  serie: string,
  materia: string,
  heroiId: string
): Promise<AcervoGerado> {
  const blocos = getHeroBlocks(heroiId)
  const fontesTexto = await buscarFontesFixas(materia, tema)

  const prompt = montarPromptSintese(tema, serie, materia, heroiId, blocos, fontesTexto)

  // Gemini com Google Search Grounding (igual ao PROFESSOR_IA)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} }] as any,
  })

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Extrair JSON da resposta
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`Gemini não retornou JSON válido para tema: ${tema}`)
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    blocos: Record<string, string>
    fontes: string[]
  }

  return {
    blocos: parsed.blocos ?? {},
    fontes: parsed.fontes ?? [],
    geradoEm: new Date().toISOString(),
  }
}
```

---

### Task B5: consultar.ts

Handler para o sinal [CONSULTAR] — consulta pontual sobre subtema.

**Files:**
- Create: `server/src/super-prova/consultar.ts`

- [ ] **B5.1** Criar arquivo:

```typescript
// server/src/super-prova/consultar.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export interface ResultadoConsulta {
  query: string
  resposta: string
  fontes: string[]
}

export async function consultarKnowledgeBase(
  query: string,
  tema: string,
  serie: string,
  heroiId: string
): Promise<ResultadoConsulta> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} }] as any,
  })

  const prompt = `Você é um assistente pedagógico. O professor ${heroiId} está ensinando sobre "${tema}" para alunos do ${serie} e precisa de informação específica.

Consulta: "${query}"

Responda de forma rica, precisa e adequada ao ${serie}. Máximo 500 caracteres.
Inclua fatos concretos, datas ou dados verificados quando relevante.
Retorne apenas o texto da resposta (sem JSON).`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Extrair fontes das grounding metadata se disponível
  const fontes: string[] = []
  try {
    const candidates = result.response.candidates ?? []
    for (const candidate of candidates) {
      const groundingMeta = (candidate as any).groundingMetadata
      if (groundingMeta?.searchEntryPoint) {
        fontes.push(groundingMeta.searchEntryPoint.renderedContent ?? '')
      }
    }
  } catch {
    // fail silently — fontes são opcionais
  }

  return { query, resposta: text.trim(), fontes }
}
```

---

### Task B6: gerar-quiz.ts

Gera QuizQuestion[] baseado no tema da conversa.

**Files:**
- Create: `server/src/super-prova/gerar-quiz.ts`

- [ ] **B6.1** Criar arquivo:

```typescript
// server/src/super-prova/gerar-quiz.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export interface QuizQuestion {
  id: string
  pergunta: string
  opcoes: Array<{ valor: string; texto: string }>
  resposta: string[]  // valores corretos
  explicacao: string
}

export interface QuizGerado {
  tema: string
  serie: string
  questoes: QuizQuestion[]
}

export async function gerarQuiz(
  tema: string,
  serie: string,
  materia: string,
  resumoConversa: string
): Promise<QuizGerado> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  })

  const prompt = `Crie um quiz educacional sobre "${tema}" para alunos do ${serie} (matéria: ${materia}).

Contexto da conversa que aconteceu: ${resumoConversa}

Gere exatamente 4 questões de múltipla escolha.

Retorne um JSON com este formato EXATO:
{
  "questoes": [
    {
      "id": "q1",
      "pergunta": "texto da pergunta",
      "opcoes": [
        {"valor": "A", "texto": "texto opção A"},
        {"valor": "B", "texto": "texto opção B"},
        {"valor": "C", "texto": "texto opção C"},
        {"valor": "D", "texto": "texto opção D"}
      ],
      "resposta": ["A"],
      "explicacao": "Explicação breve do porquê A é correto"
    }
  ]
}

Regras:
- 4 questões, dificuldade progressiva (fácil → médio → médio → difícil)
- 4 alternativas por questão
- Somente 1 resposta correta por questão
- Explicação de 1-2 frases
- Linguagem adequada ao ${serie}
- Retorne SOMENTE o JSON`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`Gemini não retornou JSON de quiz válido para tema: ${tema}`)
  }

  const parsed = JSON.parse(jsonMatch[0]) as { questoes: QuizQuestion[] }

  return {
    tema,
    serie,
    questoes: parsed.questoes ?? [],
  }
}
```

---

### Task B7: index.ts — API pública do módulo

**Files:**
- Create: `server/src/super-prova/index.ts`
- Read: `server/src/db/persistence.ts` (para ver padrão Supabase)

- [ ] **B7.1** Ler persistence.ts para entender padrão de acesso ao Supabase

- [ ] **B7.2** Criar `server/src/super-prova/index.ts`:

```typescript
// server/src/super-prova/index.ts
// Módulo autônomo — fail-silently em todos os métodos públicos
// NÃO importar diretamente em message.ts sem try/catch

import { supabase } from '../db/supabase.js'
import { gerarAcervo, AcervoGerado } from './gerar-acervo.js'
import { consultarKnowledgeBase, ResultadoConsulta } from './consultar.js'
import { gerarQuiz, QuizGerado } from './gerar-quiz.js'

// Normaliza tema para hash de cache
function normalizarTema(tema: string): string {
  return tema
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

// Hook 1: Verificar cache ou gerar acervo (chamado após PSICO detectar tema)
export async function obterOuGerarAcervo(
  tema: string,
  serie: string,
  materia: string,
  heroiId: string
): Promise<AcervoGerado | null> {
  try {
    const temaHash = normalizarTema(tema)

    // Verificar cache
    const { data: cached } = await supabase
      .from('b2c_super_prova_acervo')
      .select('blocos, fontes, created_at')
      .eq('serie', serie)
      .eq('tema_hash', temaHash)
      .eq('materia', materia)
      .eq('heroi_id', heroiId)
      .single()

    if (cached) {
      return {
        blocos: cached.blocos as Record<string, string>,
        fontes: cached.fontes as string[],
        geradoEm: cached.created_at as string,
      }
    }

    // Gerar novo acervo
    const acervo = await gerarAcervo(tema, serie, materia, heroiId)

    // Salvar no cache
    await supabase.from('b2c_super_prova_acervo').upsert({
      serie,
      tema_hash: temaHash,
      tema_label: tema,
      materia,
      heroi_id: heroiId,
      blocos: acervo.blocos,
      fontes: acervo.fontes,
    })

    return acervo
  } catch (err) {
    console.error('[SuperProva] Erro ao obter/gerar acervo:', err)
    return null  // fail-silently — não quebra o fluxo principal
  }
}

// Formatar blocos para injeção no contexto do herói
export function formatarKnowledgeBase(acervo: AcervoGerado): string {
  const linhas = Object.entries(acervo.blocos)
    .map(([id, conteudo]) => `[${id.toUpperCase()}]: ${conteudo}`)
    .join('\n')
  return `KNOWLEDGE_BASE:\n${linhas}`
}

// Hook 2: Processar sinal CONSULTAR
export async function processarConsulta(
  query: string,
  tema: string,
  serie: string,
  heroiId: string
): Promise<ResultadoConsulta | null> {
  try {
    const materia = heroiIdParaMateria(heroiId)
    return await consultarKnowledgeBase(query, tema, serie, heroiId)
  } catch (err) {
    console.error('[SuperProva] Erro na consulta:', err)
    return null
  }
}

// Hook 3: Processar sinal QUIZ
export async function processarQuiz(
  tema: string,
  serie: string,
  heroiId: string,
  resumoConversa: string
): Promise<QuizGerado | null> {
  try {
    const materia = heroiIdParaMateria(heroiId)
    return await gerarQuiz(tema, serie, materia, resumoConversa)
  } catch (err) {
    console.error('[SuperProva] Erro na geração de quiz:', err)
    return null
  }
}

function heroiIdParaMateria(heroiId: string): string {
  const mapa: Record<string, string> = {
    CALCULUS: 'matematica',
    VERBETTA: 'portugues',
    NEURON: 'ciencias_biologia',
    TEMPUS: 'historia',
    GAIA: 'geografia',
    VECTOR: 'fisica',
    ALKA: 'quimica',
    FLEX: 'idiomas',
  }
  return mapa[heroiId] ?? 'geral'
}
```

---

### Task B8: Hooks em message.ts

3 pontos de integração no fluxo principal. **NUNCA bloquear o stream SSE.**

**Files:**
- Modify: `server/src/routes/message.ts`
- Read first: `server/src/routes/message.ts` completo

- [ ] **B8.1** Ler message.ts completo para mapear os pontos exatos de inserção

- [ ] **B8.2** Identificar:
  - Onde o tema do PSICO é detectado/retornado (após cascata PSICO)
  - Onde o `reply_text` do herói é processado (response-processor)
  - Onde o JSON do herói é parseado (para ler `sinal_super_prova`)

- [ ] **B8.3** Adicionar imports no topo de message.ts:
```typescript
import {
  obterOuGerarAcervo,
  formatarKnowledgeBase,
  processarConsulta,
  processarQuiz,
} from '../super-prova/index.js'
```

- [ ] **B8.4** Hook 1 — após PSICO retornar o plano pedagógico e heroiId definido:
```typescript
// SUPER PROVA — Hook 1: gerar/buscar acervo em background (não bloqueia SSE)
// Executar APENAS se o tema mudou (nova matéria detectada)
if (temaDetectado && temaDetectado !== sessaoAtual.tema_atual) {
  obterOuGerarAcervo(temaDetectado, serie, materia, heroiId)
    .then(acervo => {
      if (acervo) {
        // Injetar no contexto do PRÓXIMO turno — este turno já foi montado
        // Salvar em sessaoAtual.super_prova_knowledge para próximo turno
        void persistirKnowledgeBase(sessao_id, formatarKnowledgeBase(acervo))
      }
    })
    .catch(() => {}) // fail-silently
}
```

- [ ] **B8.5** Hook 2 — após parsear JSON do herói, checar `sinal_super_prova`:
```typescript
// SUPER PROVA — Hook 2: processar sinal CONSULTAR (não bloqueia stream atual)
if (heroJson?.sinal_super_prova === 'CONSULTAR' && heroJson?.super_prova_query) {
  processarConsulta(heroJson.super_prova_query, temaAtual, serie, heroiId)
    .then(resultado => {
      if (resultado) {
        void persistirConsultaResultado(sessao_id, resultado.resposta)
      }
    })
    .catch(() => {})
}
```

- [ ] **B8.6** Hook 3 — processar sinal QUIZ (este SIM envia SSE imediatamente):
```typescript
// SUPER PROVA — Hook 3: processar sinal QUIZ (envia SSE event 'quiz')
if (heroJson?.sinal_super_prova === 'QUIZ') {
  processarQuiz(temaAtual, serie, heroiId, resumoConversa)
    .then(quiz => {
      if (quiz) {
        res.write(`event: quiz\ndata: ${JSON.stringify(quiz)}\n\n`)
      }
    })
    .catch(() => {})
}
```

- [ ] **B8.7** Injetar `KNOWLEDGE_BASE` e `CONSULTA_RESULTADO` no contexto quando disponíveis:
```typescript
// No montador de contexto (context.ts ou antes de chamarLLMStream):
const knowledgeBase = await buscarKnowledgeBase(sessao_id)
const consultaResultado = await buscarConsultaResultado(sessao_id)

if (knowledgeBase) {
  contextoFinal += `\n\n${knowledgeBase}`
}
if (consultaResultado) {
  contextoFinal += `\n\nCONSULTA_RESULTADO: ${consultaResultado}`
  // Limpar após usar (one-shot)
  void limparConsultaResultado(sessao_id)
}
```

- [ ] **B8.8** Adicionar funções de persistência em `persistence.ts`:
```typescript
// Persistir knowledge base na sessão atual
export async function persistirKnowledgeBase(sessaoId: string, kb: string): Promise<void>
// Buscar knowledge base da sessão
export async function buscarKnowledgeBase(sessaoId: string): Promise<string | null>
// Persistir resultado de consulta (one-shot)
export async function persistirConsultaResultado(sessaoId: string, resultado: string): Promise<void>
// Buscar resultado de consulta
export async function buscarConsultaResultado(sessaoId: string): Promise<string | null>
// Limpar resultado de consulta após uso
export async function limparConsultaResultado(sessaoId: string): Promise<void>
```

Implementar como campos em `b2c_sessoes` (migration para adicionar colunas):
```sql
ALTER TABLE b2c_sessoes
  ADD COLUMN IF NOT EXISTS super_prova_kb text,
  ADD COLUMN IF NOT EXISTS super_prova_consulta_resultado text;
```

- [ ] **B8.9** Atualizar `instrucaoFormatoPorPersona` em `llm.ts` para os 8 heróis:
  - Adicionar `sinal_super_prova` e `super_prova_query` como campos opcionais no exemplo JSON dos heróis
  - Garantir que o LLM sabe que pode emitir esses campos

- [ ] **B8.10** Rodar TypeScript check:
```bash
cd server && npx tsc --noEmit
```
Expected: 0 errors

- [ ] **B8.11** Commit: `git commit -m "feat: super-prova módulo completo + hooks em message.ts"`

---

### ✅ GO/NO-GO B

**Critério de aprovação (testar manualmente):**

- [ ] `npx tsc --noEmit` → 0 erros
- [ ] Enviar mensagem de história → verificar no Supabase que `b2c_super_prova_acervo` foi populado
- [ ] No turno seguinte, verificar que `KNOWLEDGE_BASE:` aparece no contexto (log server)
- [ ] Emitir `sinal_super_prova: "QUIZ"` manualmente → verificar SSE event `quiz` recebido

**Se aprovado:** continuar para Chunk 3.
**Se não aprovado:** depurar usando `superpowers:systematic-debugging`.

---

## Chunk 3: Fase C — Frontend QuizCard

> **GO/NO-GO C:** QuizCard renderiza corretamente com quiz mockado, mostra gabarito após resposta, e recebe o SSE `quiz` event real de uma sessão de teste.

### Task C1: QuizCard component

**Files:**
- Create: `web/src/components/QuizCard.tsx`

- [ ] **C1.1** Criar componente:

```tsx
// web/src/components/QuizCard.tsx
import { useState } from 'react'

interface QuizQuestion {
  id: string
  pergunta: string
  opcoes: Array<{ valor: string; texto: string }>
  resposta: string[]
  explicacao: string
}

interface QuizCardProps {
  tema: string
  serie: string
  questoes: QuizQuestion[]
  onFechar: () => void
}

export function QuizCard({ tema, serie, questoes, onFechar }: QuizCardProps) {
  const [atual, setAtual] = useState(0)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  const [pontos, setPontos] = useState(0)
  const [finalizado, setFinalizado] = useState(false)

  const questao = questoes[atual]
  const isCorreta = selecionada !== null && questao.resposta.includes(selecionada)

  function confirmar() {
    if (!selecionada) return
    if (isCorreta) setPontos(p => p + 1)
    setMostrarGabarito(true)
  }

  function proxima() {
    if (atual + 1 >= questoes.length) {
      setFinalizado(true)
    } else {
      setAtual(a => a + 1)
      setSelecionada(null)
      setMostrarGabarito(false)
    }
  }

  if (finalizado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Quiz concluído!</h3>
          <p className="text-gray-600 mb-4">{tema}</p>
          <p className="text-3xl font-bold text-emerald-600 mb-6">
            {pontos}/{questoes.length}
          </p>
          <button
            onClick={onFechar}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold"
          >
            Continuar estudando
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500 font-medium">
            {atual + 1}/{questoes.length} · {tema}
          </span>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Pergunta */}
        <p className="text-gray-800 font-semibold text-base mb-4 leading-snug">
          {questao.pergunta}
        </p>

        {/* Opções */}
        <div className="space-y-2 mb-4">
          {questao.opcoes.map(opcao => {
            let estilo = 'border-2 border-gray-200 text-gray-700'
            if (selecionada === opcao.valor && !mostrarGabarito) {
              estilo = 'border-2 border-blue-500 bg-blue-50 text-blue-800'
            } else if (mostrarGabarito && questao.resposta.includes(opcao.valor)) {
              estilo = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800'
            } else if (mostrarGabarito && selecionada === opcao.valor && !questao.resposta.includes(opcao.valor)) {
              estilo = 'border-2 border-red-400 bg-red-50 text-red-700'
            }

            return (
              <button
                key={opcao.valor}
                disabled={mostrarGabarito}
                onClick={() => setSelecionada(opcao.valor)}
                className={`w-full text-left p-3 rounded-xl text-sm transition-all ${estilo}`}
              >
                <span className="font-bold mr-2">{opcao.valor}.</span>
                {opcao.texto}
              </button>
            )
          })}
        </div>

        {/* Explicação */}
        {mostrarGabarito && (
          <div className={`p-3 rounded-xl text-sm mb-4 ${isCorreta ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            <span className="font-semibold mr-1">{isCorreta ? '✅ Correto!' : '📖 Quase!'}</span>
            {questao.explicacao}
          </div>
        )}

        {/* Botões */}
        {!mostrarGabarito ? (
          <button
            onClick={confirmar}
            disabled={!selecionada}
            className="w-full bg-blue-600 disabled:bg-gray-200 text-white disabled:text-gray-400 py-3 rounded-xl font-semibold"
          >
            Confirmar
          </button>
        ) : (
          <button
            onClick={proxima}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold"
          >
            {atual + 1 >= questoes.length ? 'Ver resultado' : 'Próxima →'}
          </button>
        )}
      </div>
    </div>
  )
}
```

---

### Task C2: Integrar QuizCard no ChatPage

**Files:**
- Modify: `web/src/pages/ChatPage.tsx`
- Modify: `web/src/api/chat.ts` (handle SSE event 'quiz')
- Modify: `web/src/contexts/ChatContext.tsx` (estado do quiz ativo)

- [ ] **C2.1** Em `ChatContext.tsx`, adicionar estado:
```typescript
const [quizAtivo, setQuizAtivo] = useState<QuizGerado | null>(null)
```

- [ ] **C2.2** Em `chat.ts` (handler SSE), adicionar case para event `quiz`:
```typescript
case 'quiz':
  const quizData = JSON.parse(data) as QuizGerado
  onQuiz?.(quizData)
  break
```

- [ ] **C2.3** Em `ChatPage.tsx`, renderizar QuizCard quando `quizAtivo !== null`:
```tsx
{quizAtivo && (
  <QuizCard
    tema={quizAtivo.tema}
    serie={quizAtivo.serie}
    questoes={quizAtivo.questoes}
    onFechar={() => setQuizAtivo(null)}
  />
)}
```

- [ ] **C2.4** Verificar TypeScript: `cd web && npx tsc --noEmit` → 0 erros

- [ ] **C2.5** Commit: `git commit -m "feat: QuizCard frontend + SSE quiz event handler"`

---

### ✅ GO/NO-GO C (Gate Super Prova)

**Teste E2E completo:**

- [ ] Login como Layla (7ª série)
- [ ] Perguntar sobre Segunda Guerra Mundial → verificar KNOWLEDGE_BASE no log do servidor
- [ ] No 2º turno, Tempus responde com conteúdo enriquecido → verificar visualmente
- [ ] Tempus emite `sinal_super_prova: "CONSULTAR"` sobre subtema → verificar CONSULTA_RESULTADO disponível no 3º turno
- [ ] Confirmar quiz com Tempus → QuizCard aparece na interface
- [ ] QuizCard: responder 4 questões → resultado final exibido
- [ ] Testar outra matéria (ex.: CALCULUS com frações) → acervo criado separadamente

**Se aprovado:** `Gate Super Prova PASSED ✅` → atualizar CHECKLIST e MEMORIA_CURTA → Escape Hatch para git push.
**Se não aprovado:** usar `superpowers:systematic-debugging` para cada item que falhou.

---

## Persistência (Ralph Loop)

Após cada Go/No-Go aprovado:

```bash
# Atualizar docs/CHECKLIST_PROJETO.md — marcar tasks completadas
# Atualizar docs/MEMORIA_CURTA.md — novo estado
# Atualizar docs/LOG_ERROS.md — qualquer erro encontrado
```

## Escape Hatch — Git Push Final

Após Gate Super Prova PASSED, montar prompt para Leon rodar no Claude Code CLI:

```
Execute no terminal local:
1. cd "C:\Users\Leon\Desktop\SuperAgentes_B2C_V2"
2. git add -A
3. git commit -m "feat: Super Prova — Gemini grounding + blocos didáticos + QuizCard"
4. git push origin main

Mostre o output de cada passo.
```
