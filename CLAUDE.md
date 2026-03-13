# CLAUDE.md — Super Agentes Educacionais V1.0

## IDIOMA
**Sempre responder em português** neste projeto. Toda comunicação com o usuário deve ser em português brasileiro.

---

## CONTEXTO DO PROJETO
Super Agentes Educacionais é uma **Clínica Educacional Digital** — sistema multi-agente de IA com 8 professores particulares especializados disponíveis 24/7 para cada aluno, com acompanhamento parental integrado.

**Proprietário:** Leon (CEO Pense-AI)
**Documento principal:** `PRE_PLANEJAMENTO_V1.md`
**Documento técnico histórico:** `Verdade_SuperAgentes_hoje_12_03_26.md` — leia antes de qualquer tarefa técnica.

---

## ARQUITETURA FUNDAMENTAL — NÃO REINVENTAR

### Princípio Central
> **O GESTOR é O agente. As personas são figurinos que ele veste.**

Um único orquestrador TypeScript decide a persona, monta o payload, chama o LLM e persiste. Nunca criar agentes separados por persona.

### Loop Principal (preservar)
```
Mensagem → Buscar contexto (Supabase) → Decidir persona (router) → Montar payload → Chamar LLM → Responder (SSE) → Persistir
```

### Fluxo Cascata (preservar)
- **Primeira interação com matéria nova:** PSICOPEDAGOGICO (sem stream, retorna JSON) → Herói (com stream SSE)
- **Continuidade na mesma matéria:** Herói direto (com stream SSE)

---

## STACK DEFINIDA

| Componente | Tecnologia |
|------------|-----------|
| Backend | TypeScript + Express |
| Frontend | Vite + React |
| Banco | Supabase (PostgreSQL) |
| LLM produção | Kimi K2.5 via API OpenAI-compatible |
| LLM dev/testes | Gemini (configurado no .env local) |
| Memória vetorial | Qdrant |
| Deploy | Railway |
| Pagamento | Mercado Pago / Pix |

**IMPORTANTE:** Em desenvolvimento/testes usar a API Gemini (já configurada no .env). Em produção usa Kimi K2.5.

---

## OS 8 PROFESSORES SUPER-HERÓIS

| Persona | Matéria | Status |
|---------|---------|--------|
| CALCULUS | Matemática | ✅ Validado em produção |
| VERBETTA | Português | ✅ Validado em produção |
| NEURON | Ciências / Biologia | ✅ Prompt pronto |
| TEMPUS | História | ✅ Prompt pronto |
| GAIA | Geografia | ✅ Prompt pronto |
| VECTOR | Física | ✅ Prompt pronto |
| ALKA | Química | ✅ Prompt pronto |
| FLEX | Inglês e Espanhol | ✅ Prompt pronto |

**Todos os prompts estão na pasta `Prompts/`.** Não inventar nomes, matérias ou conteúdo pedagógico.

### Outros agentes
- **PSICOPEDAGOGICO** — orquestração pedagógica (qualificação, roteamento). Prompt em `Prompts/`
- **SUPERVISOR EDUCACIONAL** — exclusivo para pais, acessa Qdrant para resumo semanal. Prompt em `Prompts/`
- **PROFESSOR_IA** — único prompt que ainda precisa ser criado (ensina a usar IA como ferramenta educacional)

---

## MODOS DE OPERAÇÃO

### MODO FILHO (padrão)
- Interação direta com o aluno
- Método construtivista (não dá resposta pronta, constrói raciocínio)
- Linguagem adaptada à idade/série

### MODO PAI
- Ativado quando `tipo_usuario = 'pai'` na sessão
- Agente vira apoio ao pai para ensinar ao filho
- Viés de didática parental: "como explicar isso pro seu filho"

**Campo `tipo_usuario` na tabela de sessões determina o modo em TODOS os agentes.**

---

## SISTEMA DE LOGIN

```
1. Família faz login com email + senha
2. Tela de seleção de perfil:
   → Avatares = iniciais do nome (letras) — sem design elaborado na V1
   → Filhos: clicam no perfil → MODO FILHO
   → Pai: digita PIN de 4 dígitos → MODO PAI
3. PIN existe APENAS para o pai. Filhos não têm PIN.
4. Troca de filho = fechamento de sessão atual + volta ao seletor
```

---

## INTERFACES (3 tipos)

| Interface | Quem | Características |
|-----------|------|----------------|
| Filho Fundamental (1º-9º ano) | Aluno | Só chat, sem menu lateral |
| Filho Ensino Médio (1º-3º EM) | Aluno | Chat + botão lateral "Professor de IA" |
| Pai | Responsável | Chat + menu lateral completo (Super Agentes / Supervisor / Professor IA) |

**Entrada padrão: sempre Super Agentes.** Professor de IA é opção lateral.

---

## BANCO DE DADOS

**Regra: Evoluir tabelas existentes — NÃO criar do zero.**

Tabelas existentes (prefixo `t6_`): `t6_alunos`, `t6_sessoes`, `t6_turnos`

**Novas entidades necessárias para V1:** famílias, responsáveis (com PIN hash), dispositivos simultâneos, uso diário, backup de turnos.

**Projeto Supabase:** `ahopvaekwejpsxzzrvux.supabase.co`

---

## CÓDIGO BASE DE REFERÊNCIA

A pasta `teste6-railway_v2_fast/` contém o código validado. A estrutura da V1 deve espelhar e evoluir esta base:
- `src/index.ts` — servidor Express + endpoint SSE
- `src/router.ts` — lógica de roteamento (expandir para 8 matérias + modo pai/filho)
- `src/llm.ts` — cliente LLM com envelope GESTOR
- `src/context.ts` — montador de contexto
- `src/persistence.ts` — operações Supabase
- `src/metrics.ts` — métricas de tempo/tokens

---

## RESTRIÇÕES ABSOLUTAS

1. **NÃO reinventar a arquitetura.** O GESTOR + personas funciona.
2. **NÃO criar abstrações desnecessárias.** Se uma função resolve, não criar uma classe.
3. **NÃO inventar nomes de agentes, matérias ou conteúdo pedagógico.** Tudo já existe nos prompts.
4. **PRESERVAR conteúdo dos prompts.** Ao adicionar MODO PAI, adicionar a seção — não reescrever o prompt.
5. **EVOLUIR o banco existente.** Analisar tabelas atuais antes de criar novas.
6. **TypeScript strict.** Tipos explícitos, sem `any`.
7. **Simplicidade radical.** Na dúvida, simplificar.
8. **Tudo em português.** Moeda em reais. Pagamento via Pix.

---

## PLANOS E PREÇOS

| Plano | Preço | Detalhes |
|-------|-------|---------|
| Base | R$ 49,90/mês | 1 filho, até 2 dispositivos simultâneos |
| Familiar | R$ 79,90/mês | Até 3 filhos, até 3 dispositivos simultâneos |

**Gateway:** Mercado Pago (Checkout Pro/Bricks). Assinatura recorrente mensal.

---

## MEMÓRIA DO SISTEMA

- **Curto prazo:** Supabase (turnos da semana corrente, últimos 3 turnos no contexto)
- **Longo prazo:** Qdrant (embeddings semanais por aluno — namespace = aluno_id)
- **CRON semanal (domingo 23h):** Gerar resumo semântico → salvar Qdrant → backup turnos → limpar turnos → resetar sessão

---

## LIMITE DE USO

Limite **suave**: 25 interações/dia ou 5 turnos completos por filho.
Mensagem amigável ao atingir o limite. Não bloquear hard.

---

## FORA DE ESCOPO NA V1

- Notificações push/email
- Dashboard analytics avançado
- App nativo (iOS/Android)
- Gamificação (pontos, badges)
- Áudio/voz (TTS/STT)
- Avatares desenhados para usuários (V1 usa iniciais do nome)
- Integração B2B com escolas

---

## CRITÉRIOS DE SUCESSO DA V1

- Todos os 8 professores funcionando (teste de 3 turnos cada)
- MODO PAI funcional em todos
- SUPERVISOR entrega resumo semanal com dados reais
- Login + PIN do pai funcionando corretamente
- 3 interfaces corretas
- SSE streaming: <10s cascata, <3s continuidade
- Persistência completa (Supabase)
- Flush semanal (CRON → Qdrant → limpeza)
- Site SaaS: landing + planos + checkout + onboarding
- Pagamento Mercado Pago: Pix funcional, webhook cria conta
- Limite suave funcionando

---

## WORKFLOW DE DESENVOLVIMENTO

Antes de qualquer implementação de feature significativa, usar o skill **superpowers:brainstorming** para explorar intenção e design.

Antes de planejar implementação multi-etapas, usar o skill **superpowers:writing-plans**.

Ao encontrar bugs ou comportamentos inesperados, usar o skill **superpowers:systematic-debugging**.

---

## SISTEMA DE MEMÓRIA — RALPH WIGGUM LOOP

> **Princípio:** O estado vive nos ARQUIVOS, não na conversa. Progresso persiste. Falhas evaporam.
> Baseado no padrão Ralph Wiggum Loop (https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum)
> Adaptado para Cowork mode — sem stop hook bash, mas com o mesmo ciclo de reinicialização deliberada.

### Por que Ralph Loop?

A context window de um LLM é como `malloc()` sem `free()` — só cresce, nunca libera. Tentativas erradas, alucinações e ruído se acumulam (poluição de contexto). A solução: **reinicialização deliberada**. Cada ciclo começa fresco, lendo o estado dos arquivos. O Git e os docs são a memória — não a transcrição da conversa.

### Documentos de Estado (em `docs/`)

| Documento | Propósito | Analogia Ralph |
|-----------|-----------|---------------|
| `MEMORIA_CURTA.md` | Último estado — O QUE estava acontecendo | **Ponto de restore** (lido PRIMEIRO) |
| `MEMORIA_LONGA.md` | TUDO que aconteceu: decisões, cronologia, arquitetura | **PRD vivo / Base de conhecimento** |
| `CHECKLIST_PROJETO.md` | O que foi feito [x] e o que falta [ ] | **Task tracker** (fonte de verdade) |
| `LOG_ERROS.md` | O que deu errado e como foi corrigido | **Aprendizados persistidos** |
| `PLANO_EXECUCAO_V1.md` | Plano mestre de execução | **PRD original** (referência imutável) |

### O Ralph Loop — Ciclo de Execução

```
┌─────────────────────────────────────────────────────────┐
│                    RALPH LOOP                           │
│         "Progresso persiste. Falhas evaporam."          │
│                                                         │
│  ┌─── FASE 1: BOOT (início de cada sessão/ciclo) ───┐  │
│  │                                                    │  │
│  │  1. Ler MEMORIA_CURTA.md → onde parei?            │  │
│  │  2. Ler CHECKLIST_PROJETO.md → o que falta?       │  │
│  │  3. Se 1ª vez ou contexto insuficiente:           │  │
│  │     → Ler MEMORIA_LONGA.md (banco completo)       │  │
│  │  4. Ler LOG_ERROS.md → o que NÃO repetir          │  │
│  │                                                    │  │
│  │  Resultado: contexto limpo + estado real           │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌─── FASE 2: EXECUTE (trabalho do slice) ───────────┐  │
│  │                                                    │  │
│  │  1. Pegar próxima task [ ] do CHECKLIST            │  │
│  │  2. Implementar (subagente quando possível)        │  │
│  │  3. Verificar (typecheck, testes unitários)        │  │
│  │  4. Se ERRO → registrar em LOG_ERROS.md           │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌─── FASE 3: PERSIST (salvar estado) ───────────────┐  │
│  │                                                    │  │
│  │  1. Marcar [x] no CHECKLIST_PROJETO.md            │  │
│  │  2. Atualizar MEMORIA_CURTA.md (novo estado)      │  │
│  │  3. Se decisão importante:                        │  │
│  │     → Registrar em MEMORIA_LONGA.md               │  │
│  │  4. Se final de fase: rodar Gate                  │  │
│  │                                                    │  │
│  │  ⚠️  ESTE PASSO É OBRIGATÓRIO                    │  │
│  │  Sem persist = progresso perdido na reinicialização│  │
│  └────────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌─── FASE 4: DECIDE ───────────────────────────────┐  │
│  │                                                    │  │
│  │  Mais tasks no checklist?                         │  │
│  │    → SIM + context window ok → volta para FASE 2  │  │
│  │    → SIM + context window cheia → REINICIALIZAR   │  │
│  │    → NÃO → fase completa, rodar Gate              │  │
│  │                                                    │  │
│  │  REINICIALIZAR = nova sessão começa na FASE 1     │  │
│  │  (contexto limpo, estado nos arquivos)            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  A reinicialização NÃO é falha. É DESIGN.              │
│  Cada ciclo começa limpo. O estado sobrevive nos docs.  │
└─────────────────────────────────────────────────────────┘
```

### Regras do Ralph Loop

1. **BOOT É OBRIGATÓRIO.** Toda sessão nova COMEÇA lendo os docs de memória. Sem exceção.
2. **PERSIST É OBRIGATÓRIO.** Todo slice termina atualizando os docs. Sem exceção.
3. **A conversa não é memória.** Se não está num arquivo, não existe.
4. **Erros vão pro LOG antes da correção.** Falhas documentadas são aprendizado; falhas esquecidas se repetem.
5. **CHECKLIST é fonte de verdade.** Não está marcado [x]? Não está feito.
6. **Reinicialização é uma feature, não um bug.** Quando o contexto poluir, reiniciar é a decisão certa.
7. **Subagentes não persistem estado.** Apenas o agente principal atualiza os docs de memória.
8. **MEMORIA_LONGA.md cresce para sempre.** É o banco permanente. Nunca apagar, só adicionar.
9. **MEMORIA_CURTA.md é sobrescrita a cada slice.** É um snapshot, não um log.

### Definição de "Slice"

Um slice é a menor unidade atômica de trabalho que pode ser completada e verificada:
- 1 task do plano (ex: Task 1.4 auth routes)
- 1 bugfix com teste de regressão
- 1 gate completo (rodar todos os testes da fase)

**Ciclo de um slice:** Boot (se início de sessão) → Execute → Verify → Persist → Next

### Completion Promise (do Ralph Wiggum)

Cada fase tem uma **completion promise** — uma frase que sinaliza que a fase está completa:

| Fase | Completion Promise |
|------|-------------------|
| Fase 1 | `Gate 1 PASSED — todos os testes backend passando` |
| Fase 2 | `Gate 2 PASSED — 8 heróis + MODO PAI funcionando` |
| Fase 2.5 | `PROFESSOR_IA prompt criado e aprovado pelo Leon` |
| Fase 3 | `Gate 3 PASSED — 3 interfaces frontend funcionando` |
| Fase 4 | `Gate 4 PASSED — CRON + Qdrant + limites funcionando` |
| Fase 5 | `Gate 5 PASSED — SaaS + Mercado Pago funcionando` |
| Fase 6 | `Gate 6 PASSED — RELEASE — deploy Railway + E2E` |

O agente SÓ avança para a próxima fase quando a completion promise da fase atual é verdadeira (testes passaram).

### Prompt de Reinicialização (Boot Prompt)

Quando uma nova sessão começa, o primeiro prompt deve ser equivalente a:

```
Leia os seguintes arquivos na ordem:
1. docs/MEMORIA_CURTA.md (estado imediato)
2. docs/CHECKLIST_PROJETO.md (progresso)
3. docs/LOG_ERROS.md (o que não repetir)
4. Se necessário: docs/MEMORIA_LONGA.md (contexto completo)

Continue a execução de onde parou. A próxima task [ ] não marcada no checklist
é seu alvo. Execute o Ralph Loop: Boot → Execute → Persist → Decide.
```

### Gatilho de Reinicialização

Reinicializar quando:
- Context window acima de ~70% de utilização
- Acumulou mais de 3 tentativas de correção de erro no mesmo slice
- Agente confuso ou repetindo comportamentos
- Leon pedir explicitamente

Antes de reinicializar: PERSIST obrigatório em todos os 4 docs.

### Integração com Subagentes

O Ralph Loop roda no agente PRINCIPAL. Subagentes são despachados dentro da fase EXECUTE de cada slice. O ciclo é:
1. **Boot** → agente principal lê docs de memória
2. **Execute** → despacha subagente para implementar task
3. **Verify** → agente principal verifica output do subagente (typecheck)
4. **Persist** → agente principal atualiza docs de memória
5. **Decide** → mais tasks? reinicializar? gate?
