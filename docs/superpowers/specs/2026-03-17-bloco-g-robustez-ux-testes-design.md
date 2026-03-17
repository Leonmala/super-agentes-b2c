# Spec: Bloco G — Robustez + UX + Testes em Produção

> **Data:** 2026-03-17
> **Status:** Aprovado por Leon
> **Rev:** 2 (pós-review — issues críticos resolvidos)
> **Contexto:** Leon testou o sistema em produção e identificou 4 problemas: router travado em CALCULUS, UX do texto "derramando" em velocidade absurda com reorganização visual, cursor piscante ao invés de typing dots, e impossibilidade de testar o ambiente servido (Railway).

---

## 1. Problemas Identificados

### 1.1 Router Travado em Agente Anterior
**Sintoma:** Aluno faz perguntas de português, mas CALCULUS continua respondendo.
**Causa raiz:** `router.ts` linhas 294-299 — quando keywords não detectam tema, o fallback retorna `sessao.agente_atual` (o último herói) em vez de reclassificar. Sem mecanismo de timeout ou reclassificação.

### 1.2 UX do Texto "Derramando"
**Sintoma:** Texto inteiro aparece numa bola grande em velocidade alta, depois se subdivide em múltiplos balões — efeito "despejo + reorganização".
**Causa raiz:** Servidor envia resposta completa em um único chunk (proteção anti-JSON). `useTypingEffect` revela caractere por caractere dentro de um balão. Ao terminar, `splitSentences` redistribui em N balões, causando pulo visual.

### 1.3 Indicador de Presença do Agente
**Sintoma:** Cursor piscante (|) durante loading — "cara de sistema", quebra a vibe de pessoa.
**Causa raiz:** Componente `StreamingCursor` usa cursor pipe piscante em vez dos 3 pontinhos animados definidos no protótipo.

### 1.4 Sem Testes em Produção
**Sintoma:** Correções locais nem sempre se refletem em produção. Sem visibilidade do ambiente servido.
**Causa raiz:** Testes rodam apenas contra localhost:3001. Nenhum mecanismo para testar Railway.

---

## 2. Decisões de Design (Aprovadas)

### 2.1 Timeout de Sessão
- **15 minutos de inatividade** OU **novo acesso ao app** → sistema reseta `agente_atual` e `tema_atual` para `null`
- Memória dos turnos permanece intacta — só a aderência ao agente é solta
- Campo `ultimo_turno_at` (timestamp) na tabela `b2c_sessoes` (prefixo `b2c_` confirmado — é o schema em produção)
- Timeout configurável via env var `SESSION_TIMEOUT_MS` (default: 900000 = 15min)

**Sinal de nova sessão (frontend → backend):**
- Flag `nova_sessao: true` incluída no primeiro `POST /api/message` após page load/refresh
- Frontend: `ChatContext` mantém `isFirstMessage` ref (true no mount, false após primeiro envio)
- Backend: se `nova_sessao === true` no body, executa reset antes de rotear:
  ```
  sessao.agente_atual = null
  sessao.tema_atual = null
  sessao.ultimo_turno_at = now()
  ```
- Sem endpoint novo — reaproveita `/api/message` existente

### 2.2 Classificador LLM Leve
- Função nova `classificarTema(mensagem: string): Promise<string | null>`
- Chamada quando keywords retornam vazio — **tanto em sessão ativa quanto resetada** (resolve o bug original: se keywords falham, SEMPRE tenta classificar via LLM antes de assumir continuidade)
- Prompt mínimo: "Classifique a matéria escolar desta mensagem. Responda APENAS com uma palavra: matematica, portugues, ciencias, historia, geografia, fisica, quimica, ingles, espanhol, ou indefinido."
- Gemini Flash, `temperature: 0`, `maxOutputTokens: 10`
- Latência estimada: ~200ms

**Tratamento de erros:**
- Timeout de 500ms — se excedido, cancela e usa PSICOPEDAGOGICO
- Se API retorna erro (rate limit, auth, rede): log error, fallback para PSICOPEDAGOGICO
- Se retorna valor inválido (não está na lista): tratar como `indefinido`
- Sem retry — uma chance por mensagem

**Lógica de continuidade:** Classificador retornando `indefinido` + agente ativo (<15min) → mantém continuidade. Isso cobre "ok, próxima pergunta" sem keyword. Mas se classificador retorna matéria diferente → reclassifica mesmo dentro dos 15min.

### 2.3 Novo Fluxo do `decidirPersona`

```
1. Checar timeout:
   - Se nova_sessao flag → resetar agente_atual e tema_atual
   - Se now() - ultimo_turno_at > SESSION_TIMEOUT_MS → resetar

2. Detectar tema por keywords (sistema existente)

3. Se tema detectado → fluxo normal:
   - Primeira vez nessa matéria → PSICOPEDAGOGICO (cascata)
   - Já atendido → herói direto

4. Se sem tema (keywords falharam):
   → Classificador LLM leve (SEMPRE, independente de ter agente ativo)

   4a. Se classificador retorna matéria válida:
       → Tratar como tema detectado (ir para passo 3)

   4b. Se classificador retorna indefinido:
       → Se tem agente ativo (sessão não resetada): continuidade legítima
       → Se não tem agente ativo: PSICOPEDAGOGICO

   4c. Se classificador falha (erro/timeout):
       → PSICOPEDAGOGICO
```

**Diferença crucial vs. versão anterior:** O classificador LLM agora roda SEMPRE que keywords falham, não apenas em sessão resetada. Isso resolve o cenário "aluno no meio de matemática pergunta sobre geografia" — o classificador detecta `geografia` e redireciona, mesmo dentro dos 15min.

### 2.4 Balões Um a Um (substituindo useTypingEffect)

**Contexto técnico:** O servidor usa buffer completo anti-JSON-leak. Toda a resposta chega em um único `onChunk` callback. O hook `useBubbleReveal` trabalha com texto completo, não com streaming parcial.

**Novo fluxo:**
1. Servidor envia texto completo → `onChunk` recebe tudo de uma vez
2. `onDone` dispara → texto final em `fullTextRef.current`
3. `splitSentences(texto)` divide em N frases imediatamente
4. Hook `useBubbleReveal` recebe array de frases e controla revelação:
   - Estado: `visibleCount` (começa em 0)
   - Timer revela próximo balão a cada intervalo proporcional:
     - Fórmula: `Math.max(800, palavras × 120)` ms
     - Frase de 5 palavras = 800ms (mínimo)
     - Frase de 15 palavras = 1800ms
   - Primeiro balão aparece com delay de 400ms (simula "processamento")
5. Cada balão aparece **completo** (sem animação caractere por caractere)
6. Animação CSS de entrada: `opacity 0→1, translateY 8px→0`, duração ~300ms
7. Entre balões, mostra **typing dots** no placeholder do próximo balão
8. Scroll automático (`scrollIntoView`) acompanha cada novo balão
9. Quando todos os balões estão visíveis → marca mensagem como finalizada

**O que é removido:** `useTypingEffect` hook inteiro + `StreamingCursor` componente.

### 2.5 Typing Dots (3 Pontinhos Animados)

**Componente `TypingDots`:**
- 3 círculos (`w-2 h-2 rounded-full`)
- Cor: herda do agente (`bg-current` ou cor específica do herói)
- Animação CSS `bounce` com delays escalonados: 0s, 0.15s, 0.3s
- Estilo visual: dentro de um balão com a mesma cor/border-radius orgânico do agente

**Regras de visibilidade:**

| Cenário | Comportamento |
|---------|--------------|
| Esperando LLM (antes de qualquer texto) | Exibir desde o início da request SSE. Desaparece quando `onDone` dispara e primeiro balão aparece. |
| Entre balões (durante reveal) | Aparece depois do fade-in do balão atual completar. Permanece até o próximo balão começar a aparecer. Duração mínima: 400ms (evita flicker). |
| Resposta muito rápida (<300ms) | Typing dots aparece por no mínimo 400ms antes de mostrar o primeiro balão — evita flash instantâneo. |

### 2.6 Testes em Produção — 3 Camadas

#### Camada A: Testes E2E Contra Railway
- Variável `API_URL` configurável em `helpers/api-client.ts`
- Default: `http://localhost:3001` (dev)
- Override: `API_URL=https://suaapp.railway.app npm run test:prod`
- Reutiliza testes gate1-5 existentes sem modificação
- Script npm: `"test:prod": "API_URL=https://... node --test server/tests/"`

#### Camada B: MCP Bridge para Teste Interativo
- Endpoint Express novo: `POST /api/mcp`
- Ferramentas expostas via protocolo MCP:
  - `enviar_mensagem_como_aluno` — simula mensagem de aluno específico
  - `verificar_sessao` — retorna estado da sessão (agente_atual, tema_atual, ultimo_turno_at)
  - `checar_roteamento` — dado uma mensagem, retorna qual persona seria escolhida (sem enviar)
  - `listar_turnos` — últimos N turnos de um aluno
  - `resetar_sessao_teste` — limpa sessão para testes (protegido por auth)

**Autenticação do MCP Bridge:**
```
1. Request deve incluir header: Authorization: Bearer <JWT>
2. Backend verifica JWT com JWT_SECRET existente (mesmo de message.ts)
3. Decodifica token → extrai tipo_usuario
4. Acesso permitido apenas se tipo_usuario === 'pai' (responsável)
5. Se token inválido/ausente/tipo errado → 401 Unauthorized
6. Rate limit: max 30 req/min por token (evita abuso)
```

#### Camada C: Subagente QA Contínuo
- Script/skill despachável como subagente

**Protocolo de teste:**
1. Para cada um dos 8 heróis:
   a. Enviar mensagem correspondente à matéria (ex: "me ajuda com equação do segundo grau" → CALCULUS)
   b. Verificar que `agente` retornado no SSE corresponde ao herói esperado
   c. Verificar que resposta tem conteúdo pedagógico (>20 palavras, relacionado à matéria)
   d. Registrar tempo de resposta e tokens

2. Testes de transição:
   a. Enviar matemática → verificar CALCULUS
   b. Na sequência, enviar história → verificar que NÃO fica preso em CALCULUS
   c. Medir latência da troca (<3s)

3. Teste de timeout:
   a. Verificar campo `ultimo_turno_at` na sessão
   b. Simular reset (flag nova_sessao) → verificar que agente é reclassificado

4. Teste de continuidade:
   a. Enviar mensagem de matemática → CALCULUS
   b. Enviar "não entendi, explica de novo" → deve manter CALCULUS

**Formato do relatório (`docs/qa-reports/YYYY-MM-DD.md`):**
```markdown
# QA Report — YYYY-MM-DD HH:MM

## Resumo
- Total de testes: X
- Passed: X | Failed: X
- Ambiente: [URL]

## Testes por Herói
| Herói | Matéria | Roteamento | Resposta | Tempo | Status |
|-------|---------|-----------|----------|-------|--------|

## Testes de Transição
| De → Para | Resultado | Tempo | Status |

## Testes de Timeout/Continuidade
| Cenário | Resultado | Status |
```

- **Princípio Pense-AI:** QA nasce junto com o app, cresce junto, está sempre funcional. Todo novo feature deve ter teste correspondente no QA contínuo.

---

## 3. Arquivos Impactados

### Servidor (server/)
| Arquivo | Mudança |
|---------|---------|
| `src/core/router.ts` | Refactor `decidirPersona` + nova `classificarTema` + lógica de timeout |
| `src/db/persistence.ts` | Nova `atualizarUltimoTurno` + `resetarSessaoAgente` |
| `src/routes/message.ts` | Flag `nova_sessao` + chamar `atualizarUltimoTurno` após cada mensagem |
| `src/routes/mcp.ts` (NOVO) | Endpoint MCP Bridge com 5 ferramentas + auth |
| `src/index.ts` | Registrar rota `/api/mcp` |
| `tests/helpers/api-client.ts` | `API_URL` configurável via env var |
| `package.json` | Script `test:prod` |

### Frontend (web/)
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useTypingEffect.ts` | REMOVIDO |
| `src/hooks/useBubbleReveal.ts` (NOVO) | Hook de revelação balão por balão |
| `src/components/TypingDots.tsx` (NOVO) | Componente 3 pontinhos animados |
| `src/components/ChatBubble.tsx` | Refactor: usa `useBubbleReveal`, remove split pós-animação |
| `src/components/StreamingCursor.tsx` | REMOVIDO (substituído por TypingDots) |
| `src/contexts/ChatContext.tsx` | Novo fluxo balão-por-balão + flag `nova_sessao` no primeiro message |
| `src/index.css` | Animações CSS para typing dots + bubble entrance |

### Banco de Dados (Supabase — prefixo `b2c_`)
| Tabela | Mudança |
|--------|---------|
| `b2c_sessoes` | Campo `ultimo_turno_at` (timestamptz, default now()) |

### Docs / QA
| Arquivo | Mudança |
|--------|---------|
| `docs/qa-reports/` (NOVO diretório) | Relatórios do QA contínuo |

---

## 4. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Classificador LLM adiciona latência | Gemini Flash max 10 tokens ~200ms. Timeout 500ms — se excedido, fallback PSICO. |
| Classificador retorna erro ou valor inválido | Log error, fallback PSICOPEDAGOGICO. Sem retry. Uma chance por mensagem. |
| Classificador LLM erra a matéria | Erro leva ao PSICO que reclassifica. Duas chances de acertar. |
| Timeout 15min muito curto/longo | Configurável via env var `SESSION_TIMEOUT_MS`. Ajustável sem redeploy. |
| MCP Bridge expõe dados em produção | JWT obrigatório + tipo_usuario === 'pai'. Rate limit 30 req/min. |
| Remoção do useTypingEffect quebra algo | `useBubbleReveal` criado e testado antes de remover o antigo. Transição limpa. |
| Balão completo sem animação parece "robótico" | CSS fade+slide + timing proporcional à leitura. Typing dots entre balões. |
| Typing dots flicker em respostas rápidas | Min 400ms de exibição antes do primeiro balão. |

---

## 5. Critérios de Sucesso

- [ ] Pergunta de português após sessão de matemática → VERBETTA responde (não CALCULUS)
- [ ] Pergunta de geografia durante sessão ativa de math → classificador redireciona para GAIA
- [ ] Após 15min de inatividade → próxima mensagem é reclassificada do zero
- [ ] Novo acesso ao app (refresh) → sistema em modo "Super Agentes" geral
- [ ] "Não entendi, explica de novo" → mantém herói atual (continuidade legítima)
- [ ] Texto do agente aparece balão por balão com tempo de leitura entre eles
- [ ] Nenhum "pulo visual" de reorganização de balões
- [ ] 3 pontinhos animados durante loading e entre balões (mínimo 400ms exibição)
- [ ] `npm run test:prod` roda testes contra Railway e passa
- [ ] MCP Bridge permite enviar mensagem e verificar sessão em produção
- [ ] Subagente QA gera relatório com resultado dos 8 heróis + transições + timeout

---

## 6. Ordem de Implementação (Sugestão)

1. **Migração SQL** — campo `ultimo_turno_at` na `b2c_sessoes`
2. **Router refactor** — timeout + classificador + novo fluxo `decidirPersona`
3. **Testes do router** — unit tests (classificarTema mock) + integration (decidirPersona com timeout)
4. **TypingDots componente** — CSS animations + componente React
5. **useBubbleReveal hook** — lógica de revelação balão por balão
6. **ChatBubble + ChatContext refactor** — integrar novo hook, remover useTypingEffect + StreamingCursor
7. **Testes E2E contra prod** — API_URL configurável + script npm
8. **MCP Bridge** — endpoint + ferramentas + auth JWT
9. **Subagente QA** — script de teste contínuo + formato relatório
10. **Gate de validação** — rodar QA completo contra produção
