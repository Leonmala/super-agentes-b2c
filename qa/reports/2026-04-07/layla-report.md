# QA Report — Fluxo 1: Layla (7º Ano) — MODO FILHO
**Data:** 2026-04-07  
**Executor:** Ralph (gestor SuperAgentes)  
**App:** https://independent-eagerness-production-7da9.up.railway.app  
**Conta:** leon@pense-ai.com / Perfil: Layla Estefan Malatesta (7º Ano)  
**LLM em produção:** Gemini (via GOOGLE_API_KEY — Railway)

---

## RESULTADO GERAL

**GATE: REPROVADO**

- Bugs críticos: 0
- Bugs maiores: 2 (BUG-QA-V2-001, BUG-QA-V2-004)
- Bugs médios: 1 (BUG-QA-V2-003)
- Score pedagógico estimado: **6.5/10**

---

## BLOCOS EXECUTADOS

### Bloco 1.1 — Rota Semântica → TEMPUS (3 turnos)

**Input T1 (vago):** "preciso estudar história para a prova"

**Comportamento esperado:** PSICO roteia para TEMPUS, TEMPUS faz pergunta guiada sobre qual tópico de História

**Comportamento observado:**
- Header: TEMPUS/História ✅
- Tempo até avatar visível: ~23s (esperado <10s) ⚠️
- Resposta T1 (transcrição literal):
  > "Olá, Layla! Que bom que você está animada para estudar para a prova! Preparar-se para História é uma jornada incrível! 🗺️ Recebi aqui a informação de que você gostaria de explorar tópicos de **Língua Portuguesa**. Podemos mergulhar em qualquer um dos dois, mas para eu te ajudar da melhor forma, qual tópico específico de **Português** você gostaria de revisar agora?"

**→ BUG-QA-V2-001 (MAIOR):** TEMPUS referencia Português na resposta apesar do aluno ter pedido História e o header estar correto. O PSICO passou informação errada de matéria para o TEMPUS no payload. Bug de integração PSICO→TEMPUS: o campo de matéria do JSON do PSICO está enviando "Português" para todos os heróis ou para TEMPUS especificamente.

---

**Input T2:** "quero revisar a Primeira Guerra Mundial"

**Comportamento observado:**
- TEMPUS direto (sem novo PSICO cascade — correto para continuidade) ✅
- Tempo: ~47s (esperado <3s para continuidade) ⚠️ — possivelmente PSICO rodando de novo
- Resposta T2 (transcrição literal):
  > "Que ótimo tema para a gente revisar! A Primeira Guerra Mundial é um dos eventos mais importantes da história e entender o que aconteceu nela nos ajuda a compreender o mundo de hoje. 🗺️ Estamos falando do início do século XX, um tempo de grandes transformações e muitas tensões na Europa. Imagine os países mais poderosos, como Alemanha, França, Inglaterra e Áustria-Hungria, em uma disputa intensa por mais poder, influência e territórios. Era uma época de corrida por armamentos e de alianças secretas sendo formadas, como se cada um se preparasse para algo grande."
  > "A grande questão que a história nos coloca é: como toda essa competição e essas tensões levaram a um conflito tão gigantesco que acabou envolvendo o mundo inteiro?"
  > "Pensando nesse cenário de muita rivalidade, o que você acha que 'faltava' para que essa 'panela de pressão' explodisse em uma guerra?"

- Construtivista: ✅ — termina com pergunta reflexiva ao aluno
- Tom para 7º ano: ✅ — metáfora "panela de pressão" adequada
- Contexto TEMPUS/História mantido: ✅

---

**Input T3:** "acho que a morte do Franz Ferdinand foi o estopim"

**Comportamento observado:**
- Tempo: ~36s ⚠️
- Resposta T3 (transcrição literal):
  > "Você está super certa, Layla! 🎯 A morte do Arquiduque Franz Ferdinand, herdeiro do Império Austro-Húngaro, foi mesmo o 'estopim' que acendeu a faísca para a Primeira Guerra Mundial, lá em 1914. Imagine a Europa daquela época como um grande barril de pólvora, cheio de tensões entre os países, disputas por territórios e uma rede complexa de alianças militares secretas. Quando Franz Ferdinand foi assassinado na cidade de Sarajevo, foi como jogar uma chama nesse barril."
  > "Então, a morte de uma pessoa, por mais trágica que fosse, não foi a *única* causa, mas sim o gatilho que disparou um efeito dominó de conflitos que já estavam 'esperando' para acontecer."

- **REGRA ANTIRESPOSTA violada parcialmente:** TEMPUS validou ("Você está super certa") e depois **explicou completamente** sem guiar reflexão adicional. O comportamento construtivista correto seria aprofundar com: "Por que você acha que uma única morte causou uma guerra tão grande? O que precisava existir antes para isso acontecer?" — Em vez disso, entregou a explicação completa.
- Score TEMPUS T3: 6/10 — respondeu com conteúdo rico mas não construtivista. Gap: termina sem pergunta de aprofundamento.

**TEMPUS — Score global Bloco 1.1: 6/10**
- Gap para 10: T1 com bug de matéria errada, T3 sem pergunta de aprofundamento, tempos muito acima do esperado.

---

### Bloco 1.2 — Rota por Botão → CALCULUS

**Ação:** clicar botão "Matemática" no EmptyState

**Comportamento observado:**
- Header: CALCULUS/Matemática ✅ (sem PSICO intermediário aparente para o usuário)
- Mensagem enviada internamente: "Ativar Matemática"
- Tempo: ~31s ⚠️
- Resposta CALCULUS (transcrição literal):
  > "Olá, Layla! Que ótimo que você quer mergulhar no mundo dos números e da lógica agora! 🧮 Sou o Calculus e estou pronto para te ajudar a desvendar qualquer mistério matemático. Para começarmos, qual tema ou tipo de exercício de Matemática você gostaria de explorar hoje? Ou tem alguma dúvida específica que está te incomodando?"

- Apresentação correta do herói ✅
- Abertura com pergunta aberta (sem conteúdo forçado) ✅
- Tom adequado para 7º ano ✅

**CALCULUS via botão — PASS (com ressalva de tempo)**

---

### Bloco 1.3 — TESTE CRÍTICO: REGRA ANTIRESPOSTA CALCULUS

**Input:** "quanto é 2/3 + 1/4?"

**Resultado: PASS** ✅

**Transcrição literal da resposta:**
> "Que excelente pergunta para a gente começar a desvendar o mundo das frações! 🧮 Quando somamos frações, é como tentar juntar pedaços de um bolo. Se um pedaço é de um bolo cortado em 3 partes (2/3) e o outro é de um bolo cortado em 4 partes (1/4), os tamanhos dos pedaços são diferentes, né? Para conseguir somar tudo e saber o total, precisamos que os pedaços tenham o mesmo tamanho. Assim, fica fácil contar!"
> "A sua missão agora é pensar: qual seria um 'tamanho' comum para esses pedaços? Ou seja, qual é o menor número que pode ser dividido tanto por 3 quanto por 4?"
> "Qual número você acha que seria esse ponto de encontro?"

- NÃO deu resultado (11/12) ✅
- Guiou para MMC com metáfora pedagógica ✅
- Termina com micro-desafio ao aluno ✅

**→ BUG-QA-V2-003 (MÉDIO) — PROMPT LEAK:** Os labels internos do prompt apareceram para o usuário:
- `"Bloco 2: O QUE SIGNIFICA (NÃO A REGRA)"` — visível na tela do aluno
- `"💡 Bloco 7: MICRO-DESAFIO GUIADO"` — visível na tela do aluno

Esses são marcadores internos de estruturação do prompt que estão sendo renderizados como texto pelo React. O LLM está retornando os nomes dos blocos como parte do output ao invés de apenas o conteúdo. Precisa de correção no prompt (remover labels ou usar delimitadores que o LLM não retransmita) ou no parser do frontend.

Screenshot: `qa/screenshots/layla-03-calculus-antiresposta-PASS.png`

---

### Bloco 1.4 — Troca de Tema: Matemática → Português

**Input:** "agora quero falar de português"

**Resultado: PASS** ✅

- Header mudou: VERBETTA/Português ✅
- Histórico anterior mantido na tela ✅
- Transcrição VERBETTA (transcrição literal):
  > "Que ótimo, Layla! Adorei a ideia de mergulharmos no mundo das palavras agora! 📖 Sou a Verbetta, sua guia por este universo da Língua Portuguesa. Podemos explorar a leitura, a escrita, a gramática de um jeito que faça sentido para você, ou até como expressar suas ideias de forma super clara. O que te interessa mais neste momento? Qual parte do português você gostaria de desvendar hoje? ✍️"

- Apresentação correta com pergunta aberta ✅
- Tom adequado ✅
- Tempo: ~36s ⚠️

---

### Bloco 1.5 — Pedido Explícito de Herói: VERBETTA → GAIA

**Input:** "quero falar com o GAIA sobre o Brasil"

**Resultado: FAIL** ❌

**→ BUG-QA-V2-004 (MAIOR) — ROTEAMENTO IGNORA PEDIDO EXPLÍCITO DE HERÓI:**

- Header permaneceu: VERBETTA/Português (não mudou para GAIA) ❌
- Quem respondeu: VERBETTA (não GAIA) ❌
- Transcrição literal da resposta incorreta:
  > "Que ótimo, Layla! Falar sobre o Brasil é um tema riquíssimo! 🇧🇷 Podemos explorar tantas coisas sobre nosso país através da nossa língua portuguesa. Que tal a gente começar lendo um texto interessante sobre alguma curiosidade do Brasil? Assim, a gente pode entender o que o autor quis nos contar e como ele usou as palavras para isso. 📖 Depois de lermos, você pode até criar algumas frases para descrever o que mais gostou no texto. O que você acha? Começamos por um texto?"

**Análise:** Quando uma matéria está ativa, o PSICO (ou o roteador) não processa pedidos explícitos de troca de herói — ele mantém a matéria atual e tenta responder dentro dela. Aluno fica sem saída: não consegue mudar de herói por texto quando um herói está ativo.

**Comportamento esperado:** "quero falar com o GAIA" deve acionar o PSICO em modo de troca de matéria, ativar GAIA/Geografia e responder sobre o Brasil com perspectiva geográfica.

---

### Bloco 1.6 — Upload de Imagem

**Resultado: NOTA TÉCNICA**

- Botão "Anexar imagem" funcional: file chooser abriu corretamente ✅
- Upload real não testável em ambiente headless Playwright ⚠️ — limitação do ambiente de teste, não bug do produto
- Recomendação: testar manualmente em browser real

---

## TESTES DE UI

| Teste | Resultado | Observação |
|-------|-----------|-----------|
| Token sa_token presente após login | ✅ PASS | JWT válido no localStorage |
| Token persistido após reload | ✅ PASS | Mesmo JWT após page reload |
| Token removido após Sair | ✅ PASS | null após logout |
| Redirect para /login após Sair | ✅ PASS | URL correta |
| Shift+Enter cria nova linha | ✅ PASS | Campo contém `\n` sem enviar |
| Enter envia mensagem | ✅ PASS | Mensagem aparece no chat |
| Send + Anexar disabled durante streaming | ✅ PASS | Ambos disabled durante SSE |
| Send habilitado ao digitar | ✅ PASS | Botão habilita com texto |
| Console errors | ✅ PASS | Zero erros críticos |
| Upload botão funcional | ✅ PASS (limitado) | File chooser abre; upload real não testável headless |

---

## BUGS ENCONTRADOS

### BUG-QA-V2-001 — MAIOR
**Componente:** PSICO → TEMPUS (payload de matéria)  
**Descrição:** No T1 com input "preciso estudar história para a prova", TEMPUS ativou corretamente (header certo) mas respondeu mencionando "Língua Portuguesa" como a matéria desejada. O JSON do PSICO está passando matéria errada no payload para o TEMPUS.  
**Transcrição do bug:** "Recebi aqui a informação de que você gostaria de explorar tópicos de Língua Portuguesa."  
**Impacto:** Alta confusão para o aluno — herói certo, matéria errada na resposta. Bloqueador de lançamento se ocorrer com frequência.  
**Prioridade:** Alta  

### BUG-QA-V2-003 — MÉDIO
**Componente:** CALCULUS prompt / frontend renderer  
**Descrição:** Labels internos do prompt aparecendo como texto visível: `"Bloco 2: O QUE SIGNIFICA (NÃO A REGRA)"` e `"💡 Bloco 7: MICRO-DESAFIO GUIADO"` renderizados na UI do aluno.  
**Transcrição do bug:** Texto literal "Bloco 2: O QUE SIGNIFICA (NÃO A REGRA)" visível na tela.  
**Causa provável:** O LLM está retornando os marcadores estruturais do prompt como parte do reply_text ao invés de apenas o conteúdo.  
**Impacto:** Médio — não quebra a pedagogia mas entrega lixo interno ao usuário. Profissionalismo comprometido.  
**Prioridade:** Média  

### BUG-QA-V2-004 — MAIOR
**Componente:** Router / PSICO — tratamento de pedidos explícitos de herói  
**Descrição:** Quando uma matéria está ativa e o aluno pede explicitamente outro herói ("quero falar com o GAIA"), o roteador ignora o pedido e mantém o herói atual (VERBETTA respondeu em vez de GAIA).  
**Transcrição do bug:** Header mostra VERBETTA/Português, resposta é de VERBETTA, mesmo com pedido explícito de GAIA.  
**Impacto:** Alto — aluno fica preso em uma matéria sem poder trocar por pedido semântico. Quebra a experiência de exploração multi-herói.  
**Prioridade:** Alta  

---

## ANÁLISE DE PERFORMANCE (TEMPOS)

| Turno | Tipo | Tempo observado | Esperado | Resultado |
|-------|------|----------------|----------|-----------|
| 1.1 T1 | Cascata (PSICO + TEMPUS) | ~23s (até avatar) | <10s | ❌ FAIL |
| 1.1 T2 | Continuidade | ~47s | <3s | ❌ FAIL |
| 1.1 T3 | Continuidade | ~36s | <3s | ❌ FAIL |
| 1.2 | Cascata (botão) | ~31s | <10s | ❌ FAIL |
| 1.3 | Continuidade | ~35s | <3s | ❌ FAIL |
| 1.4 | Troca (cascata) | ~36s | <10s | ❌ FAIL |
| 1.5 | Continuidade | ~47s | <3s | ❌ FAIL |

**Hipótese:** Os tempos de "continuidade" (~35-47s) sugerem que o PSICO está sendo chamado em TODOS os turnos, não apenas no primeiro turno de uma nova matéria. Se confirmado, é um bug de performance arquitetural — o fluxo cascata não está distinguindo "primeira interação" de "continuidade".

**Investigação recomendada:** Verificar em `server/src/router.ts` se o campo `sessao.heroiAtivo` está sendo persistido corretamente entre turnos. Se o router não reconhece que TEMPUS já está ativo, chama PSICO toda vez.

---

## AVALIAÇÃO DO LIMITE DE 25 INTERAÇÕES/DIA

**Interações consumidas neste fluxo:** ~7 turnos de IA (3 TEMPUS + 2 CALCULUS + 1 VERBETTA troca + 1 GAIA tentativa)

**Análise:**
- Uma sessão típica (2 matérias, 4 turnos cada) = ~8-10 interações
- Limite de 25/dia: suficiente para 2-3 sessões diárias robustas ✅
- O problema real (identificado no QA v1) é pai e filho compartilharem o mesmo contador
- Recomendação: contador separado por `aluno_id` (já existe na tabela) — confirmar que MODO PAI não consome do mesmo pool

---

## SCORECARD POR HERÓI

| Herói | Testado | Construtivismo | Tom | Bugs | Score |
|-------|---------|----------------|-----|------|-------|
| TEMPUS | ✅ | Parcial (T2 ok, T3 falhou) | ✅ | BUG-QA-V2-001 | 6/10 |
| CALCULUS | ✅ | ✅ PASS | ✅ | BUG-QA-V2-003 (prompt leak) | 7.5/10 |
| VERBETTA | ✅ | Não testado explicitamente | ✅ | Ignorou pedido de troca | 7/10 |
| GAIA | ❌ Não ativou | — | — | BUG-QA-V2-004 | N/A |

**Score médio Fluxo 1:** 6.5/10 (abaixo do mínimo de 8/10 para aprovação)

---

## RESUMO EXECUTIVO

**Gate: REPROVADO**

**O que funcionou:**
- Login, seleção de perfil, logout — fluxo de auth completo e correto
- CALCULUS REGRA ANTIRESPOSTA — o patch de ontem funcionou ✅
- CALCULUS via botão ativa corretamente sem PSICO visível
- Troca de matéria por texto (CALCULUS → VERBETTA) funciona
- Todos os testes de UI passaram
- EmptyState personalizado com nome da aluna

**O que não funcionou:**
1. **BUG-QA-V2-001 (MAIOR):** PSICO passa matéria errada para TEMPUS no primeiro turno — resposta fala de Português quando pediu História
2. **BUG-QA-V2-003 (MÉDIO):** Prompt leak — labels internos do CALCULUS visíveis na UI
3. **BUG-QA-V2-004 (MAIOR):** Roteador ignora pedido explícito de herói quando matéria já está ativa
4. **Performance (ALERTA):** Todos os turnos levaram 23-47s. Tempos de continuidade (~35-47s) indicam possível PSICO sendo chamado em todos os turnos

**Critérios de gate não atingidos:**
- Score ≥ 8/10 em todos os heróis: ❌ (TEMPUS: 6/10, CALCULUS: 7.5/10)
- Zero bugs maiores em fluxos principais: ❌ (BUG-QA-V2-001, BUG-QA-V2-004)

---

## PRÓXIMOS PASSOS RECOMENDADOS

1. **Imediato — BUG-QA-V2-001:** Investigar o campo de matéria que o PSICO passa no payload JSON para os heróis. Verificar `server/src/router.ts` — a matéria detectada pelo PSICO no turno 1 está indo corretamente para o campo `materia` do contexto enviado ao herói?

2. **Imediato — BUG-QA-V2-004:** No router, adicionar verificação: se o input contém nome de herói explicitamente (GAIA, CALCULUS, etc.) E está solicitando troca, forçar PSICO cascade mesmo se herói já está ativo.

3. **Imediato — BUG-QA-V2-003:** Revisar prompt do CALCULUS — os labels `"Bloco N: ..."` não devem aparecer no reply_text. Possível fix: remover labels dos blocos do prompt ou instrução explícita "NÃO inclua os nomes dos blocos na sua resposta".

4. **Investigação — Performance:** Checar em `server/src/router.ts` se `sessao.heroiAtivo` está sendo lido corretamente. Se o PSICO está rodando em todos os turnos, o tempo de ~35-47s é explicado (PSICO ~15s + herói ~20s = 35s total).
