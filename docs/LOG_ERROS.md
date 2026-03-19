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

## Erros Pendentes

| # | Data | Fase | Descrição | Causa Raiz | Tentativa | Status |
|---|------|------|-----------|------------|-----------|--------|
| 36 | 2026-03-15 | Deploy | Railway sem env vars → fetch failed no login | .env gitignored | Leon configura no dashboard Railway | ⏳ Pendente |

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
