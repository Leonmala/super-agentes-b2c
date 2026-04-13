# QA v2 Re-Run Report — Fluxo 1: Layla (7º Ano)
**Data:** 2026-04-07  
**Executor:** Ralph (gestor SuperAgentes)  
**Tipo:** Re-run pós-correção dos 3 bugs (BUG-001, BUG-003, BUG-004)  
**App:** https://independent-eagerness-production-7da9.up.railway.app  
**Conta:** leon@pense-ai.com / Perfil: Layla Estefan Malatesta (7º Ano)  
**Contador resetado:** confirmado (interacoes = 0, agente_atual = PSICOPEDAGOGICO, tema_atual = NULL)

---

## RESULTADO GERAL

**GATE: APROVADO PARCIAL**

- BUG-001: CORRIGIDO ✅ (com ressalva — ver abaixo)
- BUG-003: CORRIGIDO ✅
- BUG-004: NÃO CORRIGIDO ❌
- Score pedagógico estimado: **7.5/10**

---

## BLOCOS EXECUTADOS

---

### BLOCO 1.1 — Re-teste BUG-001 (TEMPUS/História)

**Input:** "preciso estudar história para a prova"

**Transcrição literal da primeira resposta:**

> Que ótima iniciativa, Layla!
>
> Estudar história para a prova é super importante, e vamos fazer isso de um jeito que você entenda de verdade!
>
> Como você disse que queria falar sobre o Brasil, que tal a gente viajar no tempo para entender como tudo começou por aqui, lá pelos séculos XV e XVI?
>
> 🕰️
>
> Nessa época, a Europa estava cheia de mudanças e os países, como Portugal, queriam encontrar novas rotas para buscar produtos valiosos, como temperos, lá na Índia.
>
> As rotas antigas estavam perigosas.
>
> Essa busca por novos caminhos no oceano acabou levando os navegadores a lugares que eles nem imaginavam, como o nosso Brasil!
>
> Pensando nisso, o que você acha que impulsionou esses navegadores a se lançarem em viagens tão longas e perigosas?

**Header observado:** TEMPUS / História ✅

**Avaliação BUG-001:**
- PASS parcial: TEMPUS respondeu sobre HISTÓRIA (não Português como antes) ✅
- RESSALVA: Resposta contém "Como você disse que queria falar sobre o Brasil" — contexto de sessão anterior ainda sendo carregado pelo TEMPUS. O roteamento por matéria foi corrigido, mas há resíduo de contexto cross-sessão no histórico interno do herói. Não é o bug original (matéria errada), mas é uma anomalia residual a investigar.
- **STATUS BUG-001: CORRIGIDO — com anomalia residual menor (context carry-over)**

---

### BLOCO 1.2 — Re-teste BUG-003 (CALCULUS prompt leak)

**Ação:** Clicar botão "Matemática" no EmptyState → ativou CALCULUS/Matemática  
**Input:** "quanto é 2/3 + 1/4?"

**Transcrição literal da resposta:**

> Olá, Layla!
>
> Que ótima pergunta sobre frações! 😊
>
> Para somar frações como 2/3 e 1/4, precisamos que os pedaços que estamos juntando sejam do mesmo tamanho.
>
> Pensa assim: você consegue somar facilmente 'duas fatias de pizza grande' com 'uma fatia de pizza pequena'?
>
> Não fica muito claro, né?
>
> Precisamos que as fatias tenham o mesmo tamanho para somar direitinho. 🍕
>
> Em matemática, para que as frações tenham 'pedaços do mesmo tamanho', precisamos encontrar um número que seja múltiplo dos denominadores (os números de baixo) das duas frações.
>
> Qual seria o menor número que é múltiplo tanto de 3 quanto de 4?

**Verificação de labels:**
- Presença de "Bloco", "BLOCO", "MICRO", "micro-desafio", "Bloco 2", "Bloco 7" no HTML: `false` ✅

**Avaliação BUG-003:**
- CALCULUS guiou sem dar o resultado direto ✅
- Sem labels internos visíveis na UI ✅
- **STATUS BUG-003: CORRIGIDO ✅**

---

### BLOCO 1.3 — Re-teste BUG-004 (pedido explícito de herói)

**Pré-condição:** Ativado Verbetta/Português via botão EmptyState  
**Input:** "quero falar com o GAIA sobre o Brasil"

**Transcrição literal da resposta:**

> Que bom que você está animada para mergulhar no português, Layla!
>
> 😊 Eu estava justamente preparando uma leitura especial para continuarmos nossa conversa sobre o Brasil, o nosso 'Gigante Verde'!
>
> Vamos ver o que este pequeno texto nos conta:
>
> 📖 O Gigante Verde do Brasil
>
> O Brasil é conhecido como o Gigante Verde do nosso planeta. Isso não é só pelo seu tamanho enorme, mas principalmente pela sua natureza exuberante! Temos a maior floresta tropical do mundo, a Amazônia, cheia de árvores altas, rios que parecem mares e uma variedade incrível de animais. É um verdadeiro tesouro natural que precisamos cuidar.
>
> *Agora, antes de qualquer coisa, vamos ancorar o sentido: com suas palavras, o que este texto quer nos contar sobre o Brasil? Qual é a ideia principal que ele transmite?* 🧠
>
> Ah, que ótimo que você quer falar sobre o Brasil, Layla! 😊 É um tema riquíssimo e podemos explorá-lo muito bem aqui em Português!

**Herói que respondeu:** Verbetta (Português) — header não mudou para GAIA/Geografia

**Avaliação BUG-004:**
- Pedido explícito de GAIA foi ignorado ❌
- Header permaneceu "Verbetta / Português" ❌
- Verbetta respondeu diretamente sobre o tema "Brasil" sem transferir para GAIA ❌
- **STATUS BUG-004: NÃO CORRIGIDO ❌**

**Nota adicional:** A resposta do Verbetta exibe novamente o padrão de "contexto carry-over" — menciona "nossa conversa sobre o Brasil" como se já houvesse sessão anterior, o que reforça o problema residual de contexto entre sessões observado no Bloco 1.1.

---

### BLOCO 1.4 — Construtivismo TEMPUS (continuidade)

**Fluxo:** EmptyState → clique História → Tempus/História ativado  
**Input:** "quero revisar a Primeira Guerra Mundial"

**Transcrição literal da resposta:**

> Que ótimo, Layla!
>
> A Primeira Guerra Mundial é um tema super importante para entendermos como o mundo de hoje foi moldado.
>
> Estamos falando de um período no início do século XX, entre 1914 e 1918.
>
> Antes de a guerra começar, a Europa era um caldeirão de tensões.
>
> Muitos países poderosos estavam competindo por mais terras, recursos e influência em outras partes do mundo, o que chamamos de imperialismo.
>
> Ao mesmo tempo, o sentimento de nacionalismo era muito forte, com cada nação querendo mostrar sua força e superioridade.
>
> Essas rivalidades levaram à formação de grandes alianças militares, como a Tríplice Entente e a Tríplice Aliança, criando um cenário onde qualquer pequena faísca poderia acender um grande incêndio.
>
> E foi exatamente isso que aconteceu com o assassinato de um arquiduque.
>
> Pensando nesse cenário de muitas tensões e alianças, você consegue imaginar como a morte de uma única pessoa pode ter sido o gatilho para um conflito tão grande, envolvendo tantos países?

**Avaliação:**
- TEMPUS terminou com pergunta guiada ✅
- Porém entregou explicação densa antes da pergunta — construtivismo parcial. Esperado: TEMPUS perguntar primeiro o que Layla já sabe, só então contextualizar.
- **STATUS: PASS PARCIAL — construtivismo presente, mas ordem invertida (explica → pergunta, ideal: pergunta → contextualiza)**

---

### BLOCO 1.5 — REGRA ANTIRESPOSTA TEMPUS

**Input:** "acho que a morte do Franz Ferdinand foi o estopim"

**Transcrição literal da resposta:**

> Você tocou em um ponto muito importante, Layla!
>
> A morte do Arquiduque Franz Ferdinand, em 1914, é sim considerada o "estopim" para a Primeira Guerra Mundial.
>
> Mas, como em muitas grandes histórias, um "estopim" geralmente acende uma fogueira que já estava com lenha preparada há muito tempo, sabe?
>
> Aquele assassinato foi a gota d'água em um cenário de muitas rivalidades e alianças complexas entre os países europeus.
>
> O que você acha que já estava acontecendo na Europa para que um único evento pudesse causar uma guerra tão grande?

**Avaliação:**
- TEMPUS validou a resposta de Layla ✅
- TEMPUS fez pergunta de aprofundamento ✅
- Não entregou a resposta completa ✅
- **STATUS: PASS ✅**

---

## RESUMO DOS BUGS

| ID | Severidade | Descrição | Status Original | Status Re-run |
|----|-----------|-----------|----------------|--------------|
| BUG-001 | MAIOR | Contexto stale: matéria errada vazava para TEMPUS | REPROVADO | CORRIGIDO ✅ (com anomalia residual de context carry-over) |
| BUG-003 | MÉDIO | Labels internos CALCULUS visíveis no reply_text | REPROVADO | CORRIGIDO ✅ |
| BUG-004 | MAIOR | Pedido explícito de herói pelo nome ignorado | REPROVADO | NÃO CORRIGIDO ❌ |

---

## ANOMALIA NOVA — Context Carry-Over Cross-Sessão

**Observação (Blocos 1.1 e 1.3):** Tanto TEMPUS quanto Verbetta referenciaram contexto de sessões anteriores:
- TEMPUS: "Como você disse que queria falar sobre o Brasil" (não foi dito nesta sessão)
- Verbetta: "para continuarmos nossa conversa sobre o Brasil"

O OSCAR confirmou antes deste QA que o contador foi resetado (`interacoes = 0`) e a sessão limpa (`agente_atual = PSICOPEDAGOGICO`, `tema_atual = NULL`). Isso sugere que o histórico de mensagens da sessão anterior ainda está sendo injetado no contexto do herói, mesmo após reset. Possível fonte: histórico de chat não limpo no DB ou no estado client-side.

**Severidade:** MÉDIO — não quebra o fluxo, mas gera inconsistência pedagógica significativa.
**ID sugerido:** BUG-005

---

## SCORECARD PEDAGÓGICO — RE-RUN

| Bloco | Critério | Score |
|-------|---------|-------|
| 1.1 | TEMPUS roteia para História (não Português) | 9/10 — correto, anomalia residual menor |
| 1.2 | CALCULUS guia sem dar resultado, sem labels | 10/10 — perfeito |
| 1.3 | GAIA assume quando pedido explicitamente | 2/10 — Verbetta ignorou pedido |
| 1.4 | TEMPUS faz pergunta guiada (construtivismo) | 7/10 — pergunta presente, mas após explicação densa |
| 1.5 | TEMPUS valida + aprofunda (antiresposta) | 10/10 — perfeito |

**Score médio: 7.6/10** (vs 6.5/10 no run anterior)

---

## DECISÃO DE GATE

**BUG-004 bloqueador para Fluxo 2 e Fluxo 3?**

O BUG-004 (pedido explícito de herói ignorado) foi classificado como MAIOR no run original. Permanece não corrigido. Recomendação:
- **Não bloquear Fluxo 2 e Fluxo 3** se o objetivo é validar os outros fluxos independentemente
- **Abrir ticket para BUG-004** com prioridade MAIOR antes do lançamento
- **Abrir ticket para BUG-005** (context carry-over) com prioridade MÉDIO

**Gate final: APROVADO PARCIAL** — 2 de 3 bugs corrigidos. BUG-004 persiste. BUG-005 identificado.

---

## PRÓXIMOS PASSOS

1. Investigar BUG-004: verificar lógica de roteamento para pedido explícito de herói no classificador/PSICO
2. Investigar BUG-005: verificar se o histórico de chat é efetivamente limpo no reset de sessão (DB + client state)
3. Decidir com Leon: rodar Fluxo 2 (Maria Paz) com BUG-004 aberto, ou corrigir primeiro
