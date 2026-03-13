# Fase 2: Agentes — MODO PAI + SUPERVISOR + Formato

**Data:** 2026-03-12
**Escopo:** Tasks 2.1, 2.2, 2.3 do CHECKLIST_PROJETO.md

---

## Contexto

Fase 1 completa (Gate 1 PASSED 21/21). O backend funciona em MODO FILHO. Agora precisamos:

1. Ensinar cada persona a se comportar diferente quando `MODO: PAI` aparece no contexto
2. Corrigir bug: `tipoUsuario` não é passado para `montarContexto` em `message.ts`
3. Integrar SUPERVISOR_EDUCACIONAL como agente acessível via `agente_override`
4. Melhorar `instrucaoFormatoPorPersona` para robustez

---

## Decisão de Design Crítica: PSICOPEDAGÓGICO = Voz do App

**O PSICOPEDAGÓGICO não é uma persona.** É a voz do app quando o GESTOR ainda não sabe quem vestir.

- Nunca se apresenta com nome próprio
- Nunca tem personalidade distinta
- Fala como "Super Agentes Pense-AI"
- O usuário (filho ou pai) percebe como a interface do sistema, não como um personagem

**MODO FILHO:** "Oi, [nome]! Aqui é o Super Agentes Pense-AI. Em que matéria posso te ajudar?"
**MODO PAI:** "Olá! Aqui é o Super Agentes Pense-AI. Posso te ajudar a ensinar uma lição de casa, tirar uma dúvida sobre alguma matéria do seu filho, ou ver como ele está indo. No que posso ajudar?"

A transição PSICO → Herói é invisível. O pai/filho nunca sabe que existe roteamento.

---

## Task 2.1: MODO PAI nos 8 Heróis + PSICO

### Princípio

Adicionar seção `══ MODO PAI ══` no FINAL de cada .md (nunca reescrever conteúdo existente).

### Estrutura da seção MODO PAI (heróis)

Cada herói recebe ~30-40 linhas com:

```
══════════════════════════════════════════════════════════════
MODO PAI — ORIENTAÇÃO AO RESPONSÁVEL
══════════════════════════════════════════════════════════════

ATIVAÇÃO: Quando o contexto indicar MODO: PAI, você está falando com o
pai/mãe/responsável do aluno, NÃO com o aluno diretamente.

MUDANÇA DE INTERLOCUTOR:
- Linguagem adulta, direta, sem infantilizar
- Sem emojis pedagógicos (exceto marcadores de organização)
- Tratamento respeitoso ("você" para o responsável)

VIÉS PEDAGÓGICO PARENTAL:
- Seu papel muda de "ensinar o aluno" para "ensinar o pai a ensinar"
- Foque em: "como explicar isso para o seu filho"
- Dê 2-3 estratégias práticas que o pai pode usar em casa
- Use exemplos do cotidiano familiar

[SEÇÃO ESPECÍFICA POR MATÉRIA — customizada para cada herói]

ESTRUTURA DO reply_text NO MODO PAI:
1. Acolhimento breve (1 linha)
2. Explicação do conceito para o adulto (simplificada, sem jargão)
3. 2-3 estratégias práticas ("faça isso com seu filho")
4. Checagem: "Consegue aplicar isso? Quer que eu detalhe algum ponto?"

O QUE NÃO MUDA:
- JSON de saída: mesma estrutura (agent_id, tema, reply_text, etc.)
- sinal_psicopedagogico: funciona igual
- Regra de sigilo: idêntica
- Protocolo de verificação pré-resposta: idêntico
```

### Customização por herói (seção específica)

| Herói | Foco MODO PAI |
|-------|--------------|
| CALCULUS | Objetos do cotidiano para contas, jogos numéricos em casa, como acompanhar lição sem dar resposta |
| VERBETTA | Estímulo à leitura em casa, como revisar redação do filho sem reescrever, conversas que expandem vocabulário |
| NEURON | Experimentos caseiros seguros, curiosidade científica no dia a dia, como responder "por quê?" de forma construtiva |
| TEMPUS | Como usar notícias/família para contextualizar história, visitas a museus/locais, conversa sobre passado familiar |
| GAIA | Mapas, viagens, clima local, como conectar geografia ao cotidiano da família |
| VECTOR | Fenômenos físicos em casa (gravidade, eletricidade, som), como tornar física tangível |
| ALKA | Cozinha como laboratório (reações, misturas, estados), segurança com produtos químicos |
| FLEX | Imersão em casa (músicas, séries, jogos em inglês/espanhol), como praticar sem pressão |

### PSICOPEDAGÓGICO — Seção MODO PAI

Diferente dos heróis. A seção MODO PAI do PSICO muda:

1. **Tom de qualificação**: ao invés de "em que matéria precisa de ajuda?", pergunta "sobre qual matéria do seu filho quer orientação?"
2. **Opções oferecidas**: inclui "ver como ele está indo" (redireciona a SUPERVISOR via sistema)
3. **Identidade**: permanece "Super Agentes Pense-AI" (não persona)
4. **Exemplo de qualificação MODO PAI**: "Olá! Aqui é o Super Agentes Pense-AI. Posso te ajudar com: uma matéria específica do seu filho, uma lição de casa, ou acompanhar o progresso dele. O que prefere?"
5. **Encaminhamento**: funciona igual — `ENCAMINHAR_PARA_HEROI` com o herói escolhido

### Arquivos afetados (Task 2.1)

- `server/src/personas/CALCULUS.md` — adicionar seção MODO PAI
- `server/src/personas/VERBETTA.md` — adicionar seção MODO PAI
- `server/src/personas/NEURON.md` — adicionar seção MODO PAI
- `server/src/personas/TEMPUS.md` — adicionar seção MODO PAI
- `server/src/personas/GAIA.md` — adicionar seção MODO PAI
- `server/src/personas/VECTOR.md` — adicionar seção MODO PAI
- `server/src/personas/ALKA.md` — adicionar seção MODO PAI
- `server/src/personas/FLEX.md` — adicionar seção MODO PAI
- `server/src/personas/PSICOPEDAGOGICO.md` — adicionar seção MODO PAI + reforçar identidade "voz do app"

---

## Task 2.2: Integrar SUPERVISOR para Pais

### O que é

SUPERVISOR_EDUCACIONAL já tem prompt em `server/src/personas/SUPERVISOR_EDUCACIONAL.md`. Ele é exclusivo para pais — entrega panorama do filho com dados do Qdrant.

### Como integrar

1. **Expandir `agente_override`** em `message.ts`:
   - Atualmente: só aceita heróis de `HEROIS_VALIDOS`
   - Novo: aceitar também `SUPERVISOR_EDUCACIONAL`
   - Criar `AGENTES_OVERRIDE_VALIDOS = [...HEROIS_VALIDOS, 'SUPERVISOR_EDUCACIONAL']`
   - Validação: SUPERVISOR só aceito quando `tipoUsuario === 'pai'`

2. **Fluxo SUPERVISOR**:
   - Pai seleciona "Supervisor" no menu lateral do frontend
   - Frontend envia `agente_override: 'SUPERVISOR_EDUCACIONAL'`
   - Backend pula router, carrega persona SUPERVISOR direto
   - SUPERVISOR responde em stream (como herói direto)
   - Sem cascata PSICO

3. **Contexto para SUPERVISOR**:
   - Usar `montarContexto` com `tipoUsuario = 'pai'`
   - Futuramente (Fase 4): adicionar dados Qdrant no contexto

### Arquivos afetados (Task 2.2)

- `server/src/routes/message.ts`:
  - Criar `AGENTES_OVERRIDE_VALIDOS`
  - Adicionar validação tipo_usuario para SUPERVISOR
  - Passar `tipoUsuario` para `montarContexto` (BUG FIX)

---

## Task 2.3: Expandir instrucaoFormatoPorPersona

### Problemas atuais

1. Os few-shot examples do PSICO mencionam nomes de heróis ao aluno ("Vou te conectar com o CALCULUS") — **quebra a regra de que a transição é invisível**
2. Heróis não têm instrução de formato MODO PAI
3. Falta instrução explícita para SUPERVISOR

### Mudanças

1. **PSICOPEDAGOGICO**: corrigir few-shot examples
   - Remover menções a nomes de heróis
   - Adicionar example de MODO PAI
   - Reforçar identidade "Super Agentes Pense-AI"

2. **Heróis (CALCULUS, VERBETTA, etc.)**: adicionar nota sobre MODO PAI no formato
   - "Se o contexto indicar MODO: PAI, adapte reply_text para o responsável conforme seção MODO PAI do seu prompt"

3. **SUPERVISOR_EDUCACIONAL**: criar entrada no dicionário
   - Formato de saída do SUPERVISOR
   - Instruções de tom para pais

### Arquivos afetados (Task 2.3)

- `server/src/core/llm.ts` — editar `instrucaoFormatoPorPersona`

---

## Bug Fix: tipoUsuario não passado para montarContexto

### Onde

`server/src/routes/message.ts`

### Problema

Linha 177: `montarContexto(sessao, aluno, turnosParaContexto)` — falta 4o argumento `tipoUsuario`
Linha 226: `montarContexto(sessao, aluno, ultimosTurnos)` — idem

### Fix

```typescript
// Linha 177
const contexto = montarContexto(sessao, aluno, turnosParaContexto, tipoUsuario)

// Linha 226
let contextoHeroi = montarContexto(sessao, aluno, ultimosTurnos, tipoUsuario)
```

### Incluído na Task 2.2 (junto com expansão do agente_override)

---

## Impacto no GESTOR Envelope (llm.ts)

O envelope GESTOR diz "MENSAGEM DO ALUNO PARA ${persona}" no final. Quando MODO PAI, deveria dizer "MENSAGEM DO RESPONSÁVEL".

**Decisão:** Manter "MENSAGEM DO ALUNO" por enquanto — o contexto já injeta MODO: PAI e a seção nos prompts é suficiente para o LLM entender. Mudar o envelope é low-priority e pode ser feito depois se necessário.

---

## Ordem de Execução

1. **Task 2.1** — Adicionar seções MODO PAI nos 9 .md (parallelizable — 9 edições independentes)
2. **Task 2.2** — Bug fix montarContexto + expandir agente_override + validação SUPERVISOR
3. **Task 2.3** — Corrigir instrucaoFormatoPorPersona (few-shots PSICO + MODO PAI + SUPERVISOR)
4. **Task 2.T** — Testes Gate 2
5. **GATE 2** — Rodar testes

---

## Critérios de Sucesso (Gate 2)

- [ ] Todos 8 heróis respondem diferente em MODO PAI (linguagem adulta, estratégias para pais)
- [ ] PSICO em MODO PAI se identifica como "Super Agentes Pense-AI" e oferece opções para pais
- [ ] PSICO nunca revela nome de herói ao aluno/pai
- [ ] SUPERVISOR acessível via agente_override (só para pais)
- [ ] SUPERVISOR rejeitado quando tipo_usuario = 'filho'
- [ ] montarContexto recebe tipoUsuario corretamente
- [ ] Testes de regressão Gate 1 continuam passando (21/21)
