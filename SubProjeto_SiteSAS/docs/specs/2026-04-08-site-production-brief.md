# Site Production Brief — /superagentes
## Super Agentes Pense-AI | Landing Page + Overlay Transacional + Onboarding

> **Para:** Caio Fontana (Web Director)
> **De:** Isabela Monteiro (CMO Fracionária)
> **Data:** 2026-04-08
> **Status:** Aprovado — pode iniciar implementação

---

## 1. VISÃO GERAL

### O que é esta página

A `/superagentes` é a landing page principal do produto Super Agentes Pense-AI — plataforma de tutoria com IA para alunos do ensino fundamental II e médio. A página serve como **produto antes do produto**: se não convencer, o app nunca tem chance.

### Dois usuários, uma decisão

- **Quem paga:** pai/mãe/responsável — motivado por ansiedade (filho não aprende, reforço caro, tempo para acompanhar)
- **Quem usa:** aluno — motivado por engajamento (heróis, não entediar, ganhar autonomia)

Toda a copy e todo o design falam com o **pai**. A experiência do produto retém o aluno.

### URL e integração

```
URL final: www.pense-ai.com/superagentes
Tipo: subpath do site pense-ai.com (NÃO subdomínio)
Build: módulo Vite dentro do site existente
Stack: Vanilla JS + GSAP + Lenis (mesmo do site atual)
Backend: Supabase (auth, questionário, assinantes)
Pagamento: Mercado Pago — PIX obrigatório + cartão de crédito
```

### Referência visual obrigatória

**luffu.com** — mesmo stack, mesma sofisticação. Caio tem carta branca para adaptar código.

---

## 2. ESTRUTURA DA PÁGINA

| # | Seção | Tipo | Observação |
|---|-------|------|------------|
| 0 | Navegação global | Header fixo | Igual ao site pense-ai.com |
| 1 | Hero | Full-screen | Imagem família + tagline + CTAs |
| 2 | Retratos Flutuantes | Scroll-driven | Animação de recomposição em pirâmide |
| 3 | Deck dos 9 Heróis | Interativo | Cards com flip |
| 4 | Comparativo com Concorrentes | Tabela | Prova social racional |
| 5 | Planos e Valores | Conversão | CTA principal de assinatura |
| 6 | Overlay Transacional | Modal fullscreen | Pagamento → Vídeo → Questionário → Boas-vindas |
| — | Footer | Igual ao site | Igual ao pense-ai.com atual |

---

## 3. SEÇÃO 1 — HERO

### Conceito

Família brasileira contemporânea em cena realista de estudo em casa. Não é estúdio, não é perfeito — é real. O pai explicando física com pão e maçã (rotação/translação). A filha pequena no tablet. O adolescente na poltrona com iPhone. O filho do meio no notebook.

A tagline **"É para toda a família"** aparece antes de qualquer outro texto — posicionamento central.

### Copy aprovado

```
TAGLINE PRINCIPAL (display, Magnetik weight 300):
"Super Agentes Pense-AI"

TAGLINE SECUNDÁRIA (display, Magnetik weight 300, menor):
"É para toda a família."

BODY (LazareGrotesk weight 300):
"Tutoria com inteligência artificial que não entrega respostas —
ensina seu filho a encontrá-las. E te ensina a ensinar melhor."

CTA PRIMÁRIO:
"Começar agora — R$49,90/mês"

CTA SECUNDÁRIO:
"Conhecer os heróis ↓"

PROVA SOCIAL (texto menor, LazareGrotesk, --mid-gray):
"Metacogni-ação aplicada. 9 heróis. Segurança certificada. Modo PAI."
```

### Comportamento de animação (GSAP)

```javascript
// Sequência de entrada da página (sem scroll trigger — dispara no load)
const tl = gsap.timeline({ delay: 0.3 });

// 1. Imagem da família: fade + leve scale de 1.03 → 1
tl.from('.hero__image', { opacity: 0, scale: 1.03, duration: 1.2, ease: 'power2.out' });

// 2. Tagline principal: chars reveal do bottom
// usar SplitText plugin do GSAP
tl.from('.hero__title .char', { 
  y: '110%', opacity: 0, duration: 0.8, stagger: 0.02, 
  ease: 'power2.out' 
}, '-=0.6');

// 3. Tagline secundária: fade in
tl.from('.hero__subtitle', { opacity: 0, y: 30, duration: 0.7, ease: 'power2.out' }, '-=0.4');

// 4. Body text: fade in
tl.from('.hero__body', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.3');

// 5. CTAs: slide up com stagger
tl.from('.hero__ctas .btn', { opacity: 0, y: 20, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, '-=0.3');

// Parallax na imagem ao scroll
gsap.to('.hero__image', {
  yPercent: -15,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
});
```

### HTML estrutura

```html
<section class="hero" id="hero">
  <div class="hero__media">
    <img class="hero__image" src="/superagentes/assets/hero-familia.webp" 
         alt="Família estudando com Super Agentes" 
         width="1920" height="1080" fetchpriority="high">
    <!-- NOTA: imagem deve ser preloaded no <head> com link rel=preload -->
  </div>
  <div class="hero__content container">
    <h1 class="hero__title t-magnetik">Super Agentes<br>Pense-AI</h1>
    <p class="hero__subtitle t-magnetik">É para toda a família.</p>
    <p class="hero__body">Tutoria com inteligência artificial que não entrega respostas —<br>
    ensina seu filho a encontrá-las. E te ensina a ensinar melhor.</p>
    <div class="hero__ctas">
      <a href="#planos" class="btn btn--primary">Começar agora — R$49,90/mês</a>
      <a href="#herois" class="btn btn--ghost">Conhecer os heróis</a>
    </div>
    <p class="hero__proof">Metacogni-ação aplicada. 9 heróis. Segurança certificada. Modo PAI.</p>
  </div>
  <!-- Seta animada indicando scroll -->
  <div class="hero__scroll-indicator">
    <svg class="animated-arrow"><!-- arrow SVG --></svg>
  </div>
</section>
```

### Assets necessários

- `hero-familia.webp` — foto editorial família brasileira (não banco de imagens genérico)
  - Specs: 1920×1080px, cenas de estudo em casa, luz natural, cores quentes
  - PENDENTE: Leon providencia fotografia ou arte direção
- Versão mobile: 768×1024px crop centrado no filho principal

---

## 4. SEÇÃO 2 — RETRATOS FLUTUANTES + MAPA DE CALOR

### Conceito

A câmera "recorta" os rostos da família hero em envelopes circulares. Esses círculos flutuam e se reorganizam ao scroll em uma pirâmide: pai/mãe no topo, filhos abaixo. Ao redor de cada círculo, aparecem features conectadas por proximidade (heat map radial).

### Copy aprovado

```
TÍTULO DA SEÇÃO:
"Uma plataforma que conhece cada membro da família"

PAI (círculo superior esquerdo):
Label: "Para o pai"
Feature labels próximas: "Modo PAI" | "Supervisor Educacional" | "Prof. Pense-AI"
Microcopy: "Aprenda a ensinar o que não sabia que sabia."

MÃE (círculo superior direito):
Label: "Para a mãe"
Feature labels próximas: "Acompanhamento em tempo real" | "Relatórios semanais" | "Modo PAI"
Microcopy: "Sabe o que o filho está estudando. Em tempo real."

ADOLESCENTE (círculo médio):
Label: "Para o adolescente (EM)"
Feature labels próximas: "Prof. Pense-AI" | "Letramento em IA" | "P.E.N.S.E.AI"
Microcopy: "Aprende IA antes dos colegas. Com método."

FILHO PEQUENO (círculo inferior):
Label: "Para o fundamental II"
Feature labels próximas: "9 Heróis" | "Segurança de conteúdo" | "Memória personalizada"
Microcopy: "Nunca recebe a resposta. Sempre encontra o caminho."
```

### Comportamento de animação (GSAP)

```javascript
// Phase 1: crop dos rostos da imagem hero
// Os círculos iniciam na posição exata do rosto na foto (clip-path circular)
// e flutuam para a posição destino ao scroll

ScrollTrigger.create({
  trigger: '.portraits-section',
  start: 'top center',
  end: 'bottom center',
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress;
    
    // 0-0.3: círculos emergem da foto (clip-path expand)
    // 0.3-0.6: círculos flutuam e se dispersam
    // 0.6-1.0: círculos se reorganizam em pirâmide
    
    portraits.forEach((p, i) => {
      gsap.set(p, {
        x: gsap.utils.interpolate(p.dataset.originX, p.dataset.targetX, progress),
        y: gsap.utils.interpolate(p.dataset.originY, p.dataset.targetY, progress),
        scale: gsap.utils.interpolate(0.3, 1, progress),
      });
    });
  }
});

// Feature labels: fade in com stagger quando cada círculo chega na posição
// Linhas de conexão: SVG paths animados com stroke-dashoffset
```

### HTML estrutura

```html
<section class="portraits-section" id="familia">
  <div class="portraits-section__title container">
    <h2>Uma plataforma que conhece<br>cada membro da família</h2>
  </div>
  <div class="portraits-section__stage">
    <!-- Canvas SVG para linhas de conexão -->
    <svg class="portraits-connections" aria-hidden="true"></svg>
    
    <!-- Círculo pai -->
    <div class="portrait" data-role="pai" data-origin-x="..." data-target-x="...">
      <div class="portrait__circle">
        <img src="..." alt="Pai">
      </div>
      <div class="portrait__features">
        <span class="feature-tag">Modo PAI</span>
        <span class="feature-tag">Supervisor Educacional</span>
        <span class="feature-tag">Prof. Pense-AI</span>
      </div>
      <p class="portrait__label">Para o pai</p>
      <p class="portrait__micro">Aprenda a ensinar o que não sabia que sabia.</p>
    </div>
    
    <!-- Repetir para mãe, adolescente, filho pequeno -->
  </div>
</section>
```

---

## 5. SEÇÃO 3 — DECK DOS 9 HERÓIS

### Conceito

Cards interativos em grid. Frente: arte do herói (super-heróis estilo Marvel com diversidade e inclusão). Verso: perfil do personagem. Click/hover ativa o flip.

### Copy aprovado — todos os 9 heróis

```
TÍTULO DA SEÇÃO:
"9 heróis. Uma família de especialistas."

SUBTÍTULO:
"Cada matéria tem seu especialista. Todos falam com seu filho — nunca pela ele."
```

#### CALCULUS — Matemática

```
FRENTE:
Nome: CALCULUS
Matéria: Matemática
Tagline curta: "Nunca dá a resposta."

VERSO:
"Calculus foi feito de paciência e rigor. Ele sabe a resposta antes de você perguntar —
mas prefere fazer três perguntas para que você chegue lá sozinho. 
Especialista em frustração produtiva."
Método: Metacogni-ação | Foco: Raciocínio lógico
```

#### VERBETTA — Português

```
FRENTE:
Nome: VERBETTA
Matéria: Português
Tagline curta: "Transforma rascunho em argumento."

VERSO:
"Verbetta acredita que toda ideia mal explicada é uma ideia que não existe ainda.
Ela não corrige — ela questiona. Até que você mesmo encontre o que queria dizer."
Método: Metacogni-ação | Foco: Escrita e interpretação
```

#### NEURON — Ciências

```
FRENTE:
Nome: NEURON
Matéria: Ciências
Tagline curta: "Faz você querer saber mais."

VERSO:
"Neuron transforma qualquer curiosidade em experimento mental. 
Ele nunca para no 'o quê' — vai sempre para o 'por quê' e o 'e daí?'.
Ciências como mindset, não como decoreba."
Método: Metacogni-ação | Foco: Pensamento científico
```

#### TEMPUS — História

```
FRENTE:
Nome: TEMPUS
Matéria: História
Tagline curta: "Conecta o passado com amanhã."

VERSO:
"Tempus sabe que história não é data — é padrão. Ele encontra o fio que 
liga o que aconteceu com o que está acontecendo. E faz você perguntar 
o que vai acontecer."
Método: Metacogni-ação | Foco: Análise de contexto
```

#### GAIA — Geografia

```
FRENTE:
Nome: GAIA
Matéria: Geografia
Tagline curta: "O mundo é o laboratório dela."

VERSO:
"Para Gaia, geografia não existe no papel — existe no que você come, 
no tempo que faz, nas notícias que você lê. Ela transforma abstrato 
em observável."
Método: Metacogni-ação | Foco: Sistemas e conexões
```

#### VECTOR — Física

```
FRENTE:
Nome: VECTOR
Matéria: Física
Tagline curta: "Transforma fórmula em intuição."

VERSO:
"Vector sabe que a fórmula é o último passo — antes dela, existe uma 
ideia que faz sentido. Ele trabalha de trás para frente: primeiro você 
entende, depois você formaliza."
Método: Metacogni-ação | Foco: Intuição física
```

#### ALKA — Química

```
FRENTE:
Nome: ALKA
Matéria: Química
Tagline curta: "Faz abstrato virar real."

VERSO:
"Alka tem paciência para o invisível. Ela pega o que não dá para ver 
e transforma em algo que dá para imaginar. Química como arquitetura 
da matéria."
Método: Metacogni-ação | Foco: Modelagem molecular
```

#### FLEX — Inglês / Espanhol

```
FRENTE:
Nome: FLEX
Matéria: Inglês / Espanhol
Tagline curta: "Não traduz. Ensina."

VERSO:
"Flex não vai traduzir por você — vai ensinar o que a tradução esconde.
Ele trabalha com contexto, tom, e o que uma língua diz que a outra 
não consegue dizer."
Método: Metacogni-ação | Foco: Fluência comunicativa
```

#### PROF. PENSE-AI — Inteligência Artificial

```
FRENTE:
Nome: PROF. PENSE-AI
Matéria: Inteligência Artificial
Tagline curta: "Ensina a usar IA antes que IA use você."

VERSO:
"O único herói cuja matéria não existe no currículo — ainda.
Prof. Pense-AI ensina a metodologia P.E.N.S.E.AI: como pensar junto 
com uma IA, como promtar melhor, e por que o maior diferencial 
competitivo do futuro é saber o que você próprio pensa."
Método: P.E.N.S.E.AI | Público: adolescentes do EM + pais
BADGE ESPECIAL: "Para alunos do EM e pais"
```

### Comportamento de animação (GSAP)

```javascript
// Cards entram em cascata ao scroll
gsap.from('.hero-cards .card', {
  opacity: 0, y: 60, scale: 0.95, duration: 0.7,
  stagger: { each: 0.08, from: 'start' },
  ease: 'power2.out',
  scrollTrigger: { trigger: '.hero-cards', start: 'top 75%' }
});

// Flip no hover/click
card.addEventListener('mouseenter', () => {
  gsap.to(card.querySelector('.card__inner'), {
    rotateY: 180, duration: 0.6, ease: 'power2.inOut'
  });
});

// Prof. Pense-AI tem brilho especial — pulse de borda dourada
gsap.to('.card[data-hero="prof-pense-ai"] .card__border', {
  opacity: 0.6, duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut'
});
```

### HTML estrutura dos cards

```html
<section class="heroes-section" id="herois">
  <div class="container">
    <h2>9 heróis. Uma família de especialistas.</h2>
    <p class="heroes-subtitle">Cada matéria tem seu especialista. Todos falam com seu filho — nunca por ele.</p>
  </div>
  <div class="hero-cards">
    <div class="card" data-hero="calculus">
      <div class="card__inner"> <!-- CSS transform-style: preserve-3d -->
        <div class="card__face card__face--front">
          <img src="/superagentes/assets/heroes/calculus.webp" alt="CALCULUS">
          <h3>CALCULUS</h3>
          <span class="card__subject">Matemática</span>
          <p class="card__tagline">Nunca dá a resposta.</p>
        </div>
        <div class="card__face card__face--back">
          <h3>CALCULUS</h3>
          <p class="card__bio">Calculus foi feito de paciência e rigor...</p>
          <div class="card__meta">
            <span>Método: Metacogni-ação</span>
            <span>Foco: Raciocínio lógico</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Repetir para todos os 9 heróis -->
  </div>
</section>
```

### Assets necessários (9 heróis)

Arte visual de cada herói: estilo super-heróis Marvel, **diversidade mandatória**:
- CALCULUS: homem latino, 40s, olhos expressivos, visual matemático
- VERBETTA: mulher negra, 30s, postura de escritora/professora
- NEURON: homem asiático, jovem, visual científico-nerd
- TEMPUS: homem branco idoso, cabelos brancos, aura de sábio
- GAIA: mulher indígena, 30s, conexão com natureza na arte
- VECTOR: mulher com cadeira de rodas, 25s, visual tecnológico
- ALKA: mulher árabe, 35s, jaleco + expressão questionadora
- FLEX: homem gordo, 20s, multiculturalismo nas cores
- PROF. PENSE-AI: androide/humano híbrido, gênero neutro, visual tech dourado

**PENDENTE:** Leon contrata artista para os 9 heróis (referência: Marvel Ultimate Alliance character design)

---

## 6. SEÇÃO 4 — COMPARATIVO COM CONCORRENTES

### Conceito

Tabela de comparação direta. Tom: confiante, não agressivo. "Nós não existimos apesar deles — existimos para os que querem mais."

### Copy aprovado

```
TÍTULO:
"Por que Super Agentes e não os outros?"
```

### Tabela de comparação

| Feature | Super Agentes | TutorMundi | Khan Academy | Kumon | MemorizAI |
|---------|:---:|:---:|:---:|:---:|:---:|
| Metacogni-ação (nunca entrega resposta) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modo PAI (co-educação parental) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Segurança certificada para menores | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| Cobertura completa Fund. II + EM | ✅ | ✅ | ✅ | ⚠️ | ❌ (só EM) |
| Personalização por perfil do aluno | ✅ | ⚠️ | ❌ | ❌ | ⚠️ |
| Prof. Pense-AI (letramento em IA) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Supervisor Educacional (pais) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Preço/mês | R$49,90 | R$200–400 | Grátis | R$200–400 | ~R$40 |

```
NOTA ABAIXO DA TABELA:
"⚠️ = funcionalidade parcial ou limitada"

FRASE DE ENCERRAMENTO DA SEÇÃO:
"Nenhuma plataforma ensina o pai a ensinar. Nós sim."
```

### Comportamento de animação

```javascript
// Tabela entra linha por linha
gsap.from('.comparison-table tr', {
  opacity: 0, x: -20, duration: 0.4,
  stagger: 0.05, ease: 'power2.out',
  scrollTrigger: { trigger: '.comparison-table', start: 'top 80%' }
});

// Ícones ✅ pulsam suavemente ao entrar
gsap.from('.check-icon', {
  scale: 0, duration: 0.3, stagger: 0.03, ease: 'back.out(2)',
  scrollTrigger: { trigger: '.comparison-table', start: 'top 80%' }
});
```

---

## 7. SEÇÃO 5 — PLANOS E VALORES

### Conceito

Dois planos. Clean, sem ruído. A garantia de devolução deve ser visualmente proeminente — reduz fricção de conversão.

### Copy aprovado

```
TÍTULO:
"Escolha o plano certo para sua família"

SUBTÍTULO:
"Sem contrato. Cancele quando quiser. Garantia de 7 dias."
```

#### Plano Simples

```
NOME: Plano Simples
PREÇO: R$49,90/mês
TAGLINE: "Para uma criança que precisa de apoio"

FEATURES:
✅ Todos os 9 heróis
✅ Até 2 dispositivos
✅ 25 turnos por sessão/dia
✅ Modo PAI incluído
✅ Supervisor Educacional
✅ Memória personalizada
✅ Segurança certificada

CTA: "Começar agora"
```

#### Plano Familiar

```
NOME: Plano Familiar
PREÇO: R$79,90/mês
BADGE: "Mais escolhido"
TAGLINE: "Para famílias com 2 ou mais filhos"

FEATURES:
✅ Todos os 9 heróis
✅ Até 4 dispositivos
✅ 35 turnos por sessão/dia
✅ Modo PAI incluído
✅ Supervisor Educacional
✅ Memória personalizada por filho
✅ Segurança certificada
✅ Prof. Pense-AI para toda a família

CTA: "Começar com a família"
```

#### Garantia

```
BLOCO DE GARANTIA (proeminente, com ícone de escudo):
"Garantia total de 7 dias"
"Se não ficar completamente satisfeito, devolvemos 100% sem perguntas.
Testamos com centenas de famílias — mas a que importa é a sua."
```

### Comportamento de animação

```javascript
// Cards dos planos: slide up + fade
gsap.from('.plan-card', {
  opacity: 0, y: 50, duration: 0.7, stagger: 0.15, ease: 'power2.out',
  scrollTrigger: { trigger: '.plans-section', start: 'top 75%' }
});

// Card "Mais escolhido" tem leve elevação extra
gsap.to('.plan-card--featured', {
  y: -8, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut'
});

// Garantia: fade in ao entrar na viewport
gsap.from('.guarantee-block', {
  opacity: 0, scale: 0.97, duration: 0.8, ease: 'power2.out',
  scrollTrigger: { trigger: '.guarantee-block', start: 'top 85%' }
});
```

---

## 8. SEÇÃO 6 — OVERLAY TRANSACIONAL

### Conceito

Ao clicar em qualquer CTA de plano, abre um overlay fullscreen que conduz o pai por 4 etapas em sequência. É uma experiência, não um formulário.

### Fluxo completo

```
ETAPA 1: Pagamento
  → Formulário de pagamento via Mercado Pago SDK JS
  → Métodos: PIX (principal — conversão maior no Brasil) + cartão de crédito
  → PIX: gera QR code + código copia-e-cola. Timeout: 30 minutos.
  → Cartão: formulário com tokenização via Mercado Pago Secure Fields
  → Campos: nome, email, telefone, dados de pagamento
  → Ao confirmar: transição suave para Etapa 2

ETAPA 2: Vídeo do Leon
  → Vídeo curto (2-3 min) do Leon falando diretamente para o pai
  → Tom: compromisso pessoal, visão de produto, convite ao questionário
  → Script resumo: "Você acabou de fazer a melhor decisão pela educação do seu filho.
     Agora me ajuda a personalizar a experiência. Leva 10 minutos e vale cada segundo."
  → CTA após vídeo: "Quero personalizar a experiência do meu filho"
  → Botão secundário: "Pular para o começo" (vai direto para Etapa 4)

ETAPA 3: Questionário de Acolhimento Psicopedagógico
  → 18 perguntas (16 obrigatórias + 2 opcionais)
  → Interface: uma pergunta por tela, progress bar no topo
  → Salva no Supabase (tabela onboarding_responses)
  → Ao completar: transição para Etapa 4

ETAPA 4: Boas-vindas
  → "Bem-vindo à família Pense-AI."
  → Nome do filho personalizado (usando dado do questionário Q3)
  → "[Nome do filho] está pronto para começar."
  → CTA: "Acessar Super Agentes" → redireciona para o app
```

### Copy — Overlay header

```
HEADER FIXO DO OVERLAY:
Etapa 1: "Finalize sua assinatura"
Etapa 2: "Uma mensagem do fundador"
Etapa 3: "Vamos personalizar a experiência de [nome do filho]"
Etapa 4: "Tudo pronto."
```

### Comportamento de animação do overlay

```javascript
// Abertura do overlay: expand from button
gsap.timeline()
  .set('.overlay', { display: 'flex' })
  .from('.overlay', { 
    clipPath: 'circle(0% at var(--btn-x) var(--btn-y))', 
    duration: 0.7, ease: 'power2.inOut' 
  })
  .from('.overlay__content', { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' }, '-=0.2');

// Transição entre etapas: slide horizontal
function goToStep(from, to) {
  gsap.timeline()
    .to(`.step-${from}`, { x: '-100%', opacity: 0, duration: 0.4, ease: 'power2.in' })
    .from(`.step-${to}`, { x: '100%', opacity: 0, duration: 0.4, ease: 'power2.out' });
}
```

---

## 9. QUESTIONÁRIO DE ACOLHIMENTO PSICOPEDAGÓGICO (18 perguntas)

> **Nota de implementação:** Uma pergunta por tela. Progress bar de 18 passos no topo. Botão "Próxima" desabilitado até resposta obrigatória ser dada. Q17 e Q18 são opcionais (label "opcional" visível). Output: JSON para tabela Supabase `onboarding_responses.answers_json`.

### Perguntas completas com opções e metadados

---

**Q1 — Série do filho** *(única obrigatória)*
```
Pergunta: "Em que série está seu filho?"
Opções:
  a) 6º ano (Fundamental II)
  b) 7º ano (Fundamental II)
  c) 8º ano (Fundamental II)
  d) 9º ano (Fundamental II)
  e) 1º ano (Ensino Médio)
  f) 2º ano (Ensino Médio)
  g) 3º ano (Ensino Médio)
JSON key: "serie"
Nota: Se pai tem múltiplos filhos, esta pergunta aparece para CADA filho (nome do filho dinâmico)
```

**Q2 — Nome do filho** *(texto livre obrigatório)*
```
Pergunta: "Como chamamos seu filho aqui dentro?"
Subtítulo: "Pode ser apelido — o que ele prefere."
Placeholder: "Ex: Pedro, Pê, Pedrinho..."
JSON key: "nome_filho"
```

**Q3 — Relação com os estudos** *(única obrigatória)*
```
Pergunta: "Como é a relação de [nome] com os estudos?"
Opções:
  a) Adora — estuda por conta própria, sem precisar pedir
  b) Razoável — faz o que precisa, sem reclamar muito
  c) Oscilante — tem dias bons e dias ruins
  d) Resistente — precisa ser constantemente motivado
  e) Difícil — conflito frequente sobre estudos em casa
JSON key: "relacao_estudos"
```

**Q4 — Matérias mais difíceis** *(múltipla obrigatória — até 3)*
```
Pergunta: "Quais matérias são mais difíceis para [nome]?"
Subtítulo: "Pode selecionar até 3."
Opções: Matemática | Português | Ciências | História | Geografia | Física | Química | Inglês | Espanhol | Nenhuma — vai bem em tudo
JSON key: "materias_dificeis" (array)
```

**Q5 — Matérias favoritas** *(múltipla obrigatória — até 3)*
```
Pergunta: "Quais matérias [nome] tem mais facilidade ou interesse?"
Subtítulo: "Pode selecionar até 3."
Opções: (mesmas de Q4)
JSON key: "materias_faceis" (array)
```

**Q6 — Como estuda** *(única obrigatória)*
```
Pergunta: "Como [nome] costuma estudar quando está sozinho?"
Opções:
  a) Lê o material e faz anotações
  b) Resolve exercícios direto
  c) Assiste vídeos (YouTube, etc.)
  d) Pede ajuda quando trava (pai, mãe, colega)
  e) Não costuma estudar por conta própria
JSON key: "estilo_estudo"
```

**Q7 — Tempo dedicado** *(única obrigatória)*
```
Pergunta: "Quanto tempo por dia [nome] dedica aos estudos (fora a escola)?"
Opções:
  a) Menos de 30 minutos
  b) 30 minutos a 1 hora
  c) 1 a 2 horas
  d) Mais de 2 horas
  e) Varia muito — não consigo estimar
JSON key: "tempo_estudo"
```

**Q8 — Reação ao desafio** *(única obrigatória)*
```
Pergunta: "Quando [nome] encontra um exercício difícil, qual é a reação mais comum?"
Opções:
  a) Persiste até resolver
  b) Tenta um pouco, depois pede ajuda
  c) Pede ajuda imediatamente
  d) Desiste e vai fazer outra coisa
  e) Fica frustrado e pode gerar conflito
JSON key: "reacao_desafio"
```

**Q9 — Uso de dispositivos durante estudo** *(sim/não obrigatório)*
```
Pergunta: "[nome] usa celular ou redes sociais enquanto estuda?"
Opções:
  a) Raramente — consegue se concentrar
  b) Às vezes — é difícil controlar
  c) Com frequência — é um ponto de conflito
  d) Sempre — é praticamente impossível separar
JSON key: "distratibilidade_digital"
```

**Q10 — Atenção e foco** *(única obrigatória)*
```
Pergunta: "Como você descreveria o foco e a atenção de [nome]?"
Opções:
  a) Excelente — concentra por longos períodos
  b) Bom — com algum esforço se concentra
  c) Regular — precisa de pausas frequentes
  d) Difícil — perde o fio facilmente
  e) Muito difícil — suspeito de alguma dificuldade de atenção
JSON key: "atencao"
```

**Q11 — Estilo de aprendizagem** *(única obrigatória)*
```
Pergunta: "[nome] aprende melhor de que forma?"
Opções:
  a) Lendo e escrevendo — aprende pelo texto
  b) Vendo — aprende por imagens, diagramas, exemplos visuais
  c) Ouvindo — aprende quando alguém explica em voz alta
  d) Fazendo — aprende praticando, errando e tentando de novo
  e) Discutindo — aprende quando pode debater e questionar
JSON key: "estilo_aprendizagem"
```

**Q12 — Perfil social na escola** *(única obrigatória)*
```
Pergunta: "Como é [nome] na escola com outros alunos?"
Opções:
  a) Muito sociável — tem muitos amigos, vive em grupo
  b) Tem um grupo de amigos próximos, prefere assim
  c) Mais reservado — tem poucos amigos, prefere assim
  d) Tem dificuldades de relacionamento na escola
JSON key: "perfil_social"
```

**Q13 — Atividades extracurriculares** *(múltipla — até 3)*
```
Pergunta: "[nome] faz alguma atividade além da escola?"
Subtítulo: "Pode selecionar até 3."
Opções: Esporte | Arte / Música | Idiomas | Programação / robótica | Reforço escolar | Teatro / dança | Nenhuma
JSON key: "atividades_extra" (array)
```

**Q14 — O que você mais valoriza em quem ensina** *(única obrigatória)*
```
Pergunta: "Para [nome], o que faz um professor ou tutor ser bom?"
Opções:
  a) Explica com clareza e paciência
  b) Faz perguntas que estimulam o raciocínio
  c) Usa exemplos do dia a dia, contextualizados
  d) É exigente e mantém o aluno responsável
  e) Cria confiança e não julga o erro
JSON key: "perfil_professor_ideal"
```

**Q15 — Principal preocupação acadêmica** *(única obrigatória)*
```
Pergunta: "O que mais te preocupa na vida escolar de [nome] hoje?"
Opções:
  a) Notas baixas em uma ou mais matérias
  b) Falta de base — lacunas acumuladas ao longo dos anos
  c) Motivação — ele não vê sentido nos estudos
  d) Preparação para o ENEM / vestibular (alunos do EM)
  e) Acompanhamento — não consigo acompanhar o que ele está aprendendo
  f) Dependência — ele não consegue estudar sem minha ajuda direta
JSON key: "preocupacao_principal"
```

**Q16 — Disponibilidade parental** *(única obrigatória)*
```
Pergunta: "Quanto tempo por semana você consegue dedicar a acompanhar os estudos de [nome]?"
Opções:
  a) Menos de 1 hora
  b) 1 a 3 horas
  c) 3 a 5 horas
  d) Mais de 5 horas
  e) Tenho pouco controle — é muito variável
JSON key: "disponibilidade_parental"
```

**Q17 — Contexto adicional** *(texto livre OPCIONAL)*
```
Pergunta: "Tem algo sobre [nome] que a gente precisa saber?"
Subtítulo: "Dificuldades de aprendizado, neurodivergências, situações especiais — compartilhe o que achar importante."
Placeholder: "Pode ser qualquer coisa que ajude a personalizar a experiência..."
Label: "opcional"
JSON key: "contexto_adicional"
```

**Q18 — O que faz brilhar os olhos** *(texto livre OPCIONAL)*
```
Pergunta: "O que faz [nome] brilhar os olhos?"
Subtítulo: "Não precisa ser sobre estudos. Qualquer paixão, interesse, sonho."
Placeholder: "Ex: Ama futebol, sonha em ser astronauta, não larga Minecraft..."
Label: "opcional"
JSON key: "brilha_os_olhos"
Nota UX: Esta é a última pergunta. Tom deve ser leve, quase íntimo.
Nota estratégica: Este dado é o de maior valor qualitativo para personalização pelo PSICOPEDAGOGICO.
```

---

## 10. INTEGRAÇÃO SUPABASE

### Schema de banco de dados

```sql
-- Tabela de assinantes
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  nome_completo TEXT,
  plano TEXT CHECK (plano IN ('simples', 'familiar')),
  status TEXT DEFAULT 'pending_questionnaire' 
    CHECK (status IN ('pending_questionnaire', 'onboarding_complete', 'active', 'cancelled')),
  gateway_customer_id TEXT, -- ID do customer no Mercado Pago
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de filhos
CREATE TABLE IF NOT EXISTS filhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  serie TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de respostas do questionário
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  filho_id UUID REFERENCES filhos(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL, -- estrutura das 18 respostas
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  psicopedagogico_processed BOOLEAN DEFAULT FALSE, -- flag para o agente processar
  processed_at TIMESTAMPTZ
);

-- RLS: apenas o próprio usuário autenticado pode ler seus dados
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE filhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Policies: criar após Auth setup com Leon
```

### Variáveis de ambiente (Vite / Vercel)

```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_MERCADOPAGO_PUBLIC_KEY=[pk_live_...]   # fornecido por Leon após criar conta MP
VITE_MERCADOPAGO_ACCESS_TOKEN=[access_token]  # backend only, nunca expor no client
```

### Fluxo de dados — pagamento → questionário

```
1. Usuário clica "Começar agora" →
2. Overlay abre (Etapa 1: Payment) →
3. Dados do formulário: { email, nome, telefone } →
4. POST para Supabase Edge Function: /create-subscriber →
   - Cria registro em subscribers (status: pending_questionnaire)
   - Inicia checkout no gateway de pagamento
5. Pagamento confirmado →
6. Webhook do gateway → Edge Function: /confirm-payment →
   - Atualiza status do subscriber
   - Retorna token de sessão para o frontend
7. Frontend avança para Etapa 2 (Vídeo Leon) →
8. Etapa 3 (Questionário) →
   - A cada pergunta: auto-save parcial em answers_json (evitar perda de dados)
   - Ao completar Q18: POST para /submit-questionnaire →
     - Insere em onboarding_responses
     - Cria registros em filhos
     - Sinaliza psicopedagogico_processed = false (para o app processar)
9. Etapa 4 (Boas-vindas) → redirect para app
```

---

## 11. WEBHOOKS N8N

```
Trigger 1: novo_assinante
  - Quando: subscriber criado + pagamento confirmado
  - Ação: email de boas-vindas, adicionar ao CRM

Trigger 2: questionario_completo
  - Quando: onboarding_responses inserido
  - Ação: notificar app para processar PSICOPEDAGOGICO, email de confirmação

Trigger 3: d30_referral
  - Quando: 30 dias após subscriber.created_at, status = active
  - Ação: disparar email com vídeo do Leon → pedido de indicação
  
Nota: URLs dos webhooks n8n a fornecer por Oscar após configuração
```

---

## 12. SEO ON-PAGE

```html
<!-- <head> da página /superagentes -->
<title>Super Agentes Pense-AI — Tutoria com IA para o Ensino Fundamental e Médio</title>
<meta name="description" content="Plataforma de tutoria com IA que nunca entrega a resposta — ensina seu filho a pensar. 9 heróis especializados. Modo PAI. Segurança certificada para menores. Experimente 7 dias grátis.">
<meta property="og:title" content="Super Agentes Pense-AI">
<meta property="og:description" content="A única plataforma de tutoria com IA que ensina o pai a ensinar melhor o próprio filho.">
<meta property="og:image" content="https://www.pense-ai.com/superagentes/og-image.jpg">
<meta property="og:url" content="https://www.pense-ai.com/superagentes">
<link rel="canonical" href="https://www.pense-ai.com/superagentes">

<!-- Preload hero image -->
<link rel="preload" as="image" href="/superagentes/assets/hero-familia.webp" fetchpriority="high">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Super Agentes Pense-AI",
  "applicationCategory": "EducationApplication",
  "offers": [
    { "@type": "Offer", "price": "49.90", "priceCurrency": "BRL", "name": "Plano Simples" },
    { "@type": "Offer", "price": "79.90", "priceCurrency": "BRL", "name": "Plano Familiar" }
  ],
  "description": "Tutoria com IA usando metacogni-ação — nunca entrega respostas, transfere habilidade de pensar.",
  "operatingSystem": "Web, iOS, Android"
}
</script>
```

---

## 13. PERFORMANCE

| Métrica | Target | Como atingir |
|---------|--------|-------------|
| LCP | <2.5s | Preload hero image, WebP, fetchpriority="high" |
| CLS | <0.1 | Explicit width/height em todos os img/video |
| INP | <100ms | Event handlers não-blocking, requestAnimationFrame |
| Bundle JS | <150KB gzip | Vanilla JS, zero framework, GSAP modular |
| CSS | <50KB gzip | CSS custom properties, zero framework |

---

## 14. RESPONSIVIDADE

| Breakpoint | Comportamento |
|-----------|--------------|
| Mobile (320–767px) | Layout vertical. Hero: full-screen, text sobre imagem com overlay. Cards de heróis: carrossel horizontal. Comparativo: scroll horizontal. Planos: stack vertical. |
| Tablet (768–1023px) | Hero: imagem + conteúdo lado a lado. Cards: 3 colunas. Comparativo: tabela completa. |
| Desktop (1024px+) | Layout completo conforme descrito acima. |
| Desktop largo (1366px+) | Container max-width: 1366px centrado. |

---

## 15. ITENS QUE LEON RESOLVE EM PARALELO (NÃO são bloqueios para Caio)

> **Regra:** nenhum destes itens impede Caio de construir. Leon resolve em paralelo enquanto Caio avança com mock/placeholder. Quando Leon entregar, Caio substitui os mocks pelos reais.

| Item | Responsável | Como Caio avança sem ele |
|------|-------------|--------------------------|
| Supabase project + credenciais | Leon | Caio implementa toda a UI do questionário com dados em memória (localStorage mock). Integração real vem depois. |
| Credenciais Mercado Pago | Leon | Caio implementa toda a UI de pagamento (PIX + cartão) com mock. SDK MP importado mas não instanciado. |
| API contract web→app | Leon + Lucas | Caio implementa redirect para `/app` como placeholder. Contrato define a URL e parâmetros depois. |
| Fotografia hero family | Leon | Caio usa imagem placeholder de alta qualidade (unsplash editorial). Substitui quando arte chegar. |
| Arte dos 9 heróis | Leon | Caio usa avatares placeholder com cores de cada herói. Layout completo. Substitui quando arte chegar. |
| Vídeo do Leon | Leon | Caio implementa o player do vídeo completo. Placeholder com thumbnail. Substitui URL quando vídeo existir. |
| URLs webhooks n8n | Oscar | Caio deixa as chamadas comentadas no código com `// TODO: substituir URL`. |

---

## 16. O QUE CAIO COMEÇA IMEDIATAMENTE (sem esperar nada)

Tudo abaixo pode — e deve — ser iniciado hoje:

1. **Estrutura HTML** das 6 seções completas
2. **Sistema CSS** — variáveis, grid, tipografia (pense-ai:design-dna)
3. **Animações GSAP** — todas independentes de backend
4. **Cards dos 9 heróis** — flip behavior + copy aprovado + placeholders visuais
5. **Tabela comparativa** — dados estáticos já estão no brief
6. **Seção de planos** com copy aprovado
7. **Overlay transacional** — estrutura + transições (sem payment SDK)
8. **Questionário** — toda a UI/UX (18 perguntas) sem integração Supabase
9. **SEO on-page** — tags, schema, preloads
10. **Core Web Vitals baseline** — auditoria do site atual

---

*Spec produzido por Isabela Monteiro | 2026-04-08*
*Status: aprovado — aguarda apenas Caio + dependências de Leon*
