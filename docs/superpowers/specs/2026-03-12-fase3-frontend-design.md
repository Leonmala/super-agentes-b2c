# Spec: Fase 3 — Frontend Super Agentes Educacionais

> **Data:** 2026-03-12
> **Status:** APROVADO (direção conceitual validada pelo Leon)
> **Origem:** Brainstorming visual com mockups V1→V3 + Q&A

---

## 1. Visão Geral

Frontend SPA (Vite + React 18) para o Super Agentes Educacionais. Design moderno inspirado no ChatGPT mobile — light mode, sidebar overlay, header dinâmico com avatar do herói ativo. Três variações de interface conforme perfil do usuário.

## 2. Stack Frontend

| Tecnologia | Uso |
|------------|-----|
| Vite | Build tool + dev server |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| react-router-dom | Routing (SPA) |
| lucide-react | Ícones |
| react-markdown | Renderização de respostas |

## 3. Fluxo de Navegação

```
Login (email+senha)
  → Seletor de Perfil (modal overlay central)
     → Filho: toque no avatar → Chat (MODO FILHO)
     → Pai: toque no avatar → PIN modal (4 dígitos) → Chat (MODO PAI)

Chat ativo:
  → Menu slide (hamburger/swipe) → trocar agente, trocar perfil
  → "Trocar perfil" → volta ao Seletor de Perfil
```

## 4. Telas e Componentes

### 4.1 Login
- Campos: email + senha
- Botão "Entrar"
- Branding: logo Super Agentes Pense-AI
- Fundo claro, card centralizado

### 4.2 Seletor de Perfil (Modal Overlay)
- **NÃO é página inteira** — é modal central com backdrop semi-transparente
- Avatares em círculos com iniciais do nome (V1 — sem design elaborado)
- Cada membro da família listado
- Filhos: toque direto → entra no chat
- Pai: toque → abre PIN modal

### 4.3 PIN Modal (Pai)
- 4 dots visuais (preenchidos conforme digita)
- Teclado numérico na tela
- Botão cancelar → volta ao seletor

### 4.4 Empty State (Chat)
- Logo institucional "Super Agentes Pense-AI" centralizado
- Texto call-to-action: "Olá [nome]! Sobre qual matéria você quer estudar hoje?"
- Chips/sugestões opcionais de matérias (ex: "Matemática", "Português")

### 4.5 Chat Ativo
- **Header dinâmico:**
  - Avatar do herói ativo (imagem real de `imagens/[heroi]-card.png`)
  - Nome do herói + matéria
  - Troca automaticamente quando sistema detecta mudança de professor
  - Badge "MODO PAI" quando aplicável
  - Hamburger menu à esquerda
- **Área de mensagens:**
  - Bolhas: agente à esquerda (fundo branco), usuário à direita (fundo colorido por herói)
  - Streaming SSE com cursor piscante
  - Suporte a markdown (react-markdown)
- **Input bar (estilo ChatGPT):**
  - Botão "+" à esquerda (upload futuro — V1 pode ser placeholder)
  - Campo de texto com placeholder contextual
  - Botão enviar à direita (ícone seta)
  - Auto-resize do campo

### 4.6 Menu Slide (Overlay)
- **Comportamento:** Overlay sobre o chat (NÃO comprime o conteúdo)
- **Ativação:** Hamburger button OU swipe da esquerda
- **Backdrop:** Semi-transparente, clique fora fecha
- **Conteúdo por interface:**

| Interface | Itens do Menu |
|-----------|--------------|
| Filho Fundamental (1º-9º) | Super Agentes, Professor de IA |
| Filho Ensino Médio (1º-3º EM) | Super Agentes, Professor de IA |
| Pai / Responsável | Super Agentes, Supervisor, Professor de IA, Seletor de Filho |

- **Rodapé do menu:** Botão "Trocar Perfil" (fecha sessão → seletor)

## 5. As 3 Interfaces

### 5.1 Filho Fundamental (1º-9º ano)
- Chat limpo, sem distrações
- Menu slide com: Super Agentes + Professor de IA
- Linguagem e UX simplificadas
- Cores: azul principal (#2563EB)

### 5.2 Filho Ensino Médio (1º-3º EM)
- Chat idêntico ao fundamental
- Menu slide com: Super Agentes + Professor de IA
- Linguagem mais madura
- Cores: roxo (#7C3AED)

### 5.3 Pai / Responsável
- Chat com badge "MODO PAI"
- Menu slide completo: Super Agentes + Supervisor + Professor de IA
- Seletor de filho ativo no menu (com avatares dos filhos)
- Cores: verde (#059669)

## 6. Assets de Imagens

Pasta `imagens/` contém 4 variantes por herói:

| Variante | Uso | Arquivo | Formato |
|----------|-----|---------|---------|
| buble | Avatar no header do chat e bolhas de mensagem | `[heroi]_buble.png` | Circular, só rosto |
| card | Ilustração completa do corpo (empty state, transições) | `[heroi]-card.png` | Retangular, corpo inteiro |
| logo | Nome + matéria do personagem | `[heroi]-logo.png` | Texto estilizado |
| limpo | Só o nome do personagem | `[heroi]-limpo.png` | Texto estilizado |

**Heróis disponíveis:** calculus, verbetta, neuron, tempus, gaia, vector, alka, flexy

> **Nota:** neuron não tem arquivo logo (só buble + card + limpo)

**Uso principal no chat:**
- `_buble.png` → header dinâmico + avatar nas bolhas de mensagem do agente
- `-card.png` → empty state, tela de apresentação, loading
- `-logo.png` → menu lateral, créditos, "sobre" (nome + matéria)
- `-limpo.png` → overlay de transição, animação de troca de herói

## 7. Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul | #2563EB | Fundamental, CALCULUS, botões primários |
| Roxo | #7C3AED | Ensino Médio, VERBETTA |
| Verde | #059669 | Pai, confirmações |
| Laranja→Vermelho | #f97316→#ef4444 | Avatar CALCULUS |
| Cyan→Azul | #06b6d4→#2563EB | Avatar VECTOR |
| Fundo | #FFFFFF | Background principal (light mode) |
| Texto | #1e293b | Texto principal |
| Secundário | #64748b | Texto secundário |

## 8. Animações e Transições (V1 mínimo)

- Slide menu: transição suave esquerda→direita (300ms ease)
- Modal: fade-in do backdrop + scale do card
- Troca de herói no header: fade transition
- Bolhas de chat: fade-in ao aparecer
- Cursor streaming: blink animation
- Botões: hover scale + shadow

## 9. Responsividade

- **Mobile-first** (360px mínimo)
- **Tablet:** mesma UX, aproveitamento da largura
- **Desktop:** max-width container, centralizado

## 10. Integração com Backend

- **Auth:** POST `/api/auth/login` → JWT
- **Perfis:** POST `/api/auth/select-profile` → sessão (PIN para pai)
- **Chat:** POST `/api/message` → SSE stream
- **Headers:** `Authorization: Bearer <jwt>`, `Content-Type: application/json`
- **Payload chat:** `{ mensagem, sessao_id, tipo_usuario?, agente_override? }`

## 11. Estado Global (React Context)

```typescript
AuthContext: { token, familia, perfilAtivo, tipoUsuario, login(), selectProfile(), logout() }
ChatContext: { mensagens, heroiAtivo, streaming, enviar(), limpar() }
```

## 12. Rotas (react-router-dom)

```
/login         → LoginPage
/              → ChatPage (protegida, com seletor modal no mount)
```

Mínimo de rotas. Seletor de perfil é modal, não rota separada.

## 13. Decisões de Design Confirmadas pelo Leon

| Decisão | Valor | Sessão |
|---------|-------|--------|
| Tema | Light mode | Brainstorm Q1 |
| Sidebar | Overlay slide, NÃO comprime | Feedback V1 |
| Ativação menu | Hamburger + swipe | Brainstorm Q5 |
| Todas interfaces têm menu | Sim (fundamental também) | Feedback V2 |
| Header | Dinâmico: avatar herói + nome + matéria | Brainstorm Q1 |
| Empty state | Logo + saudação + CTA | Brainstorm Q3 |
| Seletor perfil | Modal overlay central | Feedback V2 |
| PIN pai | Modal 4-dots + teclado numérico | Brainstorm Q4 |
| Trocar perfil | Botão no menu → volta ao seletor | Feedback V2 |
| Input bar | Estilo ChatGPT: +, text, send | Brainstorm Q6 |
| Avatares usuário | Iniciais em círculo (V1) | Brainstorm Q2 |
| Avatares heróis | Imagens reais da pasta imagens/ | Leon adicionou |
| Referência visual | ChatGPT mobile app | Feedback V1 |

---

**Aprovação:** Leon confirmou a direção — "a essência é essa... temos um caminho pra seguir"
