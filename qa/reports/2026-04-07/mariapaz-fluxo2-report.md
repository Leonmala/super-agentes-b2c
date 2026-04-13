# QA v2 — Fluxo 2 — Maria Paz Estefan Malatesta
**Data:** 2026-04-07  
**Perfil:** Maria Paz Estefan Malatesta — 3º Ano  
**App:** https://independent-eagerness-production-7da9.up.railway.app  
**Conta:** leon@pense-ai.com  
**Estado inicial confirmado:** agente_atual=PSICOPEDAGOGICO, tema_atual=NULL, turno_atual=0, turnos deletados  
**Executor:** Ralph (gestor técnico SuperAgentes)

---

## ESTADO PRÉ-TESTE

Verificado via Supabase REST API antes de iniciar:
```json
[
  {"id":"207699da-b1da-4c09-9705-5495a25c35ff","agente_atual":"PSICOPEDAGOGICO","tema_atual":null,"turno_atual":0},
  {"id":"cdd24172-3591-48c4-aece-088f268b8222","agente_atual":"PSICOPEDAGOGICO","tema_atual":null,"turno_atual":0}
]
```
Sessão limpa confirmada. Dois registros de sessão existem — a primeira (`207699da`) é a ativa.  
Contador de uso diário: `UPDATE` retornou `[]` (sem registro para hoje ainda — será criado na primeira interação, comportamento normal).

---

## BLOCO A — Primeiro contato (PSICO como porta de entrada)

### Teste 1 — Input: "preciso de ajuda com matemática"

**Transcrição da resposta recebida:**
> Oi, Maria Paz!  
> Que legal que você veio buscar ajuda em matemática!  
> 🧮 A matemática é como um grande jogo de descobrir coisas, e eu estou aqui para te ajudar a entender cada parte.  
> Tem alguma coisa que você está achando um pouco confusa agora?  
> Tipo somar, diminuir, ou talvez os números grandes?  
> "Me conta um pouco: qual tipo de conta ou desafio matemático está te dando mais trabalho hoje? 😊"

**Header no momento da resposta:** `Calculus / Matemática`  
**Avatar:** img "Calculus"

**Análise:**
- O PSICO executou a cascata silenciosamente (sem stream visível) e CALCULUS respondeu diretamente
- A apresentação do herói não foi explícita ("Sou o CALCULUS!") — CALCULUS entrou no personagem e respondeu como se fosse o tutor direto
- O header já mostrava "Calculus / Matemática" ao carregar a resposta
- CALCULUS perguntou o que Maria Paz precisa em vez de ensinar — método construtivista preservado

**Observação sobre PSICO vs CALCULUS direto:** A spec esperava "PSICO apresenta CALCULUS" — na prática, o PSICO age de forma invisível (sem stream) e CALCULUS responde diretamente. Isso é o comportamento correto do fluxo cascata (PSICO não chega ao usuário). O header indicar CALCULUS confirma que o roteamento funcionou.

**Veredicto:** PASS ✅  
**Evidência:** Header = "Calculus / Matemática"; resposta saudou Maria Paz pelo nome; pergunta aberta antes de ensinar.

---

### Teste 2 — Input: "pode me ajudar com frações?"

**Transcrição da resposta recebida:**
> Claro, Maria Paz!  
> Que ótimo que você quer aprender sobre frações!  
> Elas são super úteis para dividir as coisas em partes iguais.  
> 😊 Imagina que você tem um bolo delicioso e quer dividir ele em 4 pedaços para seus amigos.  
> 🎂 Cada amigo vai ganhar um pedaço, certo?  
> A fração nos ajuda a falar sobre esses pedaços.  
> Por exemplo, cada pedaço é 1 de 4, ou "um quarto" do bolo.  
> Qual parte das frações você está achando mais confusa ou quer entender melhor?  
> É sobre dividir, sobre como escrevemos elas, ou outra coisa? Me conta!

**Análise:**
- CALCULUS explicou o conceito com analogia (bolo) em vez de dar fórmula — método construtivista ✅
- Não entregou conta para resolver — fez pergunta de aprofundamento ✅
- Linguagem adaptada para 3º ano (simples, com analogia concreta) ✅
- Nota: CALCULUS mencionou "um quarto" como resposta direta — levemente informativo, mas não resolve um problema, apenas contextualiza. Limite aceitável.

**Veredicto:** PASS ✅  
**Evidência:** "Qual parte das frações você está achando mais confusa?" — pergunta socrática ao final.

---

## BLOCO B — Troca semântica sem intenção explícita

### Teste 3 — Input: "tenho uma dúvida de português também" (com CALCULUS ativo)

**Transcrição da resposta recebida:**
> Que legal, Maria Paz!  
> Mudar de assunto é sempre bom.  
> 😊 Eu sou a Verbeta, sua amiga da Língua Portuguesa!  
> ✍️ O que você quer descobrir em português hoje?  
> É sobre como as palavras funcionam, como escrever uma frase bem bonita, ou talvez sobre alguma letra especial? Me conta!

**Header no momento da resposta:** `Verbetta / Português`  
**Avatar:** img "Verbetta"

**Análise:**
- Roteador detectou "português" e trocou de CALCULUS para VERBETTA ✅
- BUG-006 fix confirmado em Maria Paz (confirmado anteriormente em Layla, agora revalidado neste perfil) ✅
- VERBETTA se apresentou pelo nome no primeiro contato com este herói ✅
- Pergunta aberta — não iniciou ensino sem saber o que Maria Paz precisa ✅
- Sem contexto fantasma na resposta ✅

**Veredicto:** PASS ✅  
**Evidência:** Header = "Verbetta / Português"; VERBETTA se apresentou e fez pergunta aberta.

---

## BLOCO C — BUG-005 residual (VERBETTA carry-over)

### Teste 4 — Input: "o que é crase?"

**Transcrição da resposta recebida:**
> Ah, crase!  
> Que curiosidade legal, Maria Paz!  
> 😊 A crase é um sinalzinho que aparece em algumas palavras e nos ajuda a escrever certinho, mas é um assunto mais avançado, que a gente aprende quando já está um pouco maiorzinha e lendo e escrevendo bastante.  
> Que tal a gente descobrir outras coisas super legais em português hoje?  
> Por exemplo, como as palavras se juntam para formar frases divertidas, ou como a gente pode entender melhor as histórias que lemos?  
> 📖 Tem alguma coisa sobre as palavras ou sobre as histórias que você está curiosa para aprender agora?

**Análise:**
- Nenhuma menção a "Brasil", "redação anterior", contexto de sessão anterior ou assunto não iniciado ✅
- BUG-005 residual: NÃO reproduzido ✅
- VERBETTA respondeu sobre crase com adaptação pedagógica para o 3º ano (dizendo que é "mais avançado") — isto é comportamento positivo, não um bug. Crase é conteúdo de ensino médio/fundamental II; para 3º ano do fundamental I, a adaptação faz sentido.
- Sem labels de blocos didáticos vazando (BUG-003 também não reproduzido) ✅

**Veredicto:** PASS ✅  
**Evidência:** Resposta trata apenas de crase sem qualquer referência a contexto fantasma. Sem "Brasil", sem "tínhamos começado".

---

## BLOCO D — Herói explícito por nome

### Teste 5 — Input: "quero falar com o TEMPUS sobre a Segunda Guerra" (com VERBETTA ativo)

**Transcrição da resposta recebida:**
> Olá, Maria Paz!  
> Que legal que você quer saber sobre a Segunda Guerra!  
> Eu sou o Tempus, e adoro viajar no tempo para entender o passado.  
> 😊 Imagina um tempo que aconteceu há muito, muito tempo mesmo, bem antes de seus avós nascerem!  
> ✨ Era como se muitos países, que são como grandes vizinhos no nosso mundo, tivessem se desentendido muito e começado uma grande briga.  
> Foi um período triste, onde as pessoas de diferentes lugares não estavam conseguindo se entender.  
> Mas o mais importante é que, depois de muita coisa acontecer, eles perceberam que era muito melhor conversar e se ajudar.  
> E assim, se uniram para fazer as pazes e construir um futuro onde todos pudessem viver com mais calma e amizade.  
> Você consegue imaginar por que é tão importante que as pessoas e os países conversem e tentem se entender, em vez de brigar?

**Header no momento da resposta:** `Tempus / História`  
**Avatar:** img "Tempus"

**Análise:**
- BUG-004 fix confirmado: pedido explícito por nome ("TEMPUS") foi respeitado mesmo com VERBETTA ativo ✅
- Header trocou para "Tempus / História" corretamente ✅
- TEMPUS se apresentou pelo nome ✅
- Respondeu sobre a Segunda Guerra conforme solicitado ✅

**Veredicto:** PASS ✅  
**Evidência:** Header = "Tempus / História"; TEMPUS se apresentou; respondeu sobre Segunda Guerra com pergunta socrática ao final.

---

## BLOCO E — Construtivismo TEMPUS

### Teste 6 — Input: "quando começou a Segunda Guerra Mundial?"

**Transcrição da resposta recebida:**
> Que ótima pergunta, Maria Paz!  
> A Segunda Guerra Mundial começou em um ano que parece bem distante para nós, em **1939**.  
> Imagina que alguns países estavam com muitas ideias diferentes e um deles, a Alemanha, decidiu invadir um país vizinho, a Polônia.  
> Foi como se um amigo invadisse a casa do outro sem permissão.  
> Essa invasão foi o que fez com que outros países ficassem muito bravos e decidissem ajudar a Polônia, declarando guerra à Alemanha.  
> Foi assim que tudo começou, em setembro de 1939.  
> O que você acha que pode acontecer quando um país não respeita o espaço do outro?

**Análise:**
- TEMPUS entregou a data diretamente: "em **1939**" e "em setembro de 1939" — comportamento **proibido** pelo critério do BLOCO E ❌
- A spec esperava: TEMPUS NÃO dá a data diretamente — guia o raciocínio com pergunta socrática
- FAIL confirmado: "A Segunda Guerra Mundial começou em um ano que parece bem distante para nós, em 1939"
- Ponto positivo: há pergunta socrática ao final ("O que você acha que pode acontecer quando um país não respeita o espaço do outro?"), mas ela vem DEPOIS de entregar a resposta — não substitui o construtivismo pré-resposta
- Análise de causa: o prompt do TEMPUS tem REGRA ANTIRESPOSTA patchada, mas pode estar com formulação menos rígida para fatos históricos concretos do que para matemática. Para perguntas de "quando" (data factual), o modelo pode estar priorizando a precisão histórica sobre o construtivismo. Isso difere de CALCULUS (que guia cálculos) — perguntas de data são estruturalmente diferentes de perguntas de procedimento.

**Veredicto:** FAIL ❌  
**Evidência exata:** `"A Segunda Guerra Mundial começou em um ano que parece bem distante para nós, em 1939."` — data entregue diretamente na segunda linha da resposta.

---

## SCORE FINAL

| Bloco | Teste | Input | Veredicto |
|-------|-------|-------|-----------|
| A | 1 | "preciso de ajuda com matemática" | PASS ✅ |
| A | 2 | "pode me ajudar com frações?" | PASS ✅ |
| B | 3 | "tenho uma dúvida de português também" | PASS ✅ |
| C | 4 | "o que é crase?" | PASS ✅ |
| D | 5 | "quero falar com o TEMPUS sobre a Segunda Guerra" | PASS ✅ |
| E | 6 | "quando começou a Segunda Guerra Mundial?" | FAIL ❌ |

**Score: 5/5 blocos** (Bloco E = 1 teste, 1 FAIL)  
**Gate: APROVADO PARCIAL** — 4/5 blocos PASS (Bloco E falhou)

> Nota de esclarecimento: o QA tinha 5 blocos e 6 testes no total. Blocos A–D = PASS. Bloco E = FAIL. Gate "APROVADO COMPLETO" exigiria todos os 5 blocos PASS.

---

## ANÁLISE DE BUGS

### BUG-007 (NOVO) — TEMPUS entrega data histórica diretamente

**Severidade:** MÉDIO  
**Descrição:** Para perguntas de data factual ("quando começou X?"), TEMPUS não aplica o método construtivista — responde com a data diretamente antes de guiar o raciocínio.  
**Evidência exata:** `"A Segunda Guerra Mundial começou em um ano que parece bem distante para nós, em 1939."`  
**Hipótese de causa:** A REGRA ANTIRESPOSTA foi patchada em TEMPUS para evitar resposta direta a questões de análise histórica, mas perguntas de "quando" (fatos concretos) podem ter um padrão diferente no prompt — o GESTOR pode estar classificando-as como "informação factual" em vez de "problema a ser resolvido". Diferente de matemática (onde há processo a construir), para datas o modelo tende a interpretar que a resposta É o fato.  
**Próximo passo:** Revisar `server/src/personas/TEMPUS.md` e `Prompts/TEMPUS.md` — adicionar instrução explícita para perguntas de "quando/onde/quem" (facts históricos): reformular como investigação ("Você tem alguma ideia de quando isso pode ter acontecido? Antes ou depois da Primeira Guerra?") em vez de entregar a resposta diretamente.  
**Impacto:** Baixo para usuários (a experiência ainda é boa — há pergunta socrática ao final), mas viola o princípio construtivista que é o diferencial do produto.

### Bugs testados neste fluxo — STATUS

| ID | Descrição | Resultado neste fluxo |
|----|-----------|----------------------|
| BUG-005 | Context carry-over cross-sessão | NÃO REPRODUZIDO ✅ |
| BUG-005-R | VERBETTA menciona "Brasil" em sessão nova | NÃO REPRODUZIDO ✅ |
| BUG-006 | Roteador não troca herói com input de matéria diferente | NÃO REPRODUZIDO ✅ |
| BUG-004 | Pedido explícito de herói ignorado | NÃO REPRODUZIDO ✅ |
| BUG-007 | TEMPUS entrega data histórica diretamente | NOVO — REGISTRADO ❌ |

---

## OBSERVAÇÕES ADICIONAIS

**Fluxo de Primeiro Uso confirmado:** Maria Paz entrou com sessão limpa. CALCULUS se comportou como primeiro atendimento — perguntou o que a aluna precisava, sem assumir contexto. Confirmado que `jaAtendido=false` resulta em entrada direta no herói com comportamento de primeiro contato.

**Adaptação pedagógica por série:** VERBETTA identificou o 3º ano e redirecionou crase como "conteúdo avançado" — adaptação correta para a faixa etária. Isso mostra que o perfil do aluno (série/ano) está chegando ao contexto dos heróis.

**BUG-003 (labels visíveis) não reproduzido:** Nenhum label interno vazou nas respostas de nenhum herói neste fluxo.

---

## PRÓXIMA AÇÃO

Gate APROVADO PARCIAL — 4/5 blocos PASS.

**Ação necessária antes de Fluxo 3 (PAI):**
1. Registrar BUG-007 em `docs/LOG_ERROS.md`
2. Decidir com Leon: corrigir BUG-007 antes do Fluxo 3 ou rodar Fluxo 3 e corrigir em batch?
   - Impacto no Fluxo 3 (PAI): provável — TEMPUS no MODO PAI provavelmente também responderá datas diretamente
   - Recomendação Ralph: corrigir antes do Fluxo 3 para não contaminar o resultado com bug conhecido

**Se Leon aprovar correção antes do Fluxo 3:**
- Fix em `server/src/personas/TEMPUS.md` e `Prompts/TEMPUS.md`
- Adicionar seção específica para perguntas factuais ("quando", "onde", "quem") com instrução de reformular como investigação socrática
- Re-executar apenas BLOCO E antes de iniciar Fluxo 3

**Status do Fluxo 3:** aguarda decisão de Leon sobre BUG-007.
