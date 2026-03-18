# Design Spec — PE1: Botão "+" com Visão Multimodal

**Data:** 2026-03-18
**Status:** Aprovado por Leon
**Checklist ref:** PE1
**Abordagem escolhida:** A — Base64 em JSON

---

## Contexto

O `ChatInput.tsx` já renderiza o botão "+" (ícone `Plus` do lucide-react) sem nenhuma ação associada. O objetivo deste spec é torná-lo funcional: ao clicar, abre seletor de arquivo/câmera; a imagem selecionada aparece no balão do usuário com animação de "Analisando..." enquanto o herói pensa; e o herói recebe a imagem via LLM multimodal (visão).

Stack relevante: Vite 6 + React 19 + Tailwind 4 · TypeScript strict · Express backend · Gemini (dev) e Kimi K2.5 (prod), ambos com suporte a visão via API OpenAI-compatible.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Transporte da imagem | Base64 em JSON | Zero novos endpoints, zero storage, stateless |
| Compressão | Canvas API, max 1024px, JPEG 80% | Payload ~150-300KB aceitável; protege contra fotos de 5MB |
| Limite de alerta | 500KB após compressão | Previne timeout em 3G fraco |
| PSICO vê a imagem? | Não | Recebe `"[foto anexada] " + texto`; economiza 2-4s na cascata |
| Herói vê a imagem? | Sim | Content array multimodal completo |
| Persistência da imagem | Não (só em estado React) | V1 sem storage; imageUrl não vai ao Supabase |
| Múltiplas imagens | Não (V1) | YAGNI |

---

## Fluxo Completo

```
Clique "+"
  → <input type="file" accept="image/*"> (oculto)
  → Mobile: câmera ou rolo (browser gerencia via `accept`)
  → Web: file picker padrão

Arquivo selecionado
  → Canvas API: redimensiona para max 1024px, JPEG q=0.8
  → Se resultado > 500KB → aviso toast "Imagem muito grande, tente outra"
  → Thumbnail preview aparece acima do textarea no ChatInput
  → Botão X para remover a imagem pendente

Usuário envia (texto + imagem OU só imagem)
  → ChatContext.enviar(texto, agenteOverride?, imagemBase64?)
  → Mensagem do usuário criada com imageUrl = data URL (para exibição)
  → sendMessage() inclui imagem_base64 no body JSON

Backend recebe
  → message.ts extrai imagem_base64
  → Cascata PSICO: recebe texto puro "[foto anexada] " + mensagem
  → Herói: recebe content array multimodal [image_url, text]

LLM responde
  → SSE stream normal, sem diferença no protocolo
  → Animação "Analisando..." cessa quando primeiro chunk chega

Balão do usuário exibe
  → Thumbnail da imagem (max 240px largura, border-radius)
  → Texto abaixo (se houver)
  → Enquanto streaming=true: shimmer overlay + badge pulsante "CALCULUS está analisando sua imagem..."
  → Quando streaming=false: fade-out da animação
```

---

## Arquivos Modificados

### Frontend

#### `web/src/types.ts`
Adicionar campo opcional em `ChatMessage`:
```ts
imageUrl?: string   // data URL local para exibição (não persistido)
```

#### `web/src/components/ChatInput.tsx`
- `<input type="file" accept="image/*" hidden ref={fileInputRef}>` linkado ao botão "+"
- Estado local: `imagemPendente: { base64: string; preview: string } | null`
- Ao selecionar arquivo: comprimir via `comprimirImagem()` (Canvas utility), setar estado
- Preview: thumbnail 64px acima do textarea, com botão X (remover)
- `handleSubmit`: passa `imagemPendente?.base64` para `enviar()`
- Limpar `imagemPendente` após envio

#### `web/src/utils/image-compress.ts` *(arquivo novo)*
```ts
export async function comprimirImagem(
  file: File,
  maxPx = 1024,
  qualidade = 0.8
): Promise<{ base64: string; dataUrl: string; tamanhoKB: number }>
```
- Cria `<canvas>` invisível, desenha imagem redimensionada, exporta como `image/jpeg`
- Retorna base64 limpo (sem prefixo `data:...`) + dataUrl completo para preview
- Utilitário puro, sem side effects, fácil de testar

#### `web/src/api/chat.ts`
- `SendMessageOptions` ganha `imagemBase64?: string`
- Body JSON inclui `imagem_base64` quando presente (campo omitido quando undefined)

#### `web/src/contexts/ChatContext.tsx`
- `enviar(texto, agenteOverride?, imagemBase64?)` — assinatura expandida
- Mensagem do usuário criada com `imageUrl: imagemBase64 ? 'data:image/jpeg;base64,' + imagemBase64 : undefined`
- `sendMessage()` recebe `imagemBase64`

#### `web/src/components/ChatBubble.tsx`
- No balão `role='user'`: se `message.imageUrl` presente, renderizar antes do texto:
  ```
  <img src={imageUrl} className="rounded-xl max-w-[240px] mb-2 block" />
  ```
- Animação de análise: componente `ImageAnalysisOverlay` (inline no ChatBubble):
  - Visível quando `isAnalysing = message.imageUrl && streaming`
  - Shimmer CSS sobre o thumbnail (gradiente animado em loop)
  - Badge no canto inferior esquerdo: dot pulsante + `"${nomeHeroi} está analisando..."`
  - Fade-out quando `streaming` passa para false (transition opacity 300ms)

### Backend

#### `server/src/routes/message.ts`
- Extrair `imagem_base64?: string` do body (validar: se presente, deve ser string não vazia)
- Na cascata PSICO: `mensagem` = `imagem_base64 ? "[foto anexada] " + mensagemOriginal : mensagemOriginal`
- Na chamada do herói: passar `imagemBase64` para `chamarLLMStream()`

#### `server/src/core/llm.ts`
- `chamarLLMStream(persona, mensagem, contexto, opts)` — `opts` ganha `imagemBase64?: string`
- Quando `imagemBase64` presente, `content` do turno do usuário vira array:
  ```json
  [
    { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64>" } },
    { "type": "text", "text": "<mensagem>" }
  ]
  ```
- Quando ausente, `content` permanece string simples (sem regressão)
- Mesma lógica se aplica a `chamarLLM()` (chamada PSICO — mas PSICO não recebe imagem, então na prática esta branch não é ativada para PSICO)

---

## Animação "Charminho" — CSS

```css
/* Shimmer sobre o thumbnail */
@keyframes imageShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

.image-analysing-overlay {
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%
  );
  background-size: 200% 100%;
  animation: imageShimmer 1.6s ease-in-out infinite;
}

/* Badge pulsante */
@keyframes badgePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.95); }
}

.image-badge {
  animation: badgePulse 1.2s ease-in-out infinite;
}
```

Fade-out ao fim do streaming via classe condicional `opacity-0 transition-opacity duration-300`.

---

## Tratamento de Erros

| Erro | Comportamento |
|---|---|
| Arquivo não é imagem | `accept="image/*"` filtra no browser; validação `file.type.startsWith('image/')` no handler |
| Imagem > 500KB após compressão | Toast de aviso, `imagemPendente` não é setado |
| Backend rejeita base64 malformado | `onError` do SSE → toast de erro existente |
| LLM não suporta visão (fallback) | Backend captura erro e responde sem imagem (texto puro); log de warning |

---

## Fora de Escopo (V1)

- Múltiplas imagens por mensagem
- PDF / vídeo
- Persistência de imagem no Supabase
- OCR local (tesseract.js)
- Compressão adaptativa por velocidade de rede

---

## Critérios de Aceite

- [ ] Clicar "+" abre file picker no desktop e no mobile (câmera/rolo)
- [ ] Thumbnail aparece no preview do input antes de enviar
- [ ] Balão do usuário exibe a imagem + texto (quando houver)
- [ ] Animação shimmer + badge pulsante visíveis enquanto streaming=true
- [ ] Animação desaparece suavemente quando herói responde
- [ ] Herói responde SOBRE o conteúdo da imagem (visão real)
- [ ] Sem imagem: fluxo texto puro funciona exatamente como antes (zero regressão)
- [ ] TypeScript 0 erros
- [ ] Foto > 500KB após compressão: toast de aviso, sem crash
