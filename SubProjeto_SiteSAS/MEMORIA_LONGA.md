# MEMÓRIA LONGA — SUPERAGENTES
## Histórico Completo de Decisões Estratégicas

> Este arquivo registra o histórico permanente de decisões estratégicas do projeto. Para status atual e pendências imediatas, veja `MEMORIA_CURTA.md`.

---

## TABELA CONSOLIDADA DE DECISÕES

| # | Decisão | Racional | Data | Sessão |
|---|---------|---------|------|--------|
| D01 | Persona interna: Isabela Monteiro (CMO EdTech/SaaS) | Produto SaaS de educação exige especialização diferente de DTC/e-commerce físico. Isabela traz background Kroton + Geekie + Descomplica — exatamente o trajeto B2C→B2B que o SuperAgentes vai percorrer. | Abr 2026 | 0 |
| D02 | Preço B2C: R$49,90 individual / R$79,90 família | Alinhado com faixa de mercado EdTech brasileiro (referência MemorizAI). Família (até 3 filhos) cria argumento de custo-benefício devastador vs. Kumon. | Abr 2026 | 1 |
| D03 | Free trial de 3–7 dias, depois assinatura | Reduz fricção de entrada. Planos mensais, semestrais e anuais com desconto. Planos longos incluem 7 dias de reembolso. | Abr 2026 | 1 |
| D04 | URL: www.pense-ai.com/superagentes | Subpath do domínio pense-ai.com — não domínio separado. B2B em /superagentesescola. | Abr 2026 | 1 |
| D05 | Branding B2B: "SuperAgentes [nome da escola]" | Ex: SuperAgentes RioBranco. Sem marca separada — adaptação da marca principal ao contexto institucional. | Abr 2026 | 1 |
| D06 | Site = onboarding | O site acumula função de onboarding — mesma interface de entrada do produto. Implicação arquitetural importante. | Abr 2026 | 1 |
| D07 | Investigações de dados: prompt → agente especializado | Isabela cria o prompt de pesquisa; Leon roda com agente especializado com mais ferramentas. Isabela não tenta scraping diretamente. | Abr 2026 | 1 |
| D08 | MemorizAI: concorrente mais próximo de produto | Produto mais similar ao Super Agentes (IA educacional, construtivismo parcial). Já expandindo para concursos — foco diferente do nosso. Referência de preço e feature set. | Abr 2026 | 1 |
| D09 | Nome do produto: Super Agentes Pense-AI | Nome completo inclui a marca-mãe Pense-AI. Curto em copy: "Super Agentes". Descoberto na Sessão 1 — corrigido no documento. | Abr 2026 | 1 |
| D10 | Ecossistema Pense-AI | Empresa de consultoria de performance com IA. Produtos: Super Agentes Pense-AI (EdTech K-12), MasterData Pense-AI (dados empresariais), Cursos de IA (executivos e professores). Cada produto alimenta os outros via "portas de entrada e saída". | Abr 2026 | 1 |
| D11 | Documento de Estratégia de Marca v1.0 entregue | 9 seções. Abordagem Híbrida. Tagline master: "A IA que os pais confiam." Seção 3 inclui arquitetura do ecossistema Pense-AI. | Abr 2026 | 1 |
| D12 | Timing do onboarding psicopedagógico | Questionário apresentado APÓS fechamento de plano no site (pós-pagamento). Não antes do trial, não dentro do app. Implicação: site deve criar comprometimento suficiente antes de apresentar o questionário. | Abr 2026 | 1 |
| D13 | Filosofia "tudo ou nada" no onboarding | O site não deve "facilitar" o questionário — deve exigir dedicação total (10 minutos por filho) ou nada. Respostas superficiais prejudicam o sistema. Mensagem: "O MELHOR PARA SEU FILHO. A escolha é sua." Design de site deve criar comprometimento emocional pré-questionário. | Abr 2026 | 1 |

---

## SESSÃO 0 — SETUP INICIAL (Abril 2026)

### Contexto de entrada
Projeto novo. Leon Malatesta fundador do SuperAgentes — plataforma de tutoria educacional com IA. 9 heróis especializados por matéria (construtivismo). Modo PAI. Segurança para crianças. B2C primeiro, B2B (escolas) na sequência. Leon quer estrutura de marketing similar ao que foi construído para a Use Orgânico — mesma disciplina, nova especialização.

### O que foi executado
- Criação do CLAUDE.md com persona Isabela Monteiro
- Definição da hierarquia de documentos (Estratégia de Marca → Site/SEO → Pesquisa → Execucional)
- Criação de MEMORIA_CURTA.md e MEMORIA_LONGA.md
- Criação do PROMPT_INICIALIZACAO.md

### Descobertas críticas do briefing inicial

**Sobre o produto:**
- 9 heróis especializados — arquitetura de roteamento inteligente (keywords + LLM classifier)
- Construtivismo é o método central: NUNCA entrega resposta direta
- Modo PAI é diferencial nativo (não feature lateral)
- Guardião de segurança pré-LLM — relevante para argumento com pais e escolas
- Limite diário de uso (25 interações / 5 turnos) — modelo de assinatura

**Sobre o mercado:**
- Concorrência direta principal: MemorizAI (similar, mas só EM/ENEM)
- Concorrência indireta: TutorMundi (humano, caro), Khan Academy (gratuito, genérico), Kumon (repetição)
- Janela de mercado: fundamental II com envolvimento parental — menos disputado
- MemorizAI não tem modo pai, não tem segurança declarada, não cobre fundamental

**Sobre a transição B2B:**
- Requer 12–18 meses de preparação antes de ativar
- Cada decisão B2C deve ser compatível com virada institucional
- Produto para escolas precisa: painel por turma, dados de desempenho, LGPD-compliant, CS, contrato

### Decisões tomadas nesta sessão
- D01: Persona Isabela Monteiro definida

---

---

## SESSÃO 1 — ALINHAMENTO ESTRATÉGICO (Abril 2026)

### Contexto de entrada
Primeira sessão de trabalho real. Leon confirmou 8 decisões que estavam abertas. App em fase de QA, preparando para testes com humanos. Site precisa estar pronto em paralelo — e acumula função de onboarding.

### Alinhamentos críticos desta sessão

**Sobre preço e modelo:**
Leon confirmou R$49,90 individual / R$79,90 família como valores pensados para o mercado (referência MemorizAI). Free trial de 3–7 dias antes de cobrança. Planos mensais, semestrais e anuais disponíveis — planos longos com 7 dias de reembolso após pagamento.

**Sobre URL:**
O site vive em www.pense-ai.com/superagentes (subpath) — não é domínio independente. Isso tem implicações importantes para SEO (autoridade de domínio herdada do pense-ai.com) e para arquitetura de onboarding (funções integradas).

**Sobre B2B:**
Não há marca separada para escolas. O produto vira "SuperAgentes [nome da escola]" — adaptação de identidade no app. Entrada B2B em /superagentesescola.

**Sobre concorrentes:**
MemorizAI é o concorrente mais próximo em produto (IA educacional, construtivismo parcial). Já está expandindo para concursos — SuperAgentes não quer ir nessa direção agora (foco em provar o modelo educacional). Importante monitorar.

**Sobre processo de trabalho:**
Toda investigação que requer scraping/dados externos = Isabela cria o prompt, Leon roda com agente especializado com mais ferramentas. Nunca tentar diretamente.

**Sobre superpowers:**
Sempre usar para planos, brainstorms, análises e execuções — Leon prefere e confia no plugin.

### O que foi executado
- Leitura completa da pasta `investigacao/` + BASE CURSO PENSE-AI.txt
- Confirmação e atualização de decisões D02–D26
- Mapeamento completo da arquitetura de agentes (visíveis + ocultos)
- P.E.N.S.E.AI documentada com os 7 passos completos
- **DOCUMENTO_ESTRATEGIA_MARCA_SuperAgentes.docx v1.0 entregue**

### Contexto crítico sobre o produto (descoberto Sessão 1)
- **4ª versão construída do zero:** decisões arquiteturais são battle-tested, resultado de 3 reconstruções anteriores
- **Onboarding raso não quebra experiência:** PSICOPEDAGOGICO é amplificador, não pré-requisito — design resiliente validado com família do fundador
- **Validação familiar aprovada:** incluindo cônjuge — o early tester mais criterioso possível
- **Implicação para marketing:** a narrativa de "feito por um pai para pais" é ainda mais forte quando se sabe que foi testado com os próprios filhos e aprovado pela própria família

---

*Próxima seção: Sessão 2 — continuação*

---

## SESSÃO 3 — PESQUISA DE MERCADO (2026-04-07)

### Contexto de entrada
Sessão focada em dados de mercado. Leon solicitou abordagem data-driven rigorosa: "não caia na armadilha do dado fácil — cruze dados e encontre verdades secretas". Novo lote de investigação Pense-Intelligence (arquivos 01–06) disponível com dados reais de INEP, GKP, Semrush, evidências científicas e pesquisa de adoção de smartphones.

### Descobertas estratégicas críticas

**A verdade secreta dos keywords (GKP Real — abr/2025–mar/2026):**
13 de 15 keywords "core" de dor parental têm ZERO volume mensurável no Google. Isso não indica ausência de demanda — indica que pais não descobrem soluções via Google. Descobrem via grupos WhatsApp e recomendação social. Implicação direta: o referral loop não é uma estratégia paralela — é a estratégia principal de aquisição orgânica.

Keywords com volume real:
- "homeschooling brasil" → 1K-10K/mês (MAIOR de todo o lote)
- "professor particular online" → 100-1K/mês + **+900% em 3 meses** (explosão iminente)
- "reforço escolar online", "aula particular online" → 100-1K/mês
- "chatgpt para estudar" → 100-1K (pais buscam pelo produto, não pela categoria "IA")

**Concorrentes — verdade real:**
- MemorizAI: ranking Semrush #10.362.948 → tráfego negligenciável. Não é concorrente real em tráfego, apenas em produto.
- Kumon: 116.370 visitas/mês → concorrente real na mente do pai (R$200-400/mês/disciplina). O argumento "R$79,90 por 3 filhos vs. R$600-1.200/mês no Kumon" é devastador.
- TutorMundi: ~50K-150K/mês (estimado Semrush).

**TAM/SAM derivação rigorosa (bottom-up):**
- TAM: R$47,3bi (mercado total de reforço escolar Brasil)
- SAM: 19,3M alunos Fund II+EM privado × 72,2% (classes A/B/C ABEP) × 93% (smartphone com internet TIC) × 39% (pais querem reforço Datafolha) = 5,0M famílias → R$17,5bi endereçável
- EdTech penetração estimada: 3-6% → SOM R$524M-1,048bi

**Evidência científica consolidada:**
7 estudos/meta-análises de metacognição com effect sizes robustos:
- EEF: +7-8 meses de progresso adicional (355 estudos, alta confiança)
- Hattie 2023: d=0,69 (2.100 meta-análises, 400M alunos)
- Hidayat 2025: ES=1,11 em matemática (13.924 alunos, PRISMA)
- Kao 2025: eta-p=0,32 para IA socrática K-12 (RCT, preprint Research Square)
- Ohtani 2018: r=0,53 (metacognição prediz desempenho independente de QI)

**Homeschooling como público central (D33):**
"homeschooling brasil" = maior keyword do lote inteiro. O Modo PAI foi feito para este público. D33 confirmada por Leon: homeschoolers são público central, não nicho adjacente.

### Decisões desta sessão

| # | Decisão | Valor |
|---|---------|-------|
| D31 | Linguagem pedagógica dual | "Metacogni-ação" para pais (B2C), "construtivismo socrático" para educadores (B2B) |
| D32 | Trial — ABERTA | RevenueCat LATAM: conversão semana 6+. Hipótese: trial 14-21 dias. Leon decide após primeiros usuários. Métrica: conversão ≥ 10% |
| D33 | Homeschooling = público central | App no modo PAI foi feita para este público. "homeschooling brasil" 1K-10K/mês lidera o lote GKP. |
| D34 | Referral loop = hipótese primária de aquisição | Video de Leon no D+30 → pedido pessoal de publicação em grupos de escola. "Tecnologia do bem". |

### Entregável produzido

**PESQUISA_MERCADO_SuperAgentes.docx** — Abordagem C (Modular + Síntese Executiva):
- Camada 0: Síntese Executiva com as 6 verdades do mercado
- M1: Dimensionamento de mercado (TAM/SAM/SOM)
- M2: Público-alvo (perfis + segmentos)
- M3: Concorrentes (análise comparativa)
- M4: Comportamento de busca (GKP análise)
- M5: Ansiedades dos pais (pesquisa qualitativa)
- M6: Evidência científica (metacognição)
- M7: Oportunidades SEO (clusters de keywords)
- M8: Estratégia de aquisição (referral loop + canais)
- M9: Decisões estratégicas abertas (D32/D33/D34)
- Apêndice: Fontes e metodologia

Documento: 1082 parágrafos. Validado. 41KB.
