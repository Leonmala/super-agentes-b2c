# Spec: Documento Site + SEO — Super Agentes Pense-AI
**Data:** 2026-04-07
**Versão:** 1.0
**Autora:** Isabela Monteiro (CMO Fracionária)
**Revisado por:** Leon Malatesta (Fundador)
**Status:** APROVADO

---

## Contexto da Decisão

Este spec define a arquitetura completa do **DOCUMENTO_SITE_SEO_SuperAgentes.docx** — o segundo entregável estratégico do projeto, derivado do Documento de Estratégia de Marca.

### Restrições confirmadas em sessão
- **Zero budget para tráfego pago** no lançamento. Reinvestimento do que entrar, crescimento orgânico como motor principal.
- **Presença social zero** no lançamento. Leon não ativará conteúdo pessoal antes de ter produto no ar + cases maduros. Decisão estratégica correta: marca pessoal construída sobre prova, não promessa.
- **Página única** (long-scroll) hospedada em `pense-ai.com/superagentes`. Herda autoridade de domínio do site de consultoria.
- **Questionário pós-pagamento.** Filosofia "tudo ou nada": o site deve criar comprometimento emocional suficiente para que o pai chegue ao questionário pronto para dedicar 10 minutos por filho. Respostas superficiais degradam o sistema — o produto exige qualidade de entrada.
- **Seção B2B futura:** `/superagentesescola` — fundação arquitetada agora, execução em 12–18 meses.

### Abordagem aprovada
**Approach B — Documento Estratégico Completo:** 10 seções em 3 camadas. Serve como guia de referência por 12–18 meses para Leon + agentes de execução.

---

## Arquitetura do Documento (10 seções, 3 camadas)

---

### CAMADA 1 — FUNDAÇÃO ESTRATÉGICA

#### Seção 1 — Contexto e Objetivos

**O que contém:**
- Papel da página no ecossistema Pense-AI: filha da consultoria, mesma mãe, personalidade própria. DNA visual Alice herdado (`pense-ai.com`), narrativa própria do produto.
- O problema que a página resolve para o pai: acompanhamento real do filho com segurança, construtivismo declarado, não mais um app de conteúdo.
- A tensão central do marketing: pai paga (motivação: ansiedade, confiança, resultado), aluno usa (motivação: engajamento, não levar bronca, entender). Toda decisão de copy passa por essa distinção.
- Como o `/superagentes` se encaixa no ecossistema: porta de entrada B2C que alimenta futuro B2B e cria pontes orgânicas para os Cursos de IA Pense-AI e MasterData.
- **Definição concreta de sucesso:**
  - Conversão: taxa de trial / taxa de assinatura paga
  - Ativação: taxa de conclusão do Questionário de Acolhimento Psicopedagógico (a métrica mais honesta do produto)
  - Orgânico: posição nas keywords primárias nos primeiros 6 meses; tráfego orgânico mensal crescente

#### Seção 2 — Jornada do Usuário

**O que contém:**
Mapa emocional em 6 estágios — não um fluxograma técnico, mas o estado mental do pai em cada momento da página.

| Estágio | Estado emocional | Seção da página correspondente | O que a página precisa fazer |
|---------|-----------------|-------------------------------|------------------------------|
| **1. Descoberta** | "Mais um app?" / ceticismo inicial | Hero | Reconhecimento imediato — "isso é pra mim" |
| **2. Reconhecimento** | "Isso parece diferente" | Máscaras + Heat Map | O pai se vê no produto antes de qualquer argumento racional |
| **3. Confiança** | "Parece sério" | Deck dos Heróis + Comparativo | O filho quer usar; o pai entende o diferencial |
| **4. Comprometimento** | "Quero isso para o meu filho" | Planos e Valores | Decisão emocional tomada antes do CTA |
| **5. Decisão** | "Vou assinar" | Overlay transacional — pagamento | Fricção mínima, garantia visível |
| **6. Ativação** | "Vou fazer isso direito" | Vídeo Leon + Questionário | Pacto, não formulário. Comprometimento total ou nada. |

**A filosofia "tudo ou nada" documentada:**
O questionário não é fricção — é respeito. O pai que chegou até aqui já pagou. Pedir 10 minutos de atenção por filho é coerente com a promessa do produto: "O melhor para o seu filho. A escolha é sua." O site tem a responsabilidade de preparar o pai emocionalmente para esse momento desde o Hero. Quem não está disposto a fazer o onboarding com qualidade era risco de churn de qualquer forma.

---

### CAMADA 2 — ESPECIFICAÇÃO EXECUTÁVEL

#### Seção 3 — Arquitetura da Página

**O que contém:**
Fichas técnicas para cada uma das 6 seções da página. Cada ficha contém:
- Objetivo de comunicação
- Conteúdo obrigatório
- Direção de design e interação
- O que o usuário deve sentir ao sair dali

**Ficha 1 — Hero**
- **Objetivo:** Reconhecimento imediato + âncora emocional
- **Conteúdo:** Foto família brasileira contemporânea em ambiente doméstico real — mãe na bancada da cozinha ajudando filha pequena no tablet com o app; filho adolescente na poltrona com iPhone e caderno; filho do meio com notebook; pai com pão no garfo e maçã na mão explicando rotação e translação.
- **Tagline:** "Super Agentes Pense-AI — é para toda a família."
- **Interação:** Estático, foco total na imagem. Scroll dispara a próxima seção.
- **Sentimento de saída:** "Isso é a minha casa. Isso é para mim."

**Ficha 2 — Retratos Flutuantes + Diagrama Piramidal + Heat Map**
- **Objetivo:** Transformar os rostos reais da família em nós de personas — o pai se vê literalmente no produto
- **Conteúdo:** Scroll recorta os rostos reais de cada membro da família em envelopes circulares — não é cartoonização nem máscara artística. É o rosto real da pessoa dentro de um círculo que se destaca da foto como avatar flutuante. Esses retratos circulares navegam pelo espaço e se reorganizam em pirâmide (pais no topo, filhos abaixo). Ao redor de cada retrato, features do produto aparecem como gráfico de calor: posicionadas por proximidade ao público para quem são relevantes. Features próximas aos pais: Modo PAI, Supervisor Educacional, Prof. Pense-AI, segurança. Features próximas aos filhos: os 9 heróis, SUPER PROVA, memória por aluno.
- **Destaque obrigatório no Heat Map:** o ambiente PAI tem três camadas que precisam ser comunicadas com clareza — **Modo PAI** (co-educação: os mesmos agentes ensinando o pai a ensinar), **Supervisor Educacional** (observação: visibilidade em tempo real do que os filhos estão fazendo, dificuldades, habilidades, insights) e **Prof. Pense-AI** (letramento em IA para o próprio pai). Nenhum concorrente tem nada equivalente.
- **Interação:** Animação scroll-driven. Features no heat map são clicáveis/hoverable com mini-descrição.
- **Sentimento de saída:** "Entendi que isso é para mim também, não só para o meu filho."

**Ficha 3 — Deck dos 9 Heróis**
- **Objetivo:** O filho quer usar antes do pai pagar
- **Conteúdo:** Cards virtuais dos 9 agentes. Visual: super-heróis estilo Marvel com representação inclusiva real — gordos, magros, cadeirantes, idosos, jovens, indígenas. Card interativo com flip: frente = identidade visual do herói + nome + matéria; verso = perfil do personagem (personalidade, método de ensino, frase característica).
- **Os 9:** CALCULUS (Matemática), VERBETTA (Português), NEURON (Ciências), TEMPUS (História), GAIA (Geografia), VECTOR (Física), ALKA (Química), FLEX (Inglês/Espanhol), PROF. PENSE-AI (Matéria: IA — ensina pais e alunos do EM a promptar e entender IA usando o método P.E.N.S.E.AI).
- **Modo PAI nos cards:** indicar visualmente que cada herói tem dois modos — o card pode comunicar "também disponível para pais" ou mostrar o ícone do botão PAI.
- **Interação:** Deck navegável (carousel ou grid). Flip animation no hover/tap.
- **Sentimento de saída:** "Meu filho vai querer esses caras. Eu quero o Prof. Pense-AI."

**Ficha 4 — Comparativo com Concorrentes**
- **Objetivo:** Eliminar dúvida residual sem defensividade
- **Conteúdo:** Tabela direta Super Agentes vs. mercado. Concorrentes: TutorMundi, Khan Academy, Kumon, MemorizAI. Diferenciais na tabela: construtivismo declarado, Modo PAI nativo, segurança para crianças, cobertura curricular completa, memória por aluno, Prof. Pense-AI (único no mercado).
- **Tom:** Honesto, adulto, sem tom de propaganda.
- **Sentimento de saída:** "Não tem nada igual."

**Ficha 5 — Planos e Valores**
- **Objetivo:** Remover fricção de decisão
- **Conteúdo:**
  - Plano Simples: até 2 gadgets, 25 turnos por sessão/dia
  - Plano Familiar: até 4 gadgets, 35 turnos por sessão/dia
  - Preços: R$49,90 / R$79,90
  - Garantia de devolução do dinheiro em destaque — sinal de confiança, não de insegurança
- **CTA:** Botão principal por plano. Linguagem direta.
- **Sentimento de saída:** "Justo. Vou tentar."

**Arquitetura completa do ambiente PAI — três recursos distintos:**

| Recurso | Natureza | Função |
|---------|---------|--------|
| **Modo PAI** | Ativo — mesmo 9 agentes via botão diferente, modo pedagógico invertido | Ensina o pai a ensinar a matéria ao filho, com analogias personalizadas pelo perfil da criança |
| **Supervisor Educacional** | Observação — agente dedicado ao pai | Informa em tempo real: o que os filhos estão fazendo, principais dificuldades, habilidades e insights para o pai acompanhar o desenvolvimento |
| **Prof. Pense-AI** | Educacional — 9º herói disponível ao pai e alunos do EM | Ensina a promptar e entender IA (matéria = IA, método P.E.N.S.E.AI) |

Ex Modo PAI: CALCULUS não só explica a fração ao pai — ele diz "pra explicar pro Pedro, use analogia de pizza porque sei que ele gosta."
Ex Supervisor Educacional: "Pedro teve 3 sessões esta semana. Maior dificuldade: equações de 2º grau. Ponto forte emergente: geometria. Sugestão: reforçar durante o fim de semana com sessão de 20 minutos."

**Ficha 6 — Overlay Transacional**
- **Objetivo:** Transformar transação em pacto
- **Conteúdo (sequência):**
  1. Pagamento (dados de faturamento, acordos)
  2. Vídeo do Leon — agradecimento pessoal, compromisso público de sempre melhorar, convite "na xinxa" para o questionário
  3. Questionário de Acolhimento Psicopedagógico (18 questões, 2 opcionais) — um perfil por filho
  4. Opção de pular com aviso claro das implicações
  5. "Bem-vindo. Pode começar." + instruções de acesso (filhos: irrestrito; pais: PIN de 4 dígitos)
- **Arquitetura de acesso confirmada:** dois ambientes completamente separados — interface, funcionalidades e dados.
- **Sentimento de saída:** "Eu me comprometi. Isso é sério."

**Ficha 7 — Questionário de Acolhimento Psicopedagógico (detalhe)**
- **Objetivo:** Alimentar o agente oculto PSICOPEDAGOGICO com dados de qualidade para personalização máxima do plano educacional de cada filho
- **Estrutura:** 18 questões obrigatórias + 2 opcionais. Saída: JSON com operador + label por resposta
- **Categorias de questões:** perfil do aluno (série, dificuldades, estilo de aprendizado), contexto familiar (tempo de estudo, presença parental), histórico acadêmico (matérias com dificuldade, relação com escola), objetivos (próxima prova, vestibular, desenvolvimento geral)
- **Filosofia "tudo ou nada":** O site deve preparar o pai para responder com dedicação completa (10 minutos por filho). Respostas superficiais reduzem a qualidade da personalização. Aviso claro antes de iniciar.
- **O que alimenta:** PSICOPEDAGOGICO usa as respostas + memória vetorial do uso da plataforma → plano educacional personalizado + envelope de segurança que governa todos os agentes educacionais
- **Opção de pulo:** disponível, com aviso claro de que o sistema operará em modo padrão (sem personalização profunda) até o formulário ser completado
- **Objetivo:** Transformar transação em pacto
- **Conteúdo (sequência):**
  1. Pagamento (dados de faturamento, acordos)
  2. Vídeo do Leon — agradecimento pessoal, compromisso público de sempre melhorar, convite "na xinxa" para o questionário
  3. Questionário de Acolhimento Psicopedagógico (18 questões, 2 opcionais) — um perfil por filho
  4. Opção de pular com aviso claro das implicações
  5. "Bem-vindo. Pode começar." + instruções de acesso (filhos: irrestrito; pais: PIN de 4 dígitos)
- **Arquitetura de acesso confirmada:** dois ambientes completamente separados — interface, funcionalidades e dados.
- **Sentimento de saída:** "Eu me comprometi. Isso é sério."

#### Seção 4 — Framework de Copy

**O que contém:**

**4.1 Quatro perfis de ansiedade parental e a mensagem central para cada um:**

| Perfil | Medo central | Mensagem que resolve |
|--------|-------------|---------------------|
| **Pai resultado** | "Meu filho não está aprendendo de verdade" | Construtivismo: não entregamos respostas, transferimos habilidade |
| **Pai tela** | "Mais uma tela que vai viciar" | O Super Agentes é a única tela que ensina a pensar, não a consumir |
| **Pai frustrado** | "Já tentei outras plataformas, não funcionou" | Porque nenhuma outra tem Modo PAI. Você não acompanha de fora — você entra junto. |
| **Pai perdido** | "Não sei como ajudar meu filho a estudar" | O Modo PAI ensina você a explicar qualquer matéria pro seu filho — do jeito que ele entende |

**4.2 Tom geral:**
Adulto, direto, sem condescendência. De pai pra pai. Não é um app falando com um consumidor — é uma ferramenta construída por alguém que tem filhos falando com quem também tem. Herdado do DNA Pense-AI: filosofia como linguagem, não jargão de produto.

**4.3 Headlines e CTAs por seção:**
O documento Word produzirá 2 opções de headline testáveis + 1 CTA primário para cada uma das 6 seções da página, com keyword primária integrada. Estrutura obrigatória para cada ficha de seção no documento:
- Headline A (keyword-first, racional)
- Headline B (emoção-first, parental)
- CTA (verbo de ação + benefício imediato, sem "clique aqui")
- Meta Title da página (máx. 60 caracteres, keyword primária no início)
- Meta Description (máx. 160 caracteres, promessa + diferencial + CTA implícito)

#### Seção 5 — SEO On-Page

**O que contém:**

**5.1 Estrutura semântica da página:**
- H1 único (keyword primária + promessa)
- H2 por seção principal (keyword secundária integrada)
- H3 para subpontos dentro de seções

**5.2 Meta title e description:**
Otimizados para intenção de compra + diferencial. Character limits respeitados.

**5.3 Schema Markup recomendado:**
- `Organization` — Pense-AI como entidade
- `Product` — para os dois planos
- `FAQPage` — dúvidas frequentes de pais (segurança, LGPD, funcionalidade)
- `WebPage` + `BreadcrumbList` para hierarquia pense-ai.com → /superagentes

**5.4 Core Web Vitals:**
Recomendações específicas para as animações scroll-driven: lazy loading, skeleton screens, otimização da imagem Hero (LCP crítico), evitar layout shift nas máscaras animadas.

---

### CAMADA 3 — ESTRATÉGIA DE CRESCIMENTO

#### Seção 6 — Estratégia de Keywords

**O que contém:**

> **Nota de execução:** As keywords abaixo são candidatos estratégicos baseados em análise de personas e mercado. Volume de busca mensal e keyword difficulty DEVEM ser validados com dados reais da pasta `investigacao/` + Ahrefs antes de definir priorização final. Keyword sem dado de volume = prioridade sem fundamento.

**6.1 Cluster de alta intenção** (pai pronto para decidir — bottom of funnel):
- "tutoria online com IA ensino médio"
- "plataforma de estudos com IA para adolescente"
- "acompanhamento escolar online com inteligência artificial"
- "reforço escolar online fundamental"

**6.2 Cluster de pesquisa** (pai comparando opções — middle of funnel):
- "melhor plataforma de estudos fundamental II"
- "IA para educação infantil segura"
- "como substituir reforço escolar"
- "plataforma de estudos com modo pais"

**6.3 Long-tail de dor** (pai buscando solução para problema específico — top of funnel, alimenta conteúdo orgânico):
- "filho com dificuldade em matemática como ajudar"
- "filho não quer estudar o que fazer ensino médio"
- "como acompanhar estudos do filho adolescente"
- "IA para ajudar filho a estudar é seguro"
- "construtivismo o que é como funciona"

**6.4 Seeds B2B** (para estruturar `/superagentesescola` no futuro):
- "IA para professores como usar em sala de aula"
- "detecção uso indevido IA alunos escola"
- "plataforma educacional com IA para escolas"
- "gestão escolar com inteligência artificial"

**6.5 Mapa de intent por estágio de funil:**
Tabela completa no documento: keyword → volume mensal BR (validado via Ahrefs/GSC/investigacao/) → dificuldade SEO → intent (informacional/comercial/transacional) → estágio do funil → onde aparece no site ou em qual artigo.

**Nota de execução:** volume e dificuldade de cada keyword DEVEM ser validados com dados reais antes de definir priorização. Keyword sem dado de volume é prioridade sem fundamento. Usar pasta `investigacao/` como fonte primária + complementar com Ahrefs.

#### Seção 7 — Estratégia de Conteúdo Orgânico

**O que contém:**

**7.1 Fase 1 — SEO sem rosto (agora até cases maduros)**
Artigos baseados em dor do público que não exigem credencial pessoal nem cases. Constroem autoridade de domínio em `pense-ai.com` e direcionam tráfego para `/superagentes`.

Temas prioritários (primeiros 6 artigos):
1. "Construtivismo na prática: o que é, por que importa e como a IA pode ajudar"
2. "IA para crianças e adolescentes: o que todo pai precisa saber antes de liberar"
3. "Como escolher uma plataforma de estudos online sem desperdiçar dinheiro"
4. "Filho com dificuldade em matemática: o que realmente funciona (e o que não funciona)"
5. "Modo PAI: o que é e por que nenhuma plataforma de estudos deveria existir sem ele"
6. "Reforço escolar vs. plataforma de estudos: uma comparação honesta de custos e resultados"

**7.2 Fase 2 — Ativação da marca pessoal do Leon**
Condição de ativação: produto no ar + primeiros resultados documentáveis na EGV (Escola da Granja) com alunos do 1º e 2º EM.

**Persona de conteúdo:** "Pai empresário que traz inovação para os filhos e para o negócio." Dual identity — fundador e pai. Não apenas um especialista em IA, mas alguém que viveu o problema de dentro para fora.

**Canais em ordem de ativação:**
1. LinkedIn (audiência B2B + pais de classe média/alta; cases de consultoria + EGV)
2. TikTok (alcance de pais mais jovens; conteúdo curto sobre IA + educação + paternidade)
3. YouTube (conteúdo longo; demos do produto, metodologia P.E.N.S.E.AI, aulas)

**7.3 Regra de ouro da estratégia orgânica:**
Nenhum conteúdo pessoal antes de ter prova. Construir marca sobre promessa é ruído. Construir sobre resultado é autoridade.

**7.4 Critério de Gatilho — Prontidão para ativar Fase 2**

Ativar conteúdo pessoal do Leon APENAS quando TODOS os critérios abaixo forem verdadeiros:

| Critério | Métrica | Meta |
|---------|---------|------|
| EGV — alunos ativos | Nº de alunos com uso contínuo na plataforma | ≥ 15 alunos, ≥ 8 semanas de uso |
| EGV — resultado acadêmico | Evidência de melhoria documentada (notas, engajamento, NPS) | Pelo menos 1 indicador positivo documentado |
| NPS de pais (B2C) | Net Promoter Score dos primeiros assinantes | ≥ 50 |
| Produto estável | Churn no primeiro mês | ≤ 15% |
| SEO Fase 1 rodando | Posição de pelo menos 1 artigo publicado | Top 30 para keyword-alvo |
| Case visual disponível | Material "antes/depois" ou depoimento real | ≥ 1 documentado com permissão |

**Sinais de alerta — NÃO ativar se:**
- Churn > 15% no primeiro mês (o produto não está provado)
- Taxa de conclusão do questionário < 50% (tráfego desqualificado chegando)
- Nenhum artigo Fase 1 publicado (a base SEO ainda não existe)

#### Seção 8 — Fundação B2B (/superagentesescola)

**O que contém:**

**8.1 Arquitetura dos módulos B2B:**

| Módulo | Agentes | Função central |
|--------|---------|---------------|
| **Módulo Aluno + Administrativo** | Super Administrativo (novo) | Módulo B2C adaptado + comunicação pai-escola. Todo banco de dados vinculado ao colégio. |
| **Módulo Professores** | Super Provas, Super Insight, Super Plano, Super IA | Criação de provas + correção; insights de turma; planejamento de aulas; detecção de uso indevido de IA |
| **Módulo Captação** | Agente de Atendimento | Aquecimento de leads de novos alunos via mensagens |

**8.2 O argumento central de venda institucional:**
O **Super IA** (análise de trabalhos de alunos + banco de dados → percentual de uso indevido de IA) é o diferencial absoluto de mercado em 2026. A pergunta que todo diretor e professor está fazendo hoje — "como sei se meu aluno usou IA para fazer esse trabalho?" — tem resposta neste produto. Nenhum concorrente tem.

**8.3 Diferenças de comunicação B2C → B2B:**
- B2C fala com ansiedade parental (emocional)
- B2B fala com responsabilidade institucional (racional + emocional do gestor)
- Ciclo de venda B2B: 3–6 meses, múltiplos decisores (diretor, coordenador pedagógico, TI, financeiro)
- Prova de conceito obrigatória antes de contrato

**8.4 Checklist de prontidão B2B (o que precisa existir antes de ativar):**
- [ ] Painel de gestão por turma (LGPD-compliant)
- [ ] Dados de desempenho agregados anonimizados
- [ ] Time de customer success (mínimo 1 pessoa)
- [ ] Contrato, faturamento e NF para PJ
- [ ] Material institucional (deck, one-pager, proposta padrão)
- [ ] EGV: mínimo 15 alunos com 8+ semanas de uso, NPS de pais ≥ 50, e pelo menos 1 indicador acadêmico positivo documentado com permissão de uso

#### Seção 9 — Métricas e KPIs

**O que contém:**

**9.1 Métricas de tráfego:**
- Visitas orgânicas mensais ao `/superagentes`
- Posição para keywords primárias (meta: top 10 em 6 meses para 3 keywords de alta intenção)
- Taxa de rejeição + tempo médio na página

**9.2 Métricas de conversão:**
- Taxa de trial/assinatura (visita → clique no plano)
- Taxa de pagamento concluído (clique no plano → pagamento)
- Custo por aquisição (quando paid for ativado no futuro)

**9.3 Métricas de ativação:**
- **Taxa de conclusão do Questionário de Acolhimento** — a métrica mais importante do produto, não só do marketing. Alta taxa = pais comprometidos = baixo churn. Meta: >60% de conclusão completa.
- Taxa de "pulo" do questionário (sinal de alerta de qualidade)

**9.4 Métricas de retenção (os primeiros sinais que o produto funciona):**
- Sessões por usuário na primeira semana (meta: >3 sessões)
- Retorno após 30 dias
- NPS nos primeiros 60 dias
- **Taxa de churn mensal** (meta: ≤ 15% no primeiro mês — limiar crítico para validar product-market fit e acionar Fase 2 orgânica)

#### Seção 10 — Roadmap de Execução

**O que contém:**

**Fase 1 — Construção e Lançamento**

*Fase 1.1 — Infraestrutura (Semanas 1–3):*
- [ ] Setup de pagamento (gateway, webhooks, confirmação)
- [ ] Implementação do overlay transacional: pagamento → vídeo → questionário → boas-vindas
- [ ] Gravação do vídeo do Leon (roteiro, produção, edição)
- [ ] Arquitetura de dois ambientes (filhos: irrestrito; pais: PIN 4 dígitos)
- [ ] Integração questionário pós-pagamento com PSICOPEDAGOGICO

*Fase 1.2 — Landing Page (Semanas 4–6):*
- [ ] Design + prototipagem das 6 seções (Hero, Máscaras, Deck, Comparativo, Planos, Overlay)
- [ ] Copy finalizado por seção (headlines A/B, CTAs, descrições)
- [ ] Desenvolvimento front-end com animações scroll-driven
- [ ] Cards dos 9 Heróis com flip interativo

*Fase 1.3 — SEO + Publicação (Semanas 7–8):*
- [ ] SEO on-page completo (H1/H2/H3, meta title, meta description, schema markup)
- [ ] Core Web Vitals otimizados (LCP Hero, lazy loading, sem layout shift nas máscaras)
- [ ] Staging → QA → Produção em `pense-ai.com/superagentes`
- [ ] Google Search Console configurado + sitemap enviado

**Fase 2 — Conteúdo Orgânico (meses 2–3)**
- Publicar os primeiros 4 artigos SEO (sem rosto, baseados em dor do público)
- Monitorar posições e ajustar keywords
- Infiltração em comunidades de pais (WhatsApp, grupos Facebook de pais)

**Fase 3 — Ativação de Marca Pessoal (condicionada a resultados EGV)**
- LinkedIn primeiro (audiência qualificada, ciclo mais longo)
- TikTok segundo (alcance de pais mais jovens, viralização)
- YouTube como arquivo e credencial (longo prazo)

**Fase 4 — /superagentesescola (12–18 meses)**
- Ativar apenas quando checklist de prontidão B2B (Seção 8.4) estiver completo
- Não criar débito técnico nem compromisso público antes do produto estar pronto
- EGV como primeiro case institucional
- Conteúdo SEO B2B (keywords Seção 6.4) é ativado em paralelo com o lançamento de `/superagentesescola` — não antes

---

## Decisões de Design Confirmadas em Sessão

| # | Decisão | Detalhes |
|---|---------|---------|
| 1 | Página única, long-scroll | Não multi-página. Narrativa como timeline até conversão. |
| 2 | URL: `pense-ai.com/superagentes` | Subpath do domínio existente. Herda autoridade. |
| 3 | B2B em `/superagentesescola` | Simples, lógico, arquitetado agora, executado em 12–18 meses. |
| 4 | Organic-only no lançamento | Zero paid. Reinvestimento do que entrar. |
| 5 | Sem presença social no lançamento | Marca pessoal ativada pós-EGV com prova real. |
| 6 | Filosofia "tudo ou nada" no onboarding | Qualidade de resposta ou nenhuma resposta. Pós-pagamento. |
| 7 | Dois ambientes separados | Filhos: acesso irrestrito. Pais: PIN 4 dígitos capturado no onboarding. |
| 8 | Persona de conteúdo Fase 2 | "Pai empresário que traz inovação para os filhos e para o negócio" |

---

*Spec aprovado por Leon Malatesta em 07/04/2026*
*Próximo passo: superpowers:writing-plans → plano de execução do DOCUMENTO_SITE_SEO_SuperAgentes.docx*
