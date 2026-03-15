# Visual Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved visual design (prototype V5) to the existing React frontend without changing any backend, API, state management, or navigation logic.

**Architecture:** Pure CSS/visual layer refactor. Modify 12 frontend files (components, pages, constants, CSS). Add Google Fonts, copy hero background images, update color palette. All component props and behavior stay identical.

**Tech Stack:** React 19 + Tailwind 4 + Plus Jakarta Sans + Vite

**Prototype reference:** `prototipo-visual-refactor.html` (approved)
**Design spec:** `docs/superpowers/specs/2026-03-14-visual-refactor-design.md`
**Backup:** `backups/design-pre-refactor-2026-03-14/` (57 files)

---

## File Structure

### Files to Create
- None (all files exist)

### Files to Modify
| File | Change | Priority |
|------|--------|----------|
| `web/index.html` | Add Google Fonts link | P0 |
| `web/src/index.css` | Font-family, CSS vars, cleanup | P0 |
| `web/src/types.ts` | Add gradientFrom/gradientTo/accent/bgImage to HeroMeta | P0 |
| `web/src/constants.ts` | New hero palette + new fields | P0 |
| `web/src/pages/LoginPage.tsx` | Full gradient + glassmorphism + organic blobs | P1 |
| `web/src/components/ProfileModal.tsx` | Glassmorphism over gradient | P1 |
| `web/src/components/PinModal.tsx` | Glassmorphism numpad + Pense-AI signature | P1 |
| `web/src/components/ChatHeader.tsx` | Sheet-over-header pattern with bg-chat images | P1 |
| `web/src/components/ChatBubble.tsx` | Organic bubbles, hero face avatars, harmony | P1 |
| `web/src/components/ChatInput.tsx` | Floating pill + attach button | P1 |
| `web/src/components/EmptyState.tsx` | Hero showcase + subject pills | P1 |
| `web/src/components/SlideMenu.tsx` | Glassmorphism + gradient + Pense-AI sig | P1 |
| `web/src/pages/ChatPage.tsx` | bg-base, sheet structure wrapping | P1 |

### Files to Delete
| File | Reason |
|------|--------|
| `web/src/App.css` | Legacy Vite template, not used |

### Assets to Copy
```
imagens/bg-chat-calculus.png → web/public/heroes/bg-calculus.png
imagens/bg-chat-verbetta.png → web/public/heroes/bg-verbetta.png
imagens/bg-chat-neuron.png   → web/public/heroes/bg-neuron.png
imagens/bg-chat-tempus.png   → web/public/heroes/bg-tempus.png
imagens/bg-chat-gaia.png     → web/public/heroes/bg-gaia.png
imagens/bg-chat-vector.png   → web/public/heroes/bg-vector.png
imagens/bg-chat-alka.png     → web/public/heroes/bg-alka.png
imagens/bg-chat-flexy.png    → web/public/heroes/bg-flexy.png
imagens/Logo_SuperAgentesPenseAI.png → web/public/logo-penseai.png
```

### Files NOT to touch
- `web/src/contexts/*` — state management
- `web/src/api/*` — API client
- `web/src/hooks/*` — typing effect logic
- `web/src/components/ChatMessages.tsx` — scroll wrapper (inherits bg from parent)
- `web/src/components/ProtectedRoute.tsx` — auth guard
- `web/src/components/StreamingCursor.tsx` — keeps current behavior
- `server/*` — backend inteiro

---

## Chunk 1: Foundation (types, constants, CSS, assets)

### Task 1: Copy hero background images and logo

**Files:**
- Copy: 8 bg-chat images + 1 logo to `web/public/heroes/`

- [ ] **Step 1: Copy images**

```bash
cp imagens/bg-chat-calculus.png web/public/heroes/bg-calculus.png
cp imagens/bg-chat-verbetta.png web/public/heroes/bg-verbetta.png
cp imagens/bg-chat-neuron.png web/public/heroes/bg-neuron.png
cp imagens/bg-chat-tempus.png web/public/heroes/bg-tempus.png
cp imagens/bg-chat-gaia.png web/public/heroes/bg-gaia.png
cp imagens/bg-chat-vector.png web/public/heroes/bg-vector.png
cp imagens/bg-chat-alka.png web/public/heroes/bg-alka.png
cp imagens/bg-chat-flexy.png web/public/heroes/bg-flexy.png
cp imagens/Logo_SuperAgentesPenseAI.png web/public/logo-penseai.png
```

- [ ] **Step 2: Verify copies**

```bash
ls -la web/public/heroes/bg-*.png web/public/logo-penseai.png
```
Expected: 9 files exist

- [ ] **Step 3: Commit**

```bash
git add web/public/heroes/bg-*.png web/public/logo-penseai.png
git commit -m "feat: add hero background images and Pense-AI logo for visual refactor"
```

---

### Task 2: Add Google Fonts to index.html

**Files:**
- Modify: `web/index.html`

- [ ] **Step 1: Add Plus Jakarta Sans link**

In `web/index.html`, add inside `<head>` before the closing `</head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Commit**

```bash
git add web/index.html
git commit -m "feat: add Plus Jakarta Sans font from Google Fonts"
```

---

### Task 3: Update HeroMeta type

**Files:**
- Modify: `web/src/types.ts`

- [ ] **Step 1: Add new fields to HeroMeta**

Replace the HeroMeta interface:

```typescript
export interface HeroMeta {
  id: HeroId
  nome: string
  materia: string
  cor: string
  gradientFrom: string    // hero gradient light
  gradientTo: string      // hero gradient dark
  accent: string          // accent color for UI elements
  bgImage: string         // path to bg-chat image
  avatar: string
  card: string
  logo: string | null
  limpo: string
}
```

Note: Remove `corGradient` (was dead code, Tailwind class strings never used dynamically).

- [ ] **Step 2: Commit**

```bash
git add web/src/types.ts
git commit -m "feat: extend HeroMeta with gradient, accent and bgImage fields"
```

---

### Task 4: Update constants.ts with new hero palette

**Files:**
- Modify: `web/src/constants.ts`

- [ ] **Step 1: Update all 8 heroes with new colors**

Replace entire HEROES object. New palette extracted from official bg-chat images (approved by Leon):

```typescript
export const HEROES: Record<HeroId, HeroMeta> = {
  CALCULUS: {
    id: 'CALCULUS', nome: 'Calculus', materia: 'Matematica',
    cor: '#1E3F6B', gradientFrom: '#1E3F6B', gradientTo: '#0A1628', accent: '#3B6BA8',
    bgImage: '/heroes/bg-calculus.png',
    avatar: '/heroes/calculus_buble.png', card: '/heroes/calculus-card.png',
    logo: '/heroes/calculus-logo.png', limpo: '/heroes/calculus-limpo.png',
  },
  VERBETTA: {
    id: 'VERBETTA', nome: 'Verbetta', materia: 'Portugues',
    cor: '#5C2D90', gradientFrom: '#5C2D90', gradientTo: '#1E0B38', accent: '#8B5CF6',
    bgImage: '/heroes/bg-verbetta.png',
    avatar: '/heroes/verbetta_buble.png', card: '/heroes/verbetta-card.png',
    logo: '/heroes/verbetta-logo.png', limpo: '/heroes/verbetta-limpo.png',
  },
  NEURON: {
    id: 'NEURON', nome: 'Neuron', materia: 'Ciencias / Biologia',
    cor: '#1E8A7A', gradientFrom: '#1E8A7A', gradientTo: '#0C3830', accent: '#34D399',
    bgImage: '/heroes/bg-neuron.png',
    avatar: '/heroes/neuron_buble.png', card: '/heroes/neuron-card.png',
    logo: '/heroes/neuron-logo.png', limpo: '/heroes/neuron-limpo.png',
  },
  TEMPUS: {
    id: 'TEMPUS', nome: 'Tempus', materia: 'Historia',
    cor: '#C88520', gradientFrom: '#C88520', gradientTo: '#5A3808', accent: '#FBBF24',
    bgImage: '/heroes/bg-tempus.png',
    avatar: '/heroes/tempus_buble.png', card: '/heroes/tempus-card.png',
    logo: '/heroes/tempus-logo.png', limpo: '/heroes/tempus-limpo.png',
  },
  GAIA: {
    id: 'GAIA', nome: 'Gaia', materia: 'Geografia',
    cor: '#2E8E2E', gradientFrom: '#2E8E2E', gradientTo: '#123812', accent: '#4ADE80',
    bgImage: '/heroes/bg-gaia.png',
    avatar: '/heroes/gaia_buble.png', card: '/heroes/gaia-card.png',
    logo: '/heroes/gaia-logo.png', limpo: '/heroes/gaia-limpo.png',
  },
  VECTOR: {
    id: 'VECTOR', nome: 'Vector', materia: 'Fisica',
    cor: '#9A7018', gradientFrom: '#9A7018', gradientTo: '#3A2808', accent: '#D4A030',
    bgImage: '/heroes/bg-vector.png',
    avatar: '/heroes/vector_buble.png', card: '/heroes/vector-card.png',
    logo: '/heroes/vector-logo.png', limpo: '/heroes/vector-limpo.png',
  },
  ALKA: {
    id: 'ALKA', nome: 'Alka', materia: 'Quimica',
    cor: '#4A2480', gradientFrom: '#4A2480', gradientTo: '#160838', accent: '#A855F7',
    bgImage: '/heroes/bg-alka.png',
    avatar: '/heroes/alka_buble.png', card: '/heroes/alka-card.png',
    logo: '/heroes/alka-logo.png', limpo: '/heroes/alka-limpo.png',
  },
  FLEX: {
    id: 'FLEX', nome: 'Flexy', materia: 'Ingles e Espanhol',
    cor: '#C02828', gradientFrom: '#C02828', gradientTo: '#4A0E0E', accent: '#F87171',
    bgImage: '/heroes/bg-flexy.png',
    avatar: '/heroes/flexy_buble.png', card: '/heroes/flexy-card.png',
    logo: '/heroes/flexy-logo.png', limpo: '/heroes/flexy-limpo.png',
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors (or only pre-existing ones unrelated to our changes)

- [ ] **Step 3: Commit**

```bash
git add web/src/constants.ts
git commit -m "feat: update hero palette with official gradients and accent colors"
```

---

### Task 5: Update index.css + delete App.css

**Files:**
- Modify: `web/src/index.css`
- Delete: `web/src/App.css`
- Modify: `web/src/App.tsx` (remove App.css import if present)

- [ ] **Step 1: Update index.css**

Add at top (after Tailwind import):

```css
/* ===== Design System Tokens ===== */
:root {
  --bg-base: #F5F7FB;
  --bg-surface: #FFFFFF;
  --text-primary: #1A1D26;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
  --radius-sm: 12px;
  --radius-pill: 50px;
  --shadow-soft: 0 2px 20px rgba(0,0,0,0.05);
  --shadow-card: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-float: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Keep existing @keyframes (blink, slideIn, slideOut, fadeIn) and `.chat-bubble-content`.

- [ ] **Step 2: Delete App.css and remove import**

```bash
rm web/src/App.css
```

In `web/src/App.tsx`, remove `import './App.css'` if present.

- [ ] **Step 3: Verify build**

```bash
cd web && npm run build 2>&1 | tail -5
```
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add web/src/index.css web/src/App.tsx
git rm web/src/App.css
git commit -m "feat: add design system tokens, Plus Jakarta Sans, remove legacy App.css"
```

---

## Chunk 2: Auth Screens (Login, ProfileModal, PinModal)

### Task 6: Refactor LoginPage.tsx

**Files:**
- Modify: `web/src/pages/LoginPage.tsx`

**Design:** Full gradient background + organic blobs + glassmorphism card + Pense-AI logo below "Super Agentes" title. Pill-shaped submit button. Refer to prototype Screen 1.

- [ ] **Step 1: Rewrite LoginPage visual layer**

Replace Tailwind classes to match prototype:
- Outer wrapper: full-screen gradient `bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#172554]`
- Add 3 organic blob divs (absolute positioned, `rounded-full`, `blur-3xl`, `opacity-40`)
- Card: `bg-white/12 backdrop-blur-[40px] border border-white/[0.18] rounded-[28px]`
- Inputs: `bg-white/8 border-[1.5px] border-white/12 rounded-[16px] text-white placeholder:text-white/28`
- Submit button: `bg-white text-blue-700 rounded-full font-bold` (pill shape)
- Brand section above card: "Super Agentes" h1 + `<img src="/logo-penseai.png">` with `opacity-60 brightness-0 invert h-7`
- Footer: "Ainda nao tem conta? Cadastre-se" link
- Error alert styling preserved but updated to match glass aesthetic

Keep ALL state logic, form handlers, error handling, navigation EXACTLY as-is.

- [ ] **Step 2: Visual verify in dev**

```bash
cd web && npm run dev
```
Open `http://localhost:5173/login` — verify gradient, blobs, glass card, font renders.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/LoginPage.tsx
git commit -m "feat: redesign LoginPage with gradient, glassmorphism and organic blobs"
```

---

### Task 7: Refactor ProfileModal.tsx

**Files:**
- Modify: `web/src/components/ProfileModal.tsx`

**Design:** Same gradient as login. Profile cards with glassmorphism. Pense-AI signature bottom-right. Refer to prototype Screen 2.

- [ ] **Step 1: Rewrite ProfileModal visual layer**

- Full gradient background (same as login)
- Organic blob
- Title: "Quem vai estudar?" + subtitle
- Profile cards: `bg-white/12 backdrop-blur-[30px] border border-white/16 rounded-[22px]` with hover elevation
- Avatar circles: gradient backgrounds (filho color → lighter variant)
- Separator: line with "Responsavel" label centered
- Parent card: lock SVG icon in blue gradient circle
- Arrow indicator on each card
- Pense-AI signature: `position: absolute; bottom: 20px; right: 20px; opacity: 0.35`

Keep ALL selection logic, click handlers, state EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/ProfileModal.tsx
git commit -m "feat: redesign ProfileModal with glassmorphism over gradient"
```

---

### Task 8: Refactor PinModal.tsx

**Files:**
- Modify: `web/src/components/PinModal.tsx`

**Design:** Same gradient bg. Lock avatar. PIN dots. Glassmorphism numpad 3x4. "Esqueci meu PIN" link. Pense-AI signature. Refer to prototype Screen PIN.

- [ ] **Step 1: Rewrite PinModal visual layer**

- Gradient background matching login/profile
- Pin avatar: 72px circle with lock SVG, gradient blue
- "Ola, {nome}" + "Digite seu PIN de 4 digitos"
- 4 PIN dots: `w-4 h-4 rounded-full border-2 border-white/30` → filled: `bg-white border-white shadow-glow`
- Numpad grid: `grid-cols-3 gap-3.5`, keys: `bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px] text-white text-2xl font-bold`
- Key hover: `bg-white/18 scale-[1.04]`, active: `bg-white/25 scale-[0.97]`
- Last row: empty, 0, backspace (SVG icon)
- "Esqueci meu PIN" link at bottom
- Pense-AI signature bottom-right
- Success flash: dots turn green briefly

Keep ALL PIN logic, validation, error handling, submit EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/PinModal.tsx
git commit -m "feat: redesign PinModal with glassmorphism numpad"
```

---

## Chunk 3: Chat Core (Header, Bubbles, Input, ChatPage)

### Task 9: Refactor ChatPage.tsx (sheet structure)

**Files:**
- Modify: `web/src/pages/ChatPage.tsx`

**Design:** The chat body is now a "sheet" that overlaps the header. ChatPage needs to set up the sheet-over-header structure.

- [ ] **Step 1: Update ChatPage layout**

- Outer container: `bg-[var(--bg-base)]` (was likely white or default)
- The ChatHeader now lives inside a "header background area" div
- Below it, a "chat-sheet" div with `rounded-t-[28px] -mt-6 relative z-10 bg-[var(--bg-base)]` that overlaps the header
- Inside the sheet: ChatMessages + ChatInput
- Alert banners stay in place but get updated styling to match organic design

Keep ALL state management, streaming logic, alert logic, menu toggle EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/ChatPage.tsx
git commit -m "feat: add sheet-over-header layout structure to ChatPage"
```

---

### Task 10: Refactor ChatHeader.tsx

**Files:**
- Modify: `web/src/components/ChatHeader.tsx`

**Design:** Header is now a background area (not the "bar" itself). Hero gradient + bg-chat image overlay at 25% opacity + vignette. Content (avatar, name, menu button) over it. Refer to prototype Screen Chat header.

- [ ] **Step 1: Rewrite ChatHeader visual layer**

Structure:
```
<div className="relative overflow-hidden"> {/* header bg area */}
  <div style={gradient} className="absolute inset-0" />  {/* hero gradient */}
  <div style={bgImage} className="absolute inset-0 opacity-25 bg-cover" />  {/* bg-chat */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/10" />  {/* vignette */}
  <div className="relative z-10 flex items-center gap-3.5 px-5 pt-4 pb-10"> {/* toolbar */}
    <button className="w-10 h-10 bg-white/15 backdrop-blur border border-white/12 rounded-[12px]">menu</button>
    <img src={hero.avatar} className="w-[46px] h-[46px] rounded-[16px] border-2 border-white/25 object-cover" />
    <div>
      <div className="text-white font-bold text-base">{hero.nome}</div>
      <div className="text-white/70 text-xs">{hero.materia}</div>
    </div>
    {modoPai && <badge>}
  </div>
</div>
```

Hero data from `HEROES[heroiAtivo]` — uses new `gradientFrom`, `gradientTo`, `bgImage` fields.
Text has `text-shadow` for readability over images.
The extra `pb-10` gives space for the sheet overlap.

Keep ALL state reading, menu toggle handler, MODO PAI logic EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/ChatHeader.tsx
git commit -m "feat: redesign ChatHeader with hero bg-image and sheet-overlap pattern"
```

---

### Task 11: Refactor ChatBubble.tsx

**Files:**
- Modify: `web/src/components/ChatBubble.tsx`

**Design:** Organic bubbles. Agent: soft hero-accent gradient bg, asymmetric radius (22px 22px 22px 6px), hero face avatar. User: hero gradient, white text, asymmetric radius (22px 6px 22px 22px). Harmony between both. Refer to prototype Screen Chat.

- [ ] **Step 1: Rewrite ChatBubble visual layer**

Agent bubble:
- `background: linear-gradient(135deg, ${accent}0F, ${accent}1A)` (6% to 10% opacity of accent)
- `border-radius: 22px 22px 22px 6px` (origin corner bottom-left)
- `box-shadow: var(--shadow-soft)`
- No border-left accent line (removed per prototype feedback)
- Avatar: `<img src={hero.avatar}>` in 32px circle, hero accent bg at 10%

User bubble:
- `background: linear-gradient(135deg, ${hero.gradientFrom}, lighten)` — hero gradient
- `border-radius: 22px 6px 22px 22px` (origin corner top-right)
- `color: white`
- `box-shadow: 0 4px 16px rgba(0,0,0,0.1)`

Continuation bubbles (sub-messages):
- Same as agent bubble but `margin-left: 42px`, `border-radius: 16px 22px 22px 16px`
- No avatar

Keep ALL sentence splitting, markdown rendering, streaming cursor, typing effect EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/ChatBubble.tsx
git commit -m "feat: redesign ChatBubble with organic shapes and hero face avatars"
```

---

### Task 12: Refactor ChatInput.tsx

**Files:**
- Modify: `web/src/components/ChatInput.tsx`

**Design:** Floating pill input. Circle + button on left for image attach. Circle send button on right with hero gradient. No border-top line, just shadow. Refer to prototype input area.

- [ ] **Step 1: Rewrite ChatInput visual layer**

Structure:
```
<div className="px-3.5 py-2 pb-3.5"> {/* padding wrapper */}
  <div className="flex items-end gap-2 bg-white rounded-[50px] p-1.5 pl-1.5 shadow-[var(--shadow-float)] border-[1.5px] border-black/4">
    <button className="w-10 h-10 rounded-full bg-[var(--bg-base)] text-gray-400 hover:bg-accent/10 hover:text-accent flex items-center justify-center flex-shrink-0">
      <Plus size={18} />  {/* from lucide-react */}
    </button>
    <textarea ... className="flex-1 py-3 bg-transparent border-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none" />
    <button style={{background: gradient}} className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-md hover:scale-105 transition-transform">
      <Send size={18} />
    </button>
  </div>
</div>
```

The send button uses hero gradient (`linear-gradient(135deg, gradientFrom, gradientTo)`).
Focus-within on pill: border color changes to accent/20, extra ring shadow.

Keep ALL send logic, textarea auto-height, Enter/Shift+Enter handling, disabled states EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/ChatInput.tsx
git commit -m "feat: redesign ChatInput as floating pill with attach button"
```

---

## Chunk 4: Supporting Screens (EmptyState, SlideMenu)

### Task 13: Refactor EmptyState.tsx

**Files:**
- Modify: `web/src/components/EmptyState.tsx`

**Design:** Hero showcase. Big hero face avatar with glow. "Oi, {nome}!" greeting. Description. Subject pills (8 matérias as clickable pills). Refer to prototype Screen Empty State.

- [ ] **Step 1: Rewrite EmptyState visual layer**

- Centered flex column
- Subtle radial accent glow behind avatar (`::before` pseudo or div)
- Big avatar: 88px, `rounded-[26px]`, hero face image, hero accent bg at low opacity, shadow
- Greeting: 24px, weight 800, `text-[var(--text-primary)]`
- Description: 14.5px, `text-[var(--text-secondary)]`, max-w-[280px]
- Subject pills: flex-wrap, each pill `px-4 py-2 rounded-full bg-white text-[var(--text-secondary)] text-xs font-semibold shadow-soft border border-black/4`
- Pill hover: bg changes to accent/10, text to accent, border to accent/20, slight translateY

Texts adapt to `agenteMenu` and `tipoUsuario` as before.

Keep ALL text logic, contextual messages, tipoUsuario branching EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/EmptyState.tsx
git commit -m "feat: redesign EmptyState with hero showcase and subject pills"
```

---

### Task 14: Refactor SlideMenu.tsx

**Files:**
- Modify: `web/src/components/SlideMenu.tsx`

**Design:** Panel with hero gradient + organic blobs. Glass nav items. User card. Pense-AI signature below "Sair" button. Refer to prototype Screen Menu.

- [ ] **Step 1: Rewrite SlideMenu visual layer**

Panel:
- Background: profile gradient (pai blue or hero gradient if child)
- Organic blobs (2 absolute divs, `rounded-full blur-[50px] opacity-25`)
- Width: `w-72` (unchanged)

Content:
- Header: "Super Agentes" brand + close X button (glass style)
- User card: `bg-white/10 backdrop-blur-[16px] border border-white/12 rounded-[22px]`, avatar circle, name + role
- Section label: "Navegacao", 10px, uppercase, white/30
- Nav items: `bg-white/6 border border-white/6 rounded-[16px]`, icon in glass square, text white/70
- Active item: `bg-white/15 border-white/15 text-white font-semibold shadow`
- Bottom: "Trocar perfil" + "Sair" buttons, then Pense-AI logo (`height: 16px, opacity: 0.3, brightness-0 invert, text-align right, margin-top 12px`)

Overlay behind: `bg-black/35 backdrop-blur-[4px]`

Keep ALL menu items logic, agente selection, filho switching, logout, animation EXACTLY as-is.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/SlideMenu.tsx
git commit -m "feat: redesign SlideMenu with glassmorphism and gradient"
```

---

## Chunk 5: Verification & Cleanup

### Task 15: TypeScript check

- [ ] **Step 1: Run TypeScript compiler**

```bash
cd web && npx tsc --noEmit 2>&1 | head -30
```
Expected: No new errors

- [ ] **Step 2: Fix any type errors**

If errors exist, fix them (likely `corGradient` references that need to be removed from any remaining code).

---

### Task 16: Build verification

- [ ] **Step 1: Run production build**

```bash
cd web && npm run build 2>&1 | tail -10
```
Expected: Build succeeds with no errors

---

### Task 17: Visual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd web && npm run dev
```

- [ ] **Step 2: Verify each screen**

Checklist:
- Login: gradient + blobs + glass card + Pense-AI logo ✓
- Profile selector: glass cards + gradient + Pense-AI signature ✓
- PIN: numpad + dots + glass keys + Pense-AI signature ✓
- Chat: header with bg-image + sheet overlap + organic bubbles ✓
- Chat: hero face in header avatar + bubble avatars ✓
- Chat: floating pill input with + button ✓
- Empty state: hero face + greeting + subject pills ✓
- Menu: gradient + glass items + Pense-AI signature ✓
- Switch all 8 heroes: each has unique gradient + bg-image ✓
- MODO PAI: badge visible, menu has all options ✓
- Plus Jakarta Sans: verify in browser DevTools ✓

---

### Task 18: Final commit

- [ ] **Step 1: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete visual refactor — organic design with hero identities

- Plus Jakarta Sans typography
- Hero gradients extracted from official bg-chat images
- Sheet-over-header pattern with bg-chat backgrounds
- Organic chat bubbles with hero face avatars
- Floating pill input with attach button
- Glassmorphism auth screens (login, profile, PIN)
- Pense-AI signature on auth screens and menu
- Subject pills on empty state
- Consistent glass + gradient language throughout"
```
