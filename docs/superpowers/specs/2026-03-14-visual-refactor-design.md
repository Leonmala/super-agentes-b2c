# Visual Refactor — Super Agentes Educacionais V1

**Data:** 2026-03-14
**Status:** Aprovado pelo Leon
**Backup:** `backups/design-pre-refactor-2026-03-14/` (57 arquivos)

---

## 1. Contexto

A app funciona. Backend sólido, 8 heróis operacionais, SSE streaming, MODO PAI/FILHO, deploy Railway. Feedback externo: "parece feito por IA". O objetivo é refazer a camada visual sem tocar em usabilidade ou backend.

### Restrições absolutas

- Nenhuma mudança em: rotas, endpoints, lógica SSE, roteamento de personas, persistência, auth
- Nenhuma mudança em: fluxo de navegação, estrutura de telas, hierarquia de componentes
- Nenhuma mudança em: sentence-per-bubble, typing effect, EmptyState dinâmico por agente
- Todos os componentes mantêm a mesma interface (props) e comportamento

---

## 2. Direção Estética

**Hybrid — Clean base + Hero moments.** Interface base limpa e madura (não infantil), com "momentos visuais" marcantes por herói — gradientes profundos, backgrounds temáticos, identidade cromática única.

**Referência principal:** Ref 3 (app de task management com gradiente purple profundo, glassmorphism, tipografia bold).

**Público-alvo dual:** Pais que pagam (precisam ver seriedade) + filhos 7-17 anos (precisam ver modernidade). O design resolve ambos: clean = credibilidade, hero moments = engajamento.

---

## 3. Tipografia

**Família:** Plus Jakarta Sans (Google Fonts, gratuita)

| Uso | Peso | Tamanho |
|-----|------|---------|
| Display (nomes heróis, títulos) | 800 (ExtraBold) | text-xl / text-2xl |
| Subtítulos, labels | 600 (SemiBold) | text-sm / text-base |
| Corpo (chat, inputs, descrições) | 400 (Regular) | text-sm |
| Micro (badges, timestamps) | 500 (Medium) | text-xs |

**Import:** Via `<link>` no index.html ou `@import` no index.css.

**Import:** Via `<link>` no index.html (melhor performance que @import):
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**Fallback stack:** `font-family: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', sans-serif;`

**Anti-pattern a evitar:** Inter, Roboto, Arial, Space Grotesk, system fonts genéricos.

---

## 4. Paleta de Cores — Extraída dos Backgrounds Oficiais

Cada herói tem um gradiente de 2 tons (centro claro → borda escura) extraído diretamente do bg-chat oficial da marca.

### 4.1 Gradientes dos Heróis

| Herói | Matéria | Gradiente (claro → escuro) | Accent (balões, UI) |
|-------|---------|---------------------------|---------------------|
| CALCULUS | Matemática | `#1E3F6B` → `#0A1628` | `#3B6BA8` |
| VERBETTA | Português | `#5C2D90` → `#1E0B38` | `#8B5CF6` |
| NEURON | Ciências | `#1E8A7A` → `#0C3830` | `#34D399` |
| TEMPUS | História | `#C88520` → `#5A3808` | `#FBBF24` |
| GAIA | Geografia | `#2E8E2E` → `#123812` | `#4ADE80` |
| VECTOR | Física | `#9A7018` → `#3A2808` | `#D4A030` |
| ALKA | Química | `#4A2480` → `#160838` | `#A855F7` |
| FLEXY | Idiomas | `#C02828` → `#4A0E0E` | `#F87171` |

### 4.2 Gradientes Institucionais

| Contexto | Gradiente | Uso |
|----------|-----------|-----|
| Perfil Pai | `#2563EB` → `#1E40AF` | Header/menu quando pai está logado |
| Login / Institucional | `#2563EB` → `#1E3A8A` | Tela de login, ProfileModal |
| Filhos | Derivado da FILHO_COLORS existente | Gradiente por índice do filho |

### 4.3 Base UI

| Token | Valor | Uso |
|-------|-------|-----|
| bg-base | `#F8FAFC` (slate-50) | Fundo da área de chat |
| bg-card | `#FFFFFF` | Balões de mensagem, cards |
| text-primary | `#0F172A` (slate-900) | Texto principal |
| text-secondary | `#64748B` (slate-500) | Texto secundário, placeholders |
| text-muted | `#94A3B8` (slate-400) | Timestamps, labels menores |
| border-subtle | `#E2E8F0` (slate-200) | Bordas de inputs, divisores |

---

## 5. Componentes — Especificação Visual

### 5.1 ChatHeader (o "Hero Moment")

O header é o componente de maior impacto visual. É onde a identidade do herói vive.

**Estrutura:**
- Fundo: gradiente CSS do herói (`linear-gradient(135deg, corClara, corEscura)`)
- Background temático: imagem bg-chat do herói como `background-image` com `opacity: 0.15-0.20`, `background-size: cover`
- Avatar do herói: `w-14 h-14`, `rounded-2xl`, `border-2 border-white/30`, sombra sutil
- Nome do herói: Plus Jakarta Sans 600, `text-white`, `text-base`
- Matéria: Plus Jakarta Sans 400, `text-white/70`, `text-xs`
- Botão menu: `bg-white/10`, `backdrop-blur-sm`, `rounded-xl`, `hover:bg-white/20`
- Badge MODO PAI: `bg-white/15`, `backdrop-blur-sm`, `rounded-full`, `text-xs`
- **Fallback se bg-image não carregar:** Gradiente puro (sem imagem) — visual degrada graciosamente
- Padding: `px-4 py-3`

### 5.2 ChatBubble — Cards com Accent Line

**Balão do agente:**
- Fundo: `bg-white`
- Borda esquerda: `3px solid ${heroAccentColor}` (accent da tabela 4.1)
- Border-radius: `rounded-2xl` com `rounded-tl-sm` (canto cortado)
- Sombra: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]` (quase imperceptível)
- Texto: `text-slate-800`, `text-sm`, Plus Jakarta Sans 400
- Padding: `px-4 py-3`
- Sem borda nos outros lados (ou `border border-slate-100` quase invisível)

**Balão do user:**
- Fundo: cor sólida do perfil (cor do filho ou cor do pai)
- Texto: `text-white`
- Border-radius: `rounded-2xl` com `rounded-tr-sm`
- Sem accent line

**Sentence-per-bubble:** Mantém a lógica atual (splitSentences). Sub-balões do agente herdam o accent line. Espaçamento `mt-1` entre sub-balões.

### 5.3 SlideMenu — Gradiente + Glassmorphism

**Painel:**
- Fundo: gradiente do perfil ativo (mesma lógica do header)
- Width: `w-72` (mantém)
- Sombra: `shadow-2xl`

**Items de menu:**
- Background: `bg-white/10`
- `backdrop-blur-md`
- `rounded-xl`
- Texto: `text-white`, Plus Jakarta Sans 500
- Ícone: `text-white/70`
- Hover: `bg-white/15`
- **Ativo:** `bg-white/20` + borda esquerda `3px solid white` (decidido: borda, não glow — mais consistente com accent line dos balões)

**Info do perfil (topo):**
- Card: `bg-white/10`, `backdrop-blur-sm`, `rounded-xl`
- Nome: Plus Jakarta Sans 600, `text-white`
- Tipo: Plus Jakarta Sans 400, `text-white/60`

**Seletor de filho (pai only):**
- Card: `bg-white/10`, `backdrop-blur-sm`, `rounded-xl`
- Cada filho: hover `bg-white/10`, avatar com cor do filho, dot indicador ativo

### 5.4 LoginPage — Full Gradient + Glassmorphism

**Fundo:** Gradiente institucional full-screen (`linear-gradient(135deg, #2563EB, #1E3A8A)`)

**Card de login:**
- `bg-white/12`
- `backdrop-blur-xl`
- `border border-white/20`
- `rounded-3xl`
- `shadow-2xl`
- Padding: `p-8`

**Logo:** Acima do card, `h-20`, filtro brightness para funcionar em fundo colorido

**Inputs:**
- `bg-white/10`
- `border border-white/15`
- `rounded-xl`
- Texto: `text-white`
- Placeholder: `text-white/40`
- Focus: `ring-2 ring-white/30`

**Botão submit:**
- `bg-white`
- `text-blue-700` (a cor primária)
- `rounded-xl`
- `font-semibold`
- Hover: `bg-white/90`

**Erro:** `bg-red-500/20`, `border border-red-400/30`, `text-red-200`, `rounded-xl`

### 5.5 ProfileModal — Glassmorphism sobre Gradiente

**Backdrop:** `bg-black/50` com `backdrop-blur-sm`

**Modal:**
- `bg-white/12`
- `backdrop-blur-xl`
- `border border-white/20`
- `rounded-3xl`
- `shadow-2xl`

**Cards de perfil (filhos):**
- `bg-white/10`
- `hover:bg-white/15`
- `rounded-xl`
- `border border-white/10`
- Avatar: círculo com cor do filho, iniciais em branco
- Nome: `text-white`, Plus Jakarta Sans 600
- Série: `text-white/60`

**Card de pai:**
- Mesmo estilo, ícone de escudo/cadeado

### 5.6 PinModal — Glassmorphism

Mesma linguagem do ProfileModal:
- Card central em `bg-white/12` + `backdrop-blur-xl`
- PIN indicators: `bg-white/20` (vazio) → `bg-white` (preenchido)
- Numpad: `bg-white/10`, `hover:bg-white/15`, `rounded-xl`, `text-white`

### 5.7 EmptyState — Hero Showcase

- Fundo: herda o `bg-base` (slate-50)
- Avatar do herói: `w-20 h-20`, `rounded-2xl`, sombra sutil
- Nome: Plus Jakarta Sans 800, `text-slate-900`, `text-xl`
- Subtítulo: Plus Jakarta Sans 400, `text-slate-500`, `text-sm`, `max-w-xs`
- CTA: Plus Jakarta Sans 400, `text-slate-400`, `text-xs`, italic

### 5.8 ChatInput

- Container: `bg-white`, `border-t border-slate-200`, `px-4 py-3`
- Input area: `bg-slate-100`, `rounded-2xl`, `px-4 py-2.5`
- Botão enviar: gradiente do herói ativo (claro → escuro), `rounded-xl`, `text-white`
- Hover: opacidade 90%

---

## 6. Assets Necessários

### 6.1 Backgrounds temáticos (já existem)

Os 8 arquivos bg-chat-*.png da pasta `Imagens/` precisam ser copiados para `web/public/heroes/`:

```
bg-chat-calculus.png → web/public/heroes/bg-calculus.png
bg-chat-verbetta.png → web/public/heroes/bg-verbetta.png
bg-chat-neuron.png   → web/public/heroes/bg-neuron.png
bg-chat-tempus.png   → web/public/heroes/bg-tempus.png
bg-chat-gaia.png     → web/public/heroes/bg-gaia.png
bg-chat-vector.png   → web/public/heroes/bg-vector.png
bg-chat-alka.png     → web/public/heroes/bg-alka.png
bg-chat-flexy.png    → web/public/heroes/bg-flexy.png
```

### 6.2 Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## 7. Mudanças em constants.ts

O objeto HEROES precisa de novos campos:

```typescript
interface HeroMeta {
  // ... campos existentes ...
  gradientFrom: string    // cor clara do gradiente
  gradientTo: string      // cor escura do gradiente
  accent: string          // cor de accent (balões, UI)
  bgImage: string         // path do background temático
}
```

Remover: `corGradient` (dead code que nunca foi usado).

---

## 8. Mudanças em CSS (index.css)

- Adicionar `font-family: 'Plus Jakarta Sans', sans-serif` ao body
- Remover/limpar App.css (legacy Vite template, não usado)
- Atualizar `.chat-bubble-content` para usar cores do sistema de tokens (slate-200 para bordas, etc.)

---

## 9. Arquivos a Modificar

| Arquivo | Tipo de Mudança | Impacto |
|---------|----------------|---------|
| `web/index.html` | Adicionar Google Fonts link | Mínimo |
| `web/src/index.css` | Font-family, limpeza, tokens | Médio |
| `web/src/App.css` | Deletar (legacy) | Mínimo |
| `web/src/constants.ts` | Adicionar gradients/accent/bgImage ao HEROES | Médio |
| `web/src/components/ChatHeader.tsx` | Gradiente + bg temático + nova tipografia | Alto |
| `web/src/components/ChatBubble.tsx` | Accent line + sombras + nova tipografia | Alto |
| `web/src/components/ChatInput.tsx` | Botão gradiente + refinamento | Médio |
| `web/src/components/SlideMenu.tsx` | Glassmorphism + gradiente | Alto |
| `web/src/components/EmptyState.tsx` | Hero showcase + tipografia | Médio |
| `web/src/components/PinModal.tsx` | Glassmorphism | Médio |
| `web/src/components/ProfileModal.tsx` | Glassmorphism + gradiente | Alto |
| `web/src/pages/LoginPage.tsx` | Full gradient + glass card | Alto |
| `web/src/pages/ChatPage.tsx` | bg-base slate-50 | Mínimo |

**NÃO modificar:**
- `web/src/contexts/*` (nenhuma mudança de estado)
- `web/src/api/*` (nenhuma mudança de API)
- `web/src/hooks/*` (nenhuma mudança de lógica)
- `server/*` (nenhuma mudança de backend)

---

## 10. Componentes Sem Mudança Visual

Listados explicitamente para evitar ambiguidade:

| Componente | Motivo |
|------------|--------|
| `ChatMessages.tsx` | Wrapper de scroll, sem estilo próprio além de bg-base |
| `ProtectedRoute.tsx` | Lógica pura de roteamento, sem visual |
| `StreamingCursor.tsx` | Mantém lógica atual (cor dinâmica do herói via accent) |
| `web/src/contexts/*` | Estado puro, sem visual |
| `web/src/api/*` | Comunicação, sem visual |
| `web/src/hooks/*` | Lógica, sem visual |
| `server/*` | Backend inteiro, intocado |

---

## 11. Notas de Performance

- **Glassmorphism mobile:** `backdrop-blur-xl` pode ser pesado em Android budget. Se performance <30fps, degradar para `backdrop-blur-md` ou remover blur e usar opacidade sólida.
- **Images bg-chat:** Os 8 PNGs são ~200-400KB cada. Usar `loading="lazy"` não se aplica (são background-image CSS). Se lento, converter para WebP ou reduzir resolução.
- **Opacity rationale:** Header buttons usam `/30` (mais visíveis sobre gradiente escuro). Form inputs usam `/10-15` (sutis, não competem com texto). Menu items usam `/10` (neutros, ativo sobe para `/20`).

---

## 12. Critérios de Sucesso

1. Todos os 8 heróis exibem gradiente + background temático único no header
2. Login/ProfileModal/PinModal usam glassmorphism sobre gradiente
3. Balões de chat com accent line na cor do herói (agente) e cor sólida (user)
4. Plus Jakarta Sans carregada e aplicada globalmente
5. SlideMenu com glassmorphism sobre gradiente do perfil
6. Build passa sem erros (`npm run build`)
7. App funciona identicamente em mobile (teste visual)
8. Nenhuma regressão funcional (auth, chat, SSE, persistência)
9. O resultado NÃO parece "feito por IA" — tem personalidade, coerência cromática, tipografia intencional

---

## 13. Nota sobre Paleta de Cores

As cores da seção 4.1 foram extraídas visualmente dos backgrounds oficiais (bg-chat-*.png na pasta Imagens/) e aprovadas pelo Leon. Elas SUBSTITUEM as cores atuais em `constants.ts`, que eram genéricas e tinham duplicatas (CALCULUS=VECTOR, VERBETTA=FLEX). A nova paleta é a fonte de verdade.
