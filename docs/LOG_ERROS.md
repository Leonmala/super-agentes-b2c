# LOG DE ERROS — Super Agentes V1.0

> **Regra:** Toda vez que um teste falha ou um bug é encontrado, registrar aqui ANTES de corrigir.
> Formato: Data | Fase | Descrição | Causa raiz | Correção | Status
> **Última atualização:** 2026-03-18 (Router Fix — 3 fixes + 306 testes classificador)

---

## Erros Resolvidos

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 1 | 2026-03-12 | Pré-execução | Supabase MCP conectado ao projeto errado (yoxbjkwrpyktdubvcbat) | MCP não configurado para Super Agentes | Descoberto MCP alternativo (0150fe87) que vê o projeto correto | ✅ Resolvido |
| 2 | 2026-03-12 | Pré-execução | Nome VERBETA (1 T) no teste6 vs VERBETTA (2 T) nos prompts | Typo no código original | Padronizado para VERBETTA em todo o código V1 | ✅ Resolvido |
| 3 | 2026-03-12 | Gate 1 | this.timeout(45000) não funciona no Node test runner | Mocha syntax vs Node test runner | Usar `{ timeout: 60000 }` como segundo arg do it() | ✅ Resolvido |
| 4 | 2026-03-12 | Gate 1 | Testes de router retornam PSICOPEDAGOGICO em vez de heróis | Fluxo cascata: tema novo → PSICO primeiro (by design) + últimos 3 turnos insuficientes | Seed turnos prévios + buscar 10 turnos ao invés de 3 | ✅ Resolvido |
| 5 | 2026-03-12 | Gate 1 | Contaminação de estado entre suites de teste | Testes SSE modificam sessão usada pelos testes de Router | Criar aluno dedicado (seedRouterAluno) para isolamento | ✅ Resolvido |
| 6 | 2026-03-12 | Gate 1 | Done event assertion falha (status inexistente) | Done event tem agente/turno/tempo_ms, não status | Assertion corrigida para verificar agente e tempo_ms | ✅ Resolvido |

---

## Erros Resolvidos (Fase 2)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 7 | 2026-03-12 | Gate 2 | Router português falha (Round 1) — "conjugação" não em keywords | Mensagem usava termos não cobertos por KEYWORDS_PORTUGUES | Trocar mensagem para "gramática e ortografia do português" | ✅ Resolvido |
| 8 | 2026-03-12 | Gate 2 | Router português falha (Round 2) — state contamination | Turnos MODO PAI empurram seeded hero turns para fora da janela de 10 turnos | Criar seedRegressionAluno dedicado para testes de regressão | ✅ Resolvido |

## Erros Resolvidos (Deploy)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 9 | 2026-03-13 | Deploy | Railway Node.js 22.11.0 < 22.12 (req Vite 8) + rolldown binding missing | Vite 8 usa rolldown (nativo), Railway usa Docker com Node 22.11, nixpacks.toml ignorado | **Downgrade Vite 8→6.3.5** (usa esbuild, funciona com Node 18+). Também: plugin-react 6→4.3.4, vitest 4→3.2.1, TS 5.9→5.8.3 | ✅ Fix aplicado |
| 10 | 2026-03-13 | Deploy | Tentativa 1: nixpacks.toml + .node-version (não funcionou) | Railway usa Dockerfile, não Nixpacks | Removidos nixpacks.toml e .node-version. Solução real: downgrade Vite | ✅ Resolvido |

## Erros Resolvidos (Gate 5 E2E)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 11 | 2026-03-13 | Gate 5 | gemini-2.0-flash deprecated → 503/404 nos heróis | LLM default em llm.ts era modelo descontinuado | Atualizar default para gemini-2.5-flash | ✅ Resolvido |
| 12 | 2026-03-13 | Gate 5 | b2c_uso_diario sem updated_at → schema cache error | Coluna não existia na tabela | Migração SQL adicionando updated_at e created_at | ✅ Resolvido |
| 13 | 2026-03-13 | Gate 5 | Session state pollution entre testes cascata | Testes compartilhavam aluno sem limpar sessões | limparSessoesAluno() deleta sessions+turnos+uso_diario | ✅ Resolvido |
| 14 | 2026-03-13 | Gate 5 | PSICO alucinava heroi_escolhido (ALKA→FLEX, VERBETA typo) | LLM nem sempre retorna hero correto no JSON | Override por keyword em message.ts (personaPorTema > PSICO) | ✅ Resolvido |
| 15 | 2026-03-13 | Gate 5 | "revolução" matchava "evolução" (substring) → NEURON | KEYWORDS_CIENCIAS tinha "evolução", ciencias checada antes de historia | 1) Reordenar historia antes de ciencias; 2) "evolução" → "teoria da evolução" | ✅ Resolvido |
| 16 | 2026-03-13 | Gate 5 | "me conta sobre" matchava "conta" (math) → CALCULUS | KEYWORDS_MATEMATICA tinha "conta" genérico | Trocar por "conta de matematica"/"fazer conta"/"fazer contas" | ✅ Resolvido |

## Erros Resolvidos (Hotfixes Produção — 2026-03-13)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 17 | 2026-03-13 | Produção | Persona PSICOPEDAGOGICO não encontrada | `tsc` não copia .md para dist/. `carregarPersona()` usa `__dirname` relativo a dist/ | Build: `tsc && cp -r src/personas dist/personas` | ✅ Resolvido |
| 18 | 2026-03-13 | Produção | JSON bruto exibido na tela do aluno | LLM usou `mensagem_ao_aluno` em vez de `resposta_para_aluno`. Extrator só conhecia 2 campos | `extrairTextoDoJSON()` com 9 campos possíveis em prioridade | ✅ Resolvido |
| 19 | 2026-03-13 | Produção | Cascata PSICO→Herói falha (herói inválido) | LLM usou `agente_destino: "VERBETA"` em vez de `heroi_escolhido: "VERBETTA"` | Extração robusta (4 campos) + `normalizarNomeHeroi()` fuzzy match + plano/instrucoes robustos | ✅ Resolvido |
| 20 | 2026-03-13 | Produção | Limite 5 turnos atingido após 5 mensagens | `incrementarTurnoCompleto()` chamado em TODA mensagem | Turno completo só incrementa em troca de matéria (tema novo ≠ anterior) | ✅ Resolvido |

## Erros Resolvidos (Polimento Pré-Venda — 2026-03-14)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 21 | 2026-03-14 | Polimento | JSON vazando no stream dos heróis (6+ ocorrências no teste Layla) | `chamarLLMStream` fazia detecção frágil (só checava se começa com `{`). Falhava com whitespace, JSON mid-stream | Buffer completo: acumula resposta inteira → `extrairJSONouTexto()` → envia texto limpo de uma vez. `useTypingEffect` cuida da animação. | ✅ Resolvido |
| 22 | 2026-03-14 | Polimento | Vector invadindo conversa de ciências ("trabalho de ciências" → VECTOR) | Keyword "trabalho" em KEYWORDS_FISICA é ambígua — em contexto escolar = lição de casa | Sistema de anti-keywords (blocklist): se mensagem contém keyword + anti-keyword → match cancelado. 13 expressões bloqueadoras para física. Extensível. | ✅ Resolvido |
| 23 | 2026-03-14 | Polimento | Logo do herói ilegível no header (diminuto) | Logo `h-12` (48px) vs buble `h-16` (64px) — desproporcional | `h-12` → `h-16` igualando altura do buble | ✅ Resolvido |

## Erros Resolvidos (Visual Refactor V5 — 2026-03-15)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 24 | 2026-03-15 | Visual | Logo Pense-AI errado (logo institucional em vez do cubo 3D) | Arquivo `logo-penseai.png` era o logo errado. Correto é `LogoPenseAI.png` | Copiado arquivo correto para web/public/, referências atualizadas em 4 arquivos | ✅ Resolvido |
| 25 | 2026-03-15 | Visual | Logo monocromático (branco forçado) | CSS `brightness-0 invert` forçava todas as cores para branco | Removido filtro. Logo agora renderiza com cores naturais (texto branco + cubo preto) | ✅ Resolvido |
| 26 | 2026-03-15 | Visual | Logo diminuto em todas as telas | `h-4` (16px) era invisível no celular | Aumentado para `h-10` (40px) em todas as telas. `h-12` no LoginPage | ✅ Resolvido |
| 27 | 2026-03-15 | Visual | Logo atrás dos blobs (cor alterada) | Blobs decorativos com blur cobriam o logo no mesmo z-level | Adicionado `relative z-10` ao container do logo | ✅ Resolvido |
| 28 | 2026-03-15 | Visual | Ícone responsável = escudo em vez de cadeado | SVG path era shield fill (`M12 1L3 5v6c0 5.55...`) | Trocado para lock outline (rect + path) igual ao PinModal | ✅ Resolvido |
| 29 | 2026-03-15 | Visual | PIN dots brancos (sem feedback visual) | `bg-white border-white` não diferencia de estado vazio em tela azul | `bg-emerald-400 border-emerald-400` com glow verde | ✅ Resolvido |
| 30 | 2026-03-15 | Visual | PIN numpad achatado/apertado | `h-[62px]` fixo sem largura proporcional. Container `260px` estreito | `aspect-[1.3]` para teclas proporcionais + container `280px` + gap `14px` | ✅ Resolvido |
| 31 | 2026-03-15 | Visual | Login com gradiente lavado/sem contraste | `from-[#2563EB] via-[#3B82F6]` — azul médio sem profundidade | `from-[#1E40AF] via-[#1E3A8A] to-[#0F172A]` — azul profundo→navy | ✅ Resolvido |
| 32 | 2026-03-15 | Visual | Botão "Entrar" com azul genérico | `text-blue-700` (#1d4ed8) não corresponde à composição | `text-[#1E3A8A]` — o azul do gradiente da página | ✅ Resolvido |
| 33 | 2026-03-15 | Visual | Menu lateral com ícones errados (lucide genéricos) | BookOpen, Bot, Eye, ArrowLeftRight, X — não correspondem ao protótipo | SVGs inline: raio, monitor, olho, user, logout — extraídos do protótipo | ✅ Resolvido |
| 34 | 2026-03-15 | Visual | Menu: botões inferiores com background desnecessário | `bg-white/8 border border-white/8` criava cards pesados | Botões limpos sem background, só texto `text-white/45` + hover sutil | ✅ Resolvido |
| 35 | 2026-03-15 | Visual | X de fechar menu estava preto | SVG usava `stroke="currentColor"` mas botão não definia `text-white` | Adicionado `text-white` à classe do botão | ✅ Resolvido |
| 36 | 2026-03-15 | Visual | TypeError: fetch failed no Railway (login não funciona) | `.env` é gitignored, Railway não tinha variáveis de ambiente configuradas | Leon precisa configurar env vars manualmente no Railway dashboard | ⏳ Pendente (Leon) |

## Erros Resolvidos (Bloco H — Disjuntores Arquiteturais — 2026-03-17)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 37 | 2026-03-17 | Produção | PSICO JSON truncado por maxOutputTokens → cascata morria → JSON raw enviado ao aluno | maxOutputTokens=3000 insuficiente para resposta PSICO completa. JSON cortado no meio → JSON.parse falha → texto bruto enviado | **D5:** maxOutputTokens PSICO 3000→8000. **D1:** Pipeline 4 camadas (JSON.parse → markdown → regex → texto puro). **D3:** Cascata resiliente usa `processed.cascata` tipada | ✅ Resolvido |
| 38 | 2026-03-17 | Produção | Herói JSON com aspas malformadas → JSON.parse falha → JSON raw exposto ao pai | LLM ocasionalmente gera JSON com aspas smart ou malformadas. Sem sanitização, texto bruto com JSON ia direto para o usuário | **D1:** Pipeline 4 camadas com fallback progressivo. **D2:** Sanitizador incondicional SEMPRE roda antes de enviar — remove resíduos JSON mesmo se parse falhar | ✅ Resolvido |
| 39 | 2026-03-17 | Produção | Backend nunca processava `sinal_psicopedagogico`, `motivo_sinal`, `observacoes_internas` dos heróis | Campos existiam no prompt dos heróis mas message.ts ignorava completamente. Sinais pedagógicos se perdiam | **D4:** Pipeline de sinais completo: herói → extração via ProcessedResponse → persistência Supabase (3 colunas novas + índice parcial). **H8:** Migração SQL aplicada | ✅ Resolvido |
| 40 | 2026-03-17 | Produção | Imagens atualizadas por Leon não apareciam no app em produção | Leon atualizava originais em `Imagens/` (nomes originais) mas frontend serve de `web/public/` com nomes diferentes. Mapeamento: `Logo_SuperAgentesPenseAI.png` → `LogoPenseAI.png`, `SuperAgentesPenseAi_buble.png` → `logo-buble.png` | Copiados arquivos com nomes corretos para `web/public/`. Documentado mapeamento na MEMORIA_CURTA | ✅ Resolvido |

## Erros Resolvidos (Router Fix — 2026-03-18)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 41 | 2026-03-18 | Produção | GAIA aparecia no meio de sessão de Matemática ("o próprio 40") | `'rio'` (3 chars) em `KEYWORDS_GEOGRAFIA` fazia `.includes()` match dentro de "próprio" (propr**io**). `detectarTema()` retornava 'geografia' → PSICO cascata → override forçava GAIA | **Fix 1 (word boundary):** `reWordBoundary()` helper + `temKeyword()` usa regex `(?<![a-z...])kw(?![a-z...])` para keywords ≤4 chars sem espaços. Threshold 4 evita quebrar plurais (guerra→guerras ok) | ✅ Resolvido |
| 42 | 2026-03-18 | Produção | VECTOR (Física) aparecia no meio de sessão de História ("antes era grego") | `detectarTema()` retornava null → LLM classificador rodava → Gemini Flash classificou como 'fisica' (associou "grego" a letras gregas α,β,ω em física) → override forçava VECTOR | **Fix 3 (stickiness guard):** quando keywords detectam tema DIFERENTE do agente ativo, exige confirmação do LLM. Se LLM diz 'indefinido' → mantém herói atual. Elimina falsos positivos do classificador durante fluxo ativo | ✅ Resolvido |
| 43 | 2026-03-18 | Router | `' mais '`/`' menos '` em KEYWORDS_MATEMATICA causavam falsos positivos | "ficou muito mais fácil" (histórico) → match de `' mais '` → detectava matematica. Mensagens cotidianas com "mais"/"menos" eram classificadas incorretamente | **Fix 2 (anti-keywords + remoção):** Removidos `' mais '`, `' menos '` de KEYWORDS_MATEMATICA. Adicionados ANTI_KEYWORDS_MATEMATICA: 'às vezes', 'idade média'. ANTI_KEYWORDS_PORTUGUES: 'em espanhol', 'de espanhol', 'em inglês'. Estendido ANTI_KEYWORDS_FISICA com contextos coloquiais | ✅ Resolvido |
| 44 | 2026-03-18 | Router | Threshold word boundary inicial ≤6 quebrava plurais | `'guerra'` (6 chars) com `\bguerra\b` não matchava "guerras". `'molar'` (5 chars) não matchava "molaridade" | Threshold reduzido de ≤6 para ≤4. Keywords 5+ chars usam substring matching (permite plurais). Apenas 3-4 chars (rio, pais, base, arte) usam word boundary | ✅ Resolvido |
| 45 | 2026-03-18 | Router | 'potência'/'potencia' adicionados a MATEMATICA causavam "energia potencial" → MATEMATICA | 'potencia' é substring de 'potencial'. MATEMATICA checada antes de FISICA → falso positivo | Removidos 'potência'/'potencia' de MATEMATICA (já cobertos por FISICA keywords) | ✅ Resolvido |
| 46 | 2026-03-18 | Router | 'média'/'media' em MATEMATICA causava "idade média" → matematica (em vez de historia) | Keyword correta para estatística, mas "idade média" é período histórico medieval | Adicionados 'idade média', 'idade media' em ANTI_KEYWORDS_MATEMATICA | ✅ Resolvido |

## Erros Resolvidos (PROFESSOR_IA + Bugs Interface — 2026-03-31)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 47 | 2026-03-31 | Produção | JWT expirado → login silencioso falha (filhas + PIN) | Token válido por 7 dias, sem renovação. `ProfileModal.tsx` swallava o erro silenciosamente (`catch { // handle error }`) | `client.ts`: 401 → limpar localStorage + redirect para `/`. `ProfileModal.tsx`: estado de erro + display visual do erro | ✅ Resolvido |
| 48 | 2026-03-31 | PROFESSOR_IA | Agente não sabia o que era MCP ("não é um termo comum", chutou MLP) | Prompt não tinha definição de MCP. Sem regra de honestidade epistemológica | Adicionado: definição completa MCP (Anthropic, nov/2024), Agentic AI, honestidade epistemológica ("Nunca chute — diga 'não sei, mas vou verificar'") | ✅ Resolvido |
| 49 | 2026-03-31 | PROFESSOR_IA | Supervisor não funcionava (sem resposta) | `'supervisor'.toUpperCase()` → `'SUPERVISOR'` ≠ `'SUPERVISOR_EDUCACIONAL'` esperado no backend | `ChatInput.tsx`: mapa explícito `MENU_TO_AGENTE = { supervisor: 'SUPERVISOR_EDUCACIONAL', professor_ia: 'PROFESSOR_IA' }` | ✅ Resolvido |
| 50 | 2026-03-31 | Interface | Header não atualizava ao trocar para Supervisor/PROFESSOR_IA no menu | `ChatHeader` só lia `heroiAtivo` (setado por SSE). `HEROES` não tinha entrada para agentes especiais → fallback "Super Agentes" | `constants.ts`: `AGENTES_ESPECIAIS` com metadata. `ChatHeader`: lê `agenteMenu` com prioridade sobre `heroiAtivo` | ✅ Resolvido |

---

## Erros Resolvidos — QA Pré-Famílias (2026-04-04)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 55 | 2026-04-04 | QA | física → TEMPUS (VECTOR nunca ativado). "tenho dúvida em física" e "velocidade média" roteavam para TEMPUS | Envelope PSICOPEDAGOGICO em `llm.ts` tinha only 2 exemplos few-shot (mat→CALCULUS, pt→VERBETTA). Sem mapeamento explícito, LLM associava "velocidade/tempo" → TEMPUS (tempo em latim) | Adicionado MAPEAMENTO OBRIGATÓRIO MATÉRIA→HERÓI no envelope PSICOPEDAGOGICO em `llm.ts` (9 matérias, nomes exatos de heróis). TypeScript: 0 erros. **Pendente push via Escape Hatch** | ⚠️ Fix local, push pendente |
| 56 | 2026-04-04 | QA | "professora mandou escrever uma história" → TEMPUS em vez de VERBETTA | `KEYWORDS_HISTORIA` inclui `'história'` bare. `ANTI_KEYWORDS_HISTORIA` estava vazia `[]`. Match acontecia antes de VERBETTA (ordem: PORTUGUES → HISTORIA). Mas a mensagem não tinha keywords de PORTUGUES | `ANTI_KEYWORDS_HISTORIA` agora inclui frases de composição narrativa: 'escrever uma história', 'contar uma história', 'inventar uma história', 'criar uma história', 'fazer uma história', 'história inventada', 'história criativa'. TypeScript: 0 erros. **Pendente push via Escape Hatch** | ⚠️ Fix local, push pendente |

## Erros Resolvidos — QA Round 2 Segurança (2026-04-04) ✅

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 58 | 2026-04-04 | Segurança | Off-topic e jailbreaks retornavam "Oi! Tive um pequeno problema. Vamos tentar de novo?" em vez de redirecionamento educacional | PSICO recebia pedidos fora de escopo → retornava JSON `ENCAMINHAR_PARA_HUMANO` (sem campo `mensagem_ao_aluno`) OU Gemini recusava completar jailbreak → ambos causavam falha na extração de texto → fallback hardcoded | **Fix 1 — GUARDIÃO (router.ts):** `detectarGuardiao()` com 33 padrões (PADROES_JAILBREAK + PADROES_FORA_ESCOPO). Quando ativado → `{ persona: 'GUARDIAO', temaDetectado: null }`. Handler em `message.ts`: stream hardcoded "Oi, [nome], aqui só consigo te ajudar com matérias escolares!" sem nenhuma chamada LLM. **Fix 2 — PSICO prompt:** seção RESPOSTA OBRIGATÓRIA PARA FORA DE ESCOPO adicionada. Testado em produção: SEC-01, SEC-02 aprovados ✅ | ✅ Resolvido |

## Erros e Gaps — QA Round 2 (2026-04-04)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 57 | 2026-04-04 | QA R2 | **BUG-57: Stickiness muito agressivo** — CALCULUS manteve por 4 turnos com pedidos EXPLÍCITOS de troca. "quero falar com o professor de história agora" → CALCULUS respondia em vez de trocar para TEMPUS | `classificarTemaComTimeout("quero falar com o professor de história agora")` retorna "indefinido" porque a frase é puramente de navegação (sem conteúdo de matéria). Sem evidência de troca → stickiness guard mantinha herói atual | **Fix implementado (2026-04-04):** No path de bypass (`temIntentoDeTroca`), quando LLM=indefinido, verificar `temaKeywords` antes de manter herói atual. Se `temaKeywords` detecta tema diferente → trocar. TypeScript: 0 erros ✅. **Push pendente Escape Hatch** | ⚠️ Fix local — push pendente |
| GAP-01 | 2026-04-04 | QA R2 | **Sem `tempo_resposta_ms` no banco** — impossível medir latência real do LLM. Diffs entre turnos incluem tempo de leitura + digitação do usuário. Continuidade: 39-73s total. Cascata: 67-134s total (inclui PSICO + herói) | Campo nunca foi adicionado a `b2c_turnos`. Backend tem `const inicio = Date.now()` mas não persiste | **Fix:** `ALTER TABLE b2c_turnos ADD COLUMN tempo_resposta_ms integer`. Em `message.ts`: `persistirTurno({ ..., tempo_resposta_ms: Date.now() - inicio })`. Supabase type update | ⚠️ P2 — Pendente |
| GAP-02 | 2026-04-04 | QA R2 | **Agentes não pedem foto proativamente** — pipeline de imagem funciona perfeitamente (message.ts, inlineData) mas os prompts dos agentes não têm instrução para solicitar foto do exercício. Apenas 5 ocorrências de "imagem/foto" em 4 personas, nenhuma é instrução proativa | Prompts foram escritos antes do feature de imagem ser implementado (PE1). Sem instrução explícita, LLM não sugere o recurso | **Fix:** Adicionar seção `📷 USO DE IMAGEM` em CALCULUS, VECTOR, ALKA, VERBETTA. Instruir: "Se aluno menciona exercício feito no papel, peça foto. Se receber foto, analise e oriente." | ⚠️ P2 — Pendente |
| GAP-03 | 2026-04-04 | QA R2 | **MODO PAI sem seletor de filha interno** — sessão PAI fica travada à filha selecionada no ProfileModal. Leon conversou sobre "minha filha com frações no 4º ano" (Maria Paz) mas o contexto injetado era de Layla (7_fund). CALCULUS PAI responde genericamente | Sessão é criada com `aluno_id` fixo ao fazer login no perfil. Trocar de filha exige fechar sessão + selecionar outro perfil | **Opção A (MVP):** UX: documentar que para ajudar filha diferente, ir em menu → Trocar Perfil. **Opção B (V2):** Seletor dropdown de filha dentro do MODO PAI sem logout | ℹ️ UX Gap — Documentado |
| GAP-04 | 2026-04-04 | QA R2 | **Acervo espúrio gerado pelo BUG-56** — `3_fund/historia/TEMPUS` criado quando "professora mandou escrever uma história" foi roteada para TEMPUS erroneamente. Acervo de história para 3_fund foi gerado com conteúdo que pode ser irrelevante | Side effect do BUG-56: PSICO faz cascade → Super Prova gera acervo para o tema detectado (historia) para a série (3_fund) | **Fix:** Quando BUG-56 for corrigido, novos acervos espúrios não serão mais gerados. Opcionalmente: `DELETE FROM b2c_super_prova_acervo WHERE serie='3_fund' AND tema_label='historia'` | ℹ️ Side effect resolvido com BUG-56 fix |

---

## Erros Identificados — Sessão Real Layla (2026-04-12)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 59 | 2026-04-12 | Produção | **BUG-ROUTING-12abr: CALCULUS ativado no turno 6 de sessão 100% de Português** — Layla estava na sessão de Português com VERBETTA, mencionou "crônica" e CALCULUS respondeu em vez do VERBETTA | Causa provável: keyword de CALCULUS tem falso positivo com "crônica" OU o classificador LLM associou "crônica" com algum contexto matemático. Não reproduzido em ambiente controlado ainda | **Investigar:** (1) checar KEYWORDS_MATEMATICA para overlap com "crônica"; (2) verificar ANTI_KEYWORDS_MATEMATICA; (3) reler turno 6 no `LaylaEstudaPortugues.md` para ver o input exato. Fix: adicionar 'crônica', 'cronica' em ANTI_KEYWORDS_MATEMATICA se for keyword match | ⚠️ Pendente — P1 |
| 60 | 2026-04-12 | Router | **Router: null do timeout LLM não capturado pelo stickiness guard** — `classificarTema()` retorna `null` por timeout (500ms). Guard só verificava `=== 'indefinido'`. Resultado: stickiness guard não disparava, herói podia ser resetado após mensagem curta do aluno | Condição incompleta: `if (temaLLM === 'indefinido')` não captura `null` (timeout) | **Fix aplicado (commit fb4e84a):** Condição corrigida para `if (!temaLLM \|\| temaLLM === 'indefinido')`. Log melhorado com `temaLLM ?? 'null/timeout'`. TypeScript 0 erros ✅. Push pendente | ⚠️ Fix local — push pendente |
| 61 | 2026-04-12 | Router | **LLM chamado desnecessariamente para respostas curtas sem keywords** — "2", "sim", "letra c" com herói ativo disparavam classificador LLM (500ms timeout) sem necessidade | Fluxo: `temaKeywords=null` → `classificarTema(mensagem)` sempre. Sem atalho para "sem keywords + herói ativo" | **Fix aplicado (commit fb4e84a):** Novo bloco entre passo 3 e passo 4: se `!temaKeywords && sessao.agente_atual ativo → return continuidade direto`. Elimina chamada LLM inteira. TypeScript 0 erros ✅. Push pendente | ⚠️ Fix local — push pendente |

---

## Erros Pendentes (próxima sessão)

| # | Data | Fase | Descrição | Causa Raiz | Tentativa | Status |
|---|------|------|-----------|------------|-----------|--------|
| 36 | 2026-03-15 | Deploy | Railway sem env vars → fetch failed no login | .env gitignored | Leon configura no dashboard Railway | ⏳ Pendente |
| 53 | 2026-04-04 | Super Prova | QUIZ SSE event nunca chegava ao frontend | Hook 3 era fire-and-forget (`.then()` sem `await`). `processarQuiz` resolvia após `res.end()` — stream já fechado | Armazenar promise em `quizSsePromise`, `await` antes de `enviarEvento('done')`. TypeScript 0 erros ✅ | ✅ Resolvido |
| 54 | 2026-04-04 | Super Prova | Acervo gerado com conteúdo errado (Idade Média em vez de WWII) | `temaDetectado` vem de `detectarTema()` que retorna a matéria ("historia"), não o tópico específico ("segunda_guerra_mundial"). Gemini grounding gera conteúdo para 7ª série de História genérico | Fix planejado: extrair tópico específico da mensagem do aluno antes de `obterOuGerarAcervo`. Registrar com `tema_hash` granular | ⏳ Pendente |

---

## Bugs Conhecidos (não-bloqueantes)

| # | Descrição | Impacto | Prioridade |
|---|-----------|---------|------------|
| ~~B1~~ | ~~Keyword "conta"~~ | ~~Resolvido (erro #16)~~ | ✅ |
| ~~B2~~ | ~~"revolução" substring~~ | ~~Resolvido (erro #15)~~ | ✅ |

---

## Padrões de Erro Recorrentes

_(Atualizar conforme erros se repetem)_

- **Supabase:** MCP padrão (mcp__supabase) vê projeto errado. Usar mcp__0150fe87 para Super Agentes.
- **LLM/Gemini:** PSICOPEDAGOGICO nem sempre retorna JSON correto para cascata. Mitigado com seed de turnos.
- **LLM/Gemini (PRODUÇÃO):** LLM varia nomes de campos JSON e comete typos em nomes de heróis. Mitigado com extração robusta multi-campo + fuzzy match.
- **LLM/Gemini (STREAM):** Heróis podem retornar JSON em vez de texto puro no stream. Mitigado com buffer completo + response-processor pipeline 4 camadas (Bloco H).
- **LLM/Gemini (TRUNCAMENTO):** maxOutputTokens baixo trunca JSON do PSICO, quebrando cascata. PSICO precisa de 8000 tokens, heróis 4000.
- **Sanitização:** NUNCA enviar texto ao usuário sem passar pelo sanitizador incondicional (D2). Mesmo texto "limpo" pode ter resíduos JSON.
- **Imagens (CRÍTICO):** Originais em `Imagens/` têm nomes DIFERENTES de `web/public/`. SEMPRE copiar com nome correto ao atualizar. Mapeamento: `Logo_SuperAgentesPenseAI.png`→`LogoPenseAI.png`, `SuperAgentesPenseAi_buble.png`→`logo-buble.png`.
- **Router (Keywords):** Termos ambíguos causam colisão entre matérias. Mitigado com sistema de anti-keywords (blocklist por tema).
- **Router (Substring):** Keywords curtas (≤4 chars: rio, pais, base, arte) PRECISAM de word boundary regex — `.includes()` pega substrings falsas. Fix permanente em `temKeyword()`.
- **Router (Stickiness):** LLM classificador (Gemini Flash) pode associar termos cotidianos ("grego") a matérias erradas. Stickiness guard exige LLM='indefinido' antes de quebrar fluxo ativo. NUNCA remover esse guard.
- **Router (Keywords genéricas):** NUNCA adicionar preposições ou artigos a keywords de matérias ('mais', 'menos', 'conta', 'rio' solto). Keywords devem ser termos técnicos ou expressões compostas específicas.
- **Build:** `tsc` NÃO copia arquivos não-TypeScript (.md, .json). Sempre copiar manualmente no script build.
- **Dev vs Prod:** `tsx` (dev) roda direto do `src/`, `node` (prod) roda do `dist/`. Paths relativos divergem.
- **Logo Pense-AI:** Arquivo correto é `LogoPenseAI.png` (cubo 3D). NUNCA usar `logo-penseai.png`. NUNCA aplicar `brightness-0 invert`. Sempre com `relative z-10` para ficar na frente de blobs.
- **SVG icons herdam cor:** SVGs com `stroke="currentColor"` precisam de `text-white` no elemento pai. Sem isso, herdam preto.
- **TypeScript:** Nenhum até agora
- **SSE:** Nenhum até agora
- **Testes:** Isolamento de estado entre suites é crítico — usar alunos/sessões dedicados por suite

---

## Decisões Arquiteturais — 2026-04-13

### BUG-ROUTING-12abr: Root Cause Completo — Intrusões CALCULUS

**Data:** 2026-04-13
**Contexto:** 3 intrusões de CALCULUS na sessão real de Layla (2026-04-12): T6, T50, T79-81.
**Root cause (stickiness guard):** `router.ts:573-576` — quando classificador LLM tem timeout (500ms era muito curto para Gemini 2.5 Flash que demora 800-1200ms), retornava `null`. O branch `if (!temaLLMConfirm)` então **trocava para CALCULUS** em vez de manter VERBETTA. Comportamento exatamente invertido do esperado.
**Fix aplicado:** null/timeout → mantém herói ativo. Timeout LLM: 500ms → 2000ms.

**Keywords perigosas removidas:** `'-'`, `'+'`, `'='` de KEYWORDS_MATEMATICA.
- `'-'` era o gatilho em T6: Layla escreveu `- ele entendeu o conceito` (marcador de lista) → keyword `-` disparou → stickiness LLM timeout → CALCULUS tomou.
- `'+'`, `'='` causam falso positivo em frases cotidianas tipo "bom + barato".

**Anti-keywords adicionadas:** `área`, `número`, `metade` em contextos não-matemáticos.

**Lição:** Operadores aritméticos isolados NÃO devem ser keywords. O classificador LLM lida melhor com "2+3=?" do que keywords isoladas. Keywords = termos técnicos/expressões compostas.

---

## Erros Críticos — 2026-04-13 (Link Guardian)

> **ATENÇÃO:** Estes erros foram introduzidos hoje e o push NÃO foi feito. O código de produção ainda está na versão anterior. NÃO fazer push até resolução.

### ERRO-LG-1: Branch A usa herói errado (agente_atual em vez de agente_override)

| Campo | Valor |
|-------|-------|
| Data | 2026-04-13 |
| Arquivo | `server/src/routes/message.ts`, Hook 0 Branch A |
| Causa | `enviarEvento('agente', { agente: sessao.agente_atual })` ignora `agente_override` |
| Impacto | GAIA aparece quando aluno está em TEMPUS, porque sessão anterior foi de GAIA |
| Confirmado em | Teste real Layla — turno entre 103 e 104 |
| Status | ❌ NÃO CORRIGIDO |
| Correção | `const heroiBranchA = agente_override \|\| sessao.agente_atual \|\| 'PSICOPEDAGOGICO'` |

### ERRO-LG-2: Branch B não força PSICO cascade

| Campo | Valor |
|-------|-------|
| Data | 2026-04-13 |
| Arquivo | `server/src/routes/message.ts`, Hook 0 Branch B |
| Causa | Após `investigarLink`, o fluxo continua para `decidirPersona()` e `agente_override` bypassa PSICO |
| Impacto | Herói responde sem plano pedagógico baseado no conteúdo do link |
| Confirmado em | Teste real — TEMPUS entrou direto sem PSICO cascade no turno 104 |
| Status | ❌ NÃO CORRIGIDO |
| Correção | Forçar `persona = 'PSICOPEDAGOGICO'` no Branch B, ignorar `agente_override` neste turno |

### ERRO-LG-3: Hook 1 sobrescreve KB do link (race condition)

| Campo | Valor |
|-------|-------|
| Data | 2026-04-13 |
| Arquivo | `server/src/routes/message.ts`, CASO B Hook 1 |
| Causa | Hook 1 fire-and-forget detecta mudança de tema e chama `persistirKnowledgeBase` com acervo genérico cacheado, sobrescrevendo a KB do link |
| Impacto | A partir do 2º turno, herói perde conhecimento do link e recebe acervo irrelevante |
| Confirmado em | Banco: `super_prova_kb` mostra Grandes Navegações após sessão de Oriente Médio |
| Status | ❌ NÃO CORRIGIDO |
| Correção | Flag `linkKbSalva = true` no escopo — Hook 1 verifica `!linkKbSalva` antes de disparar |

### ERRO-LG-4: Super Prova KB genérica — problema raiz (pré-existente, não resolvido)

| Campo | Valor |
|-------|-------|
| Data | Identificado em múltiplas sessões, nunca resolvido |
| Arquivo | `server/src/super-prova/index.ts`, `gerar-acervo.ts` |
| Causa | Cache usa `tema_hash` genérico ("historia", "geografia"). Uma vez cacheado, o acervo genérico é reutilizado em todas as sessões da mesma matéria |
| Impacto | Super Prova nunca entregou KB específica de forma confiável. Link Guardian foi construído em cima deste sistema quebrado |
| Confirmado em | Banco: `super_prova_kb` com Grandes Navegações após sessão sobre Oriente Médio |
| Status | ❌ NÃO CORRIGIDO — problema raiz |
| Correção | Redesenhar cache para usar tema específico (vindo do PSICO) como chave, não tema genérico do router |

### LIÇÃO DO DIA: Não construir funcionalidade nova sobre fundação defeituosa

Antes de implementar Link Guardian, o Super Prova KB já tinha o ERRO-LG-4. A decisão correta era resolver o ERRO-LG-4 primeiro. Ao construir Link Guardian em cima de Super Prova quebrado, os erros se somaram e ficaram mais difíceis de diagnosticar.

---

## Super Prova: Acervo Estático → Quiz Session-Aware

**Contexto:** `b2c_super_prova_acervo` tem 1 entrada VERBETTA 7_fund criada em 2026-04-04, genérica ("portugues"). Quiz enviado para Layla não refletia a sessão real. VERBETTA nunca viu resultados.

**Decisão:** Quiz é agora responsabilidade do herói — gerado inline ao final da sessão quando `plano_universal.fechar_com_quiz = true`. O herói usa o conteúdo da sessão, não acervo.

**b2c_super_prova_acervo:** Mantida (não deletar). Pode ser útil futuramente para exportação ou quizzes offline. Não popular mais com conteúdo genérico.

### Método Universal — Por que implementar agora

**Observação:** Layla ficou 30 turnos sobre verbos. O Universal Method resolveria o mesmo conteúdo em 8 turnos máx (abertura + 3 itens × 2 turnos + fechamento).

**Princípio:** Sessão sem estrutura = conversa aberta = aluno se perde. PSICO deve qualificar tópicos antes de encaminhar ao herói quando o subtema está indefinido.

**CUIDADO:** A qualificação de tópicos não deve ser burocrática. 1 pergunta curta e direta. Se o aluno trouxe enunciado específico, pular direto para o herói.

---

## Erros Identificados e Resolvidos — Sessão Real Layla (2026-04-15)

| # | Data | Fase | Descrição | Causa Raiz | Correção | Status |
|---|------|------|-----------|------------|----------|--------|
| 62 | 2026-04-15 | Produção | **TEMPUS parava no meio da frase (turnos 114, 117)** — `observacoes_internas: null` no banco, resposta ao aluno truncada no meio de uma sentença, herói se repetia ao continuar | `gemini-2.5-flash` é modelo de pensamento. Tokens de thinking consumiam o budget de `maxOutputTokens: 4000`. JSON era cortado antes do campo `observacoes_internas`. `response-processor.ts` Camada 3 (regex) extraía texto parcial do JSON truncado — explicando por que texto aparecia em vez da mensagem de fallback | `thinkingConfig: { thinkingBudget: 0 }` adicionado em `chamarLLMStream` (llm.ts). Heróis não precisam de thinking — PSICO já planeja antes. Confirmado: turnos 119-121 completos. Commit 8e9883c ✅ | ✅ Resolvido |
| 63 | 2026-04-15 | Produção | **Super Prova servindo KB errada para tema específico** — VERBETTA recebia conteúdo sobre União Ibérica quando deveria ser sobre "Redação: Crônica e Notícia" | PSICO não preenchia `super_prova_query` → `temaEspecifico_A` usava `temaDetectado` ("portugues") → cache hit no acervo genérico de "portugues" criado em 2026-04-04 | Campo `"super_prova_query": null` + seção "SUPER PROVA QUERY — QUANDO PREENCHER" adicionados ao PSICOPEDAGOGICO.md (ambas as pastas). Commit 8e9883c ✅. Confirmado: gerou `tema_hash: "redacaocronicanoticia"` | ✅ Resolvido |
| 64 | 2026-04-15 | Produção | **investigarLink retornava null para link da OIM Brazil** — Branch B silenciosamente falhava, herói recebia KB vazia sobre o link | `investigarLink` usava `tools: [{ googleSearch: {} }]` — faz busca no Google, não fetch direto da URL. Site iom.int/br não está bem indexado no Google Search da API | Rewrite completo: `fetch()` nativo com AbortController (10s timeout) + `stripHtml()` + Gemini `generateContent` sem tools + `thinkingBudget: 0`. Fallback automático para googleSearch se fetch falhar. F1: KB fallback quando ambos falham, instrui herói a pedir trecho ao aluno. Commits d04a93c + 4bb4787 ✅ | ✅ Resolvido |
| 65 | 2026-04-15 | Produção | **VERBETTA defensivamente construtivista em excesso** — aluno frustrado não recebe ajuda mesmo após 3+ tentativas frustradas | 6 dos 8 heróis tinham apenas `REGRA PADRÃO` no ANTIRESPOSTA, sem `EXCEÇÃO — FRUSTRAÇÃO CLARA` nem `MODO IRRESTRITO`. Somente CALCULUS tinha o sistema completo | Bloco `EXCEÇÃO — FRUSTRAÇÃO CLARA (1x por interação)` + `MODO IRRESTRITO` adicionado a VERBETTA, NEURON, TEMPUS, GAIA, VECTOR, ALKA, FLEX — em `server/src/personas/` e `Prompts/` (14 arquivos). Commit d04a93c ✅ | ✅ Resolvido |

## Padrões de Erro — Novos (2026-04-15)

- **Gemini 2.5 Flash + thinking tokens:** `gemini-2.5-flash` é modelo de pensamento. Thinking consome tokens do budget de output. SEMPRE incluir `thinkingConfig: { thinkingBudget: 0 }` para heróis (que não precisam de thinking — PSICO planeja). Apenas PSICO pode usar thinking se necessário.
- **googleSearch grounding ≠ fetch direto:** `tools: [{ googleSearch: {} }]` no Gemini faz o modelo BUSCAR no Google, não acessar a URL diretamente. Para sites não indexados (institucionais, NGOs, artigos recentes), sempre usar `fetch()` nativo + stripHtml.
- **PSICO `super_prova_query`:** campo obrigatório para Super Prova funcionar com tema específico. Sem ele, temaDetectado (genérico) vira chave do cache → KB errada. PSICO DEVE preencher quando identificar subtema específico.
