# MEMÓRIA CURTA — SUPERAGENTES
## Status Atual · Pendências Imediatas · Próximas Ações

> **Leia isto antes de qualquer ação na sessão.** Este arquivo é atualizado automaticamente ao final de cada tarefa. Para histórico completo, veja `MEMORIA_LONGA.md`.

---

## STATUS GERAL DO PROJETO

**Data da última atualização:** 2026-04-10 (Sessão 7 — Plano de retomada backend concluído)
**Fase atual:** SITE EM PRODUÇÃO 🚀 | www.pense-ai.com/superagentes/ está ao ar e funcional. Backend em integração.
**Bloqueios ativos:** D32 — decisão de trial pendente. Dados institucionais para Privacidade/Termos pendentes (CNPJ, endereço, DPO email). Credenciais Supabase + MP aguardando Leon.

### Dashboard de Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| **Setup** | CLAUDE.md + memórias | ✅ Concluído |
| **A** | Documento de Estratégia de Marca | ✅ Concluído — v1.0 entregue |
| **B** | Documento Site + SEO | ✅ Concluído — v1.0 entregue |
| **C** | Pesquisa de Mercado | ✅ Concluído — v1.0 entregue |
| **D** | Plano Execucional | ⏳ Próximo |

---

## ÚLTIMA SESSÃO (Sessão 7 — Plano de retomada backend) — O QUE FOI FEITO

1. **Leitura completa das memórias do Caio** (MEMORIA_CURTA.md + MEMORIA_LONGA.md) para diagnóstico de estado do backend
2. **Plano de retomada backend criado** — duas trilhas distintas: Caio executa agora (T01-T08 ajustado) + bloqueios externos mapeados com sequência de desbloqueio
3. **T03 removido da fila do Caio** — Leon já fez vistoria visual completa 20 vezes, desnecessário
4. **Decisão: ZERO n8n** — descartado completamente. Todas as automações de onboarding serão resolvidas in-site (Supabase triggers ou lógica própria). Oscar não precisa configurar webhooks externos.
5. **Prompt de Caio escrito** — tarefas T01, T02, T05, T06, T07, T08 com specs detalhadas (~6h de trabalho desbloqueado)
6. **Sequência de desbloqueio definida:** Supabase (crítico, 4h dev) → MP SDK (~2h dev) → Dados legais (30min) → Vídeo Leon (1h) → URL app/Lucas (15min)
7. **Definição de MVP go-live:** Supabase + MP + Modais legais + Vídeo Leon = pronto para receber assinantes pagantes com segurança

## ÚLTIMA SESSÃO ANTERIOR (Sessão 6 — Site ao ar, iterações com Caio) — O QUE FOI FEITO

1. **SITE AO AR:** www.pense-ai.com/superagentes/ está em produção e funcional
2. **Hero photo finalizada:** família brasileira (pai branco cabelo escuro, mãe morena, 3 filhos, churrasqueira ao fundo, azulejo) — resultado de múltiplas iterações de prompt para nano banana no Google AI Studio
3. **Toggle de precificação:** Mensal/Semestral/Anual implementado. Preços: Simples R$49,90/R$44,90/R$39,90 | Familiar R$79,90/R$69,90/R$59,90. Default = Anual.
4. **Feature hover cards personas:** spec completa entregue para Caio — UI real da plataforma, conversas reais (Pedro/Supervisor, capivara/Verbetta, Calculus Modo PAI, Prof. Pense-AI). Cards scrolláveis. Design tokens extraídos do app.
5. **Terceira coluna planos — Plataforma para Colégios:** copy + spec completa para Caio, incluindo form de leads (tabela `leads_escolas` no Supabase), badge EXCLUSIVO no Super IA + plano de reversão pedagógica.
6. **Privacidade e Termos de Uso:** dois documentos redigidos em PT-BR (LGPD-compliant, proteção de menores, ECA). Implementação como overlay animado (não página separada). Placeholders [PREENCHER] marcados em âmbar.
7. **Ideia versão Escolas:** Leon teve ideia nova — guardada em memória, retomar.
8. **Sistema de Códigos Beta:** brainstorm iniciado mas pausado. Retomar (ver seção Próximas Ações).

## ÚLTIMA SESSÃO ANTERIOR (Sessão 5 — Caio Fontana inicializado) — O QUE FOI FEITO

1. Plano de inicialização `docs/plans/2026-04-08-caio-fontana-initialization.md` — 3 issues críticos corrigidos (baseline table, GSAP command, prereq check)
2. **Caio Fontana ativado:** `web_pense-ai/CLAUDE.md` criado — identidade completa, 10 seções
3. **`web_pense-ai/MEMORIA_CURTA.md`** criado — Day 1 dashboard + dependências bloqueantes
4. **`web_pense-ai/MEMORIA_LONGA.md`** criado — D01–D06, SESSÃO 0, contexto herdado completo
5. **`web_pense-ai/docs/specs/README.md`** e **`docs/plans/README.md`** criados
6. Descoberta: `web_pense-ai/` já tem `.agent/skills/` com frontend-ui-ux, legacy_surgeon, visual_qa e `memory-bank/` do Cursor — Caio tem recursos adicionais já instalados

### Caio Fontana — resumo de status

- **Home:** `web_pense-ai/`
- **Stack:** Vanilla JS + GSAP + Lenis (site atual) + Vite/Supabase (/superagentes)
- **Repo:** github.com/Leonmala/Site_Pense-ai → Vercel auto-deploy
- **Blocking para /superagentes:** Site Production Brief (meu próximo entregável) + Supabase (Leon) + API contract (Leon+Lucas) + Gateway de pagamento (Leon)

---

## ÚLTIMA SESSÃO ANTERIOR (Sessão 3 — Pesquisa de Mercado completa) — O QUE FOI FEITO

1. Auditoria de dados da pasta `investigacao/` — diagnóstico honesto entregue a Leon
2. Produção de briefings técnicos para Pense-Intelligence (dados faltantes)
3. Análise de novo lote de dados (01–06) — TAM/SAM, INEP, GKP, metacognição, concorrentes
4. Estratégia de referral loop ("tecnologia do bem") alinhada com Leon — D34
5. Brainstorming + spec de documento com 2 rodadas de revisão (5 problemas críticos resolvidos)
6. Decisões D32 (trial), D33 (homeschooling = público central), D34 (referral loop) confirmadas
7. **PESQUISA_MERCADO_SuperAgentes.docx entregue — Camada 0 + M1–M9 + Apêndice, v1.0**

### Descobertas críticas desta sessão

- **GKP Revelação:** 13/15 keywords de dor parental = ZERO volume. Pais não buscam soluções via Google — descobrem via grupos WhatsApp. Valida o referral loop como hipótese primária de aquisição.
- **"professor particular online" +900% em 3 meses** — único termo com crescimento explosivo. Janela de oportunidade aberta.
- **"homeschooling brasil" = 1K-10K/mês** — maior volume de todo o lote. D33 confirmada: homeschoolers são público central.
- **MemorizAI = #10.362.948 no ranking Semrush** — tráfego negligenciável. Não é concorrente real em tráfego.
- **Kumon = 116.370 visitas/mês** — concorrente real na mente do pai (R$200-400/mês/disciplina).
- **Evidência científica sólida:** EEF +7-8 meses (355 estudos), Hattie d=0.69 (2.100 meta-análises), Kao 2025 RCT Socrático eta-p=0.32.

---

## PRÓXIMAS AÇÕES IMEDIATAS

| Prioridade | Ação | Contexto |
|-----------|------|---------|
| ✅ ENTREGUE | ~~Site Production Brief~~ | Entregue: `docs/specs/2026-04-08-site-production-brief.md` |
| ✅ ENTREGUE | ~~`pense-ai:design-dna` skill~~ | Instalado em `web_pense-ai/.claude/skills/pense-ai-design-dna/` |
| ✅ ENTREGUE | ~~`pense-ai:frontend-excellence` skill~~ | Instalado em `web_pense-ai/.claude/skills/pense-ai-frontend-excellence/` |
| ✅ ENTREGUE | ~~Plano de retomada backend~~ | Mapeamento completo: T01-T08 para Caio + sequência de desbloqueio para Leon/Oscar/Lucas |
| 🔴 LEON HOJE | **Supabase credentials** | URL do projeto + anon key → Caio integra em ~4h após receber |
| 🔴 LEON HOJE | **Mercado Pago SDK credentials** | Credenciais produção (ou sandbox) → Caio ativa PIX em ~2h após receber |
| 🔴 LEON HOJE | **Dados institucionais para Privacidade/Termos** | CNPJ, endereço completo, cidade do foro, email contato@pense-ai.com, email privacidade@pense-ai.com (DPO). Sem esses dados os documentos não podem ir ao ar. |
| 🔴 LEON BREVE | **Vídeo pessoal para overlay etapa 2** | Player + thumbnail já existem no site — só falta o vídeo. Caio integra em 1h após receber. |
| 🔴 LUCAS | **URL real do app** | Redirect pós-questionário → app real. Pode ser placeholder enquanto isso. |
| 🔴 RETOMAR | **Sistema de Códigos de Acesso Beta — brainstorm pausado** | Decisões já tomadas: código digitado, 7 dias de acesso, genérico + usuário vincula email/senha na ativação, corte no dia 7 + tela de conversão, página /admin para Leon gerar códigos. Abordagem: Supabase nativo + admin page. Próximo: design detalhado → spec → prompt para Caio. |
| 🟡 IMPORTANTE | **Iniciar PLANO_EXECUCIONAL_SuperAgentes.docx** | Fase D — próximo grande entregável de Isabela |
| 🟡 IMPORTANTE | **Formalizar referral loop com spec de produção** | D34 confirmada. Mechanic: video Leon D+30 → pedido WhatsApp grupos escola |
| 🟡 IMPORTANTE | **Definir trial (D32)** | LATAM converte semana 6+. Leon decide após primeiros usuários reais. |
| 🟡 IMPORTANTE | **Atualizar DOCUMENTO_ESTRATEGIA_MARCA para v1.1** | Adicionar linguagem Metacogni-ação (D31) — decisão tomada mas não documentada no doc principal |
| 🟢 QUANDO POSSÍVEL | **Segunda rodada GKP** | 20 termos adicionais listados no consolidado |

---

## DECISÕES CONFIRMADAS (Sessão 1)

| D12 | Nome completo do produto | **Super Agentes Pense-AI** (não "SuperAgentes") |
| D13 | Nome curto / uso em copy | "Super Agentes" |
| D14 | Empresa / ecossistema | **Pense-AI** — consultoria de performance com IA |
| D15 | Linha de produtos Pense-AI | Super Agentes Pense-AI + MasterData Pense-AI + Cursos de IA (executivos e professores) |
| D16 | Estratégia de ecossistema | Cada produto é porta de entrada para os outros — cross-sell orgânico, sem prejudicar funil principal |
| D17 | MasterData Pense-AI — descrição correta | Sanitização de banco de dados SAP. Nicho B2B. Alto potencial de faturamento em curto prazo. (Correção: não é "performance de dados genérica") |
| D18 | Super Agentes ensina pais também | A plataforma não é só para alunos — pais aprendem a acompanhar e usar IA com o filho |
| D19 | Prof. Pense-AI | Herói/agente adicional. Público: adolescentes EM + pais. Ensina a pensar IA, promptar melhor, glossário tech (MCP, CLI, API...). Metodologia P.E.N.S.E.AI de metacognição. Ponte natural para Cursos de IA do ecossistema |
| D20 | Metodologia P.E.N.S.E.AI | Metacognição aplicada à IA. Tese: "Só pode dizer para uma IA como pensar quem domina o próprio pensamento." Propriedade intelectual da Pense-AI. |

| D21 | Arquitetura de agentes ocultos | PSICOPEDAGOGICO: perfil psicopedagógico (onboarding pai) + memória vetorial → plano personalizado + envelope de segurança. SUPER PROVA: fallback de conteúdo + quiz de fechamento (8–24 questões por idade). Ambos invisíveis ao usuário. |
| D22 | P.E.N.S.E.AI completo | P=Parceria, E=Elabore junto, N=Não aceite neutralidade, S=Sintetize camadas, E=Extrapole o óbvio, A=Acumule memória, I=Investigue seu processo. 7 passos. IP da Pense-AI. |
| D23 | Prof. Pense-AI = 9º herói visível | PSICOPEDAGOGICO é agente oculto (não herói visível). Total: 9 heróis visíveis + 2 agentes ocultos. |
| D24 | Produto em 4ª versão — reconstruído do zero 4x | Arquitetura atual é resultado de eliminação prática de tudo que não funcionou. Decisões são battle-tested, não teóricas. Nenhum concorrente tem esse aprendizado sem o mesmo processo. |
| D25 | Onboarding raso não quebra a experiência | Testado com família do fundador. PSICOPEDAGOGICO funciona como amplificador, não pré-requisito. Produto sustenta experiência sólida mesmo sem perfil inicial rico. Design resiliente validado. |
| D26 | Testes com família aprovados (incluindo cônjuge) | Sinal de validação forte — família não tem incentivo para poupar feedback. Esposa (early tester mais criterioso possível) aprovou. |
| D27 | Questionário de Acolhimento Psicopedagógico — estrutura | 18 questões (2 opcionais). Mix: unica, multipla, sim/não+detalhe, texto livre. Cobre: atitude escolar, áreas de interesse/dificuldade, rotina, autonomia, atenção, reação a desafios, perfil social, estilo de aprendizagem, gatilhos de confiança, interesses atuais. Output: JSON estruturado com op+label → alimenta PSICOPEDAGOGICO. |
| D28 | Q18 — "brilhar os olhos" | Pergunta opcional final do onboarding. "Existe algo que faz seu filho brilhar os olhos?" — dado de maior valor qualitativo para personalização. Cria investimento emocional do pai no ato de responder. |
| D29 | Onboarding: timing confirmado | O questionário é apresentado APÓS o fechamento de plano no site (pós-pagamento/assinatura). Não antes do trial, não dentro do app antes do primeiro uso. |
| D31 | Linguagem pedagógica: "Metacogni-ação" para pais, "construtivismo" para educadores | Insight do dono da EGV: pais conservadores têm preconceito com "construtivismo" (carga política). "Metacognição Aplicada" / "Metacogni-ação" = neutro, aspiracional, neurocientífico. Keyword emergente: "metacognição para crianças". |
| D30 | Filosofia "tudo ou nada" no onboarding | Estratégia barra pesada: o site deve preparar o pai para responder com qualidade total (10 minutos de dedicação por filho) ou não responder nada. Respostas levianas não ajudam o sistema. Mensagem central: "O MELHOR PARA SEU FILHO. A escolha é sua." Implicação de site: toda a jornada pré-questionário deve criar comprometimento emocional suficiente para que o pai chegue ali pronto e disposto. |



| # | Decisão | Valor confirmado |
|---|---------|-----------------|
| D02 | Preço B2C individual | R$49,90/mês |
| D03 | Preço B2C família (até 3 filhos) | R$79,90/mês |
| D04 | Modelo de entrada | Free trial 3–7 dias, depois assinatura mensal/semestral/anual |
| D05 | Política de reembolso | 7 dias após início de plano longo para desistir |
| D06 | Domínio/URL | www.pense-ai.com/superagentes (subpath do domínio pense-ai.com) |
| D07 | URL escola (B2B) | www.pense-ai.com/superagentesescola |
| D08 | Branding B2B | "Super Agentes [nome da escola]" — ex: Super Agentes RioBranco |
| D09 | Concorrente mais próximo de produto | MemorizAI (produto similar; já expandindo para concursos — nós não queremos agora) |
| D10 | Função do site | Site + onboarding combinados — mesma interface |
| D11 | Investigações de dados | Criar prompt → Leon roda com agente especializado. Nunca tentar scraping diretamente. |

## DECISÕES ABERTAS

| # | Decisão | Contexto | Quem decide |
|---|---------|---------|------------|
| D32 | Duração do trial | RevenueCat LATAM: usuários convertem na semana 6+, não semana 1. Hipótese: trial 14–21 dias. Métrica de sucesso: conversão trial→pago ≥ 10%. Leon decide após primeiros usuários reais. | Leon |
| D35 | Gateway de pagamento | **Mercado Pago** — PIX obrigatório + cartão de crédito. Sem Stripe, sem Pagar.me. PIX = maior conversão no Brasil. Leon providencia credenciais em paralelo com desenvolvimento. | Leon → Caio |
| 1 | Data de lançamento B2C | App em QA — depende de testes com humanos + entregáveis de marketing | Leon |
| 2 | Preços dos planos semestral e anual | Definir desconto adequado ao mercado | Leon + Isabela |

---

## LEMBRETES PERMANENTES DE PROCESSO

- **Dois compradores, uma decisão.** Marketing fala com o pai. Produto retém o aluno.
- **Churn é o CEO.** Aquisição sem retenção não funciona.
- **B2B começa agora.** Cada decisão B2C deve ser compatível com a virada institucional.
- **Construtivismo é a promessa central** — não é detalhe técnico, é diferencial de marketing.
- **Segurança de dados de criança é vantagem competitiva** para pais E para escolas.

---

## REGISTRO DE ATUALIZAÇÕES DESTE ARQUIVO

| Data | Sessão | O que mudou |
|------|--------|------------|
| Abril 2026 | 0 | Criação inicial — setup do projeto |
| Abril 2026 | 1 | Decisões D02–D35 confirmadas. Ecossistema Pense-AI mapeado. Prof. Pense-AI como 9º herói. Arquitetura oculta documentada. P.E.N.S.E.AI 7 passos. Onboarding: pós-fechamento + filosofia tudo ou nada. Modo PAI corrigido (co-educação, não monitoramento). Supervisor Educacional documentado. Menus por perfil documentados. Roteamento automático de agentes documentado. Suporte a imagens + voz V2 documentados. DOCUMENTO_ESTRATEGIA_MARCA v1.0 entregue. DOCUMENTO_SITE_SEO v1.0 entregue. Fases A e B ✅ |
| Abril 2026 | 2 | DOCUMENTO_SITE_SEO_SuperAgentes.docx v1.0 produzido. Spec aprovado. Arquitetura de produto completamente atualizada no CLAUDE.md. |
| 2026-04-07 | 3 | PESQUISA_MERCADO_SuperAgentes.docx v1.0 entregue. Auditoria de dados. Verdades secretas de GKP (13/15 keywords = zero). D32/D33/D34 confirmadas. Referral loop alinhado. Evidência científica de metacognição consolidada. Fase C ✅ |
| 2026-04-08 | 4 (abertura) | Oscar entra na Pense-AI como Chefe de Operações. CLAUDE.md atualizado com organograma. Leon = decisão final / Diretor Geral. Oscar = líder operacional / pode direcionar tasks. Ambos podem solicitar trabalhos. |
| 2026-04-08 | 5 | **Caio Fontana ativado e equipado.** CLAUDE.md + memórias + docs/ + Site Production Brief + skills pense-ai:design-dna e pense-ai:frontend-excellence. Gateway: **Mercado Pago + PIX** (D35 — Leon resolve em paralelo, Caio avança com mock). Nenhum item de Leon é bloqueio de execução. Caio começa imediatamente. |
| 2026-04-10 | 7 | **Plano de retomada backend concluído.** Memórias do Caio lidas e diagnosticadas. T03 removido da fila (Leon já fez vistoria). **DECISÃO ESTRATÉGICA: zero n8n** — automações serão in-site (Supabase triggers ou lógica própria). Sequência de desbloqueio definida: Supabase → MP → dados legais → vídeo → URL app. Prompt do Caio para sessão de hoje escrito (T01+T02+T05+T06+T07+T08 = ~6h desbloqueados). |
| 2026-04-07 | 3 (encerramento) | Projeção M1–M12 entregue (conservador e entusiasta). Conservador: 1.155 clientes / MRR R$67K / Receita Ano 1 ~R$351K / ARR ~R$800K. Entusiasta: 6.465 clientes / MRR R$375K / Receita Ano 1 ~R$1,7M / ARR ~R$4,5M. Premissas documentadas. Nota estratégica: variável crítica é churn, não aquisição. |

---

*Próxima atualização: automática ao final da próxima tarefa*
