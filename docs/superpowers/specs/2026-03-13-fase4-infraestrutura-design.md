# Fase 4: Infraestrutura — CRON, Qdrant, Limites, Dispositivos

> **Data:** 2026-03-13
> **Status:** Design aprovado pelo Leon
> **Abordagem:** node-cron interno + Qdrant Cloud free tier

---

## Contexto

A Fase 4 completa a infraestrutura necessária antes do SaaS (Fase 5). Quatro subsistemas independentes:

1. CRON semanal (flush turnos → Qdrant → cleanup)
2. Integração Qdrant (embeddings semanais)
3. Controle de dispositivos simultâneos
4. Limite suave completo (25 interações OU 5 turnos)

Tabelas já existem no Supabase: `b2c_turnos_backup`, `b2c_dispositivos_ativos`, `b2c_qdrant_refs`, `b2c_uso_diario`.

---

## 1. CRON Semanal

### Trigger

`node-cron` registrado no boot do Express (`server/src/index.ts`).

**Timezone:** Configurar `TZ=America/Sao_Paulo` no Railway para que node-cron use horário de Brasília. Schedule: `0 23 * * 0` (domingo 23h BRT). Sem TZ configurado, usar equivalente UTC: `0 2 * * 1` (segunda 02h UTC = domingo 23h BRT).

### Fluxo por aluno ativo

```
1. SELECT DISTINCT aluno_id FROM b2c_turnos WHERE created_at >= início da semana
2. Para cada aluno:
   a. Buscar todos os turnos da semana (b2c_turnos)
   b. Se zero turnos → skip
   c. Gerar resumo semântico via LLM (Gemini em dev, Kimi em prod)
   d. Gerar embedding do resumo (Gemini text-embedding-004 em dev; prod TBD com Leon)
   e. Upsert ponto no Qdrant (collection: super_agentes_alunos)
   f. INSERT turnos em b2c_turnos_backup (preservar original_created_at)
   g. INSERT referência em b2c_qdrant_refs (aluno_id, namespace, semana_ref, ponto_ids, resumo)
   h. DELETE turnos originais de b2c_turnos
   i. UPDATE b2c_sessoes SET status = 'encerrada' WHERE aluno_id AND status = 'ativa'
3. Log resultado (alunos processados, erros)
```

### Novo arquivo: `server/src/core/cron.ts`

```typescript
// Exports
registrarCronSemanal(): void  // Chamado no boot (index.ts)
executarFlushSemanal(): Promise<void>  // O job principal
gerarResumoSemantico(turnos: TurnoRow[]): Promise<string>  // LLM call
```

### Semana de referência

Formato: `YYYY-WNN` (ex: `2026-W11`). Calculado com `getISOWeek()`.

### Tratamento de erros

Se falhar para um aluno, loga o erro e continua com os próximos. Não faz rollback parcial — se o embedding salvou mas o backup falhou, o CRON da próxima semana detecta que os turnos ainda existem e reprocessa.

---

## 2. Integração Qdrant

### Infraestrutura

- **Provider:** Qdrant Cloud free tier (1GB, cluster gratuito)
- **Pacote:** `@qdrant/js-client-rest`
- **Collection:** `super_agentes_alunos`
- **Dimensão dos vetores:** 768 (Gemini text-embedding-004)
- **Distance:** Cosine

### Modelo de dados no Qdrant

Cada ponto:
```json
{
  "id": "uuid-gerado",
  "vector": [0.123, ...],  // 768 dimensões
  "payload": {
    "aluno_id": "uuid",
    "semana_ref": "2026-W11",
    "resumo": "O aluno trabalhou frações com dificuldade...",
    "created_at": "2026-03-16T02:00:00Z"
  }
}
```

### Operações

- **Escrita** (CRON): `upsert` com pontos novos
- **Leitura** (SUPERVISOR futuro): `search` por similaridade com filtro `aluno_id`
  - Input: pergunta do pai (ex: "como meu filho está em matemática?")
  - Gera embedding da pergunta → busca top-3 semanas similares → monta contexto

### Novo arquivo: `server/src/db/qdrant.ts`

```typescript
// Exports
inicializarQdrant(): Promise<void>  // Cria collection se não existe
gerarEmbedding(texto: string): Promise<number[]>  // Gemini/Kimi embedding API
salvarEmbeddingSemanal(alunoId: string, semanaRef: string, embedding: number[], resumo: string): Promise<string[]>
buscarContextoLongoPrazo(alunoId: string, query: string, topK?: number): Promise<QdrantResult[]>
```

### Abstração de provider de embeddings

Similar ao `LLM_PROVIDER` existente. O `.env` terá `EMBEDDING_PROVIDER=gemini`. Na V1, usar Gemini text-embedding-004 (768d) tanto em dev quanto em prod inicial. Quando Leon definir o provider de embeddings para produção (família Kimi ou outro), a abstração permite trocar sem mudar código — mas atenção: se a dimensão mudar (ex: 1536d), a collection Qdrant precisa ser recriada.

### Variáveis de ambiente novas

```
QDRANT_URL=https://xxx.cloud.qdrant.io:6333
QDRANT_API_KEY=xxx
EMBEDDING_PROVIDER=gemini
```

---

## 3. Controle de Dispositivos Simultâneos

### Device Token

- Frontend gera UUID v4 no primeiro acesso, armazena em `localStorage` como `sa_device_token`
- Enviado em todo request como header `X-Device-Token`
- Se não existir (localStorage limpo), gera novo

### Middleware Express

Novo arquivo: `server/src/core/dispositivos.ts` — exporta um **middleware Express** reutilizável.

```typescript
// Exports
export function middlewareDispositivos(): RequestHandler  // Middleware Express (req, res, next)
// Internamente chama:
registrarDispositivo(familiaId: string, perfilId: string, tipoPerfil: string, deviceToken: string): Promise<void>
verificarLimiteDispositivos(familiaId: string): Promise<{ permitido: boolean, ativos: number, limite: number }>
limparDispositivosInativos(): Promise<number>  // Retorna quantos removeu
```

O middleware é registrado em `routes/message.ts` antes do handler principal. Assim, futuros endpoints também podem usar.

### Fluxo no endpoint `/api/message`

```
1. Extrair X-Device-Token do header
2. Se ausente → rejeitar (400)
3. registrarDispositivo() → upsert em b2c_dispositivos_ativos (ultimo_ping = now())
4. verificarLimiteDispositivos() → COUNT WHERE familia_id = X AND ultimo_ping > now() - 5min
5. Se ativos > limite → 429 com mensagem amigável
6. Continuar com o processamento normal
```

### Limites por plano

Na V1 (sem checkout): hardcode limite = 3 (máximo do plano Familiar).
Na Fase 5: ler do perfil da família (Base = 2, Familiar = 3).

### Cleanup de dispositivos inativos

`limparDispositivosInativos()` chamado pelo CRON semanal e opcionalmente a cada N requests (ex: a cada 100 mensagens). Remove dispositivos com `ultimo_ping` > 10 minutos.

### Alteração no frontend

`web/src/api/client.ts`: adicionar header `X-Device-Token` em todos os requests autenticados.

---

## 4. Limite Suave Completo

### Bug fix (BLOQUEADOR — corrigir primeiro)

Coluna na tabela `b2c_uso_diario` é `turnos_completos` (não `turnos`). Corrigir em `server/src/db/usage-queries.ts`:
- INSERT: `turnos: 0` → `turnos_completos: 0`
- SELECT: `uso.turnos` → `uso.turnos_completos`
- A coluna `turnos_completos` já existe na tabela (criada na migração original).

### Lógica

- **25 interações/dia** OU **5 turnos completos** por aluno
- Quando atingido: mensagem amigável (não bloqueia hard)
- A mensagem é personalizada com o nome do herói ativo

### Reset diário automático (sem CRON)

No primeiro request do dia:
1. Buscar registro em `b2c_uso_diario` WHERE `aluno_id = X` AND `data = hoje`
2. Se não existe → INSERT com `interacoes = 0, turnos_completos = 0`
3. Se existe → verificar limites
4. Registros de dias anteriores ficam como histórico (não deletar)

### Incremento

- `interacoes`: incrementar a cada mensagem do aluno (no endpoint `/api/message`)
- `turnos_completos`: incrementar quando o herói completa uma resposta (após SSE finalizar). Nova função em `usage-queries.ts`:
  ```typescript
  export async function incrementarTurnoCompleto(alunoId: string): Promise<void>
  ```
  Chamada em `routes/message.ts` após `res.end()`, dentro da Promise chain de persistência.

### Mensagem amigável

```
"Puxa, [NOME_ALUNO]! Você já aprendeu muito hoje! 🌟
Volte amanhã para mais aventuras. Seus super agentes estarão te esperando!"
```

Retornada como SSE event type `limite_atingido` para o frontend renderizar de forma especial.

---

## 5. Arquivos novos e modificados

### Novos

| Arquivo | Propósito |
|---------|-----------|
| `server/src/core/cron.ts` | CRON semanal + registro no boot |
| `server/src/db/qdrant.ts` | Client Qdrant + embeddings |
| `server/src/core/dispositivos.ts` | Controle de dispositivos |

### Modificados

| Arquivo | Mudança |
|---------|---------|
| `server/src/index.ts` | Importar e registrar CRON no boot |
| `server/src/db/usage-queries.ts` | Fix `turnos` → `turnos_completos`, reset automático, nova `incrementarTurnoCompleto()` |
| `server/src/routes/message.ts` | Middleware dispositivos, incremento limites |
| `server/package.json` | Adicionar `@qdrant/js-client-rest` |
| `web/src/api/client.ts` | Header `X-Device-Token` |
| `web/src/contexts/ChatContext.tsx` | Tratar evento `limite_atingido` |
| `web/src/components/ChatBubble.tsx` | Render especial para mensagem de limite |

### Variáveis de ambiente novas

```
QDRANT_URL=
QDRANT_API_KEY=
EMBEDDING_PROVIDER=gemini
```

---

## 6. Dependências novas

```json
{
  "@qdrant/js-client-rest": "^1.12.0"
}
```

`node-cron` já está instalado.

---

## 7. Gate 4 — Critérios de aceitação

| # | Teste | Descrição |
|---|-------|-----------|
| 1 | CRON registra no boot | Verificar que `registrarCronSemanal()` é chamado |
| 2 | Flush processa turnos | Mock de turnos → gera resumo → backup → delete |
| 3 | Embedding gerado | Mock LLM → retorna vetor 768d |
| 4 | Qdrant upsert funciona | Mock client → verifica payload correto |
| 5 | Qdrant search funciona | Mock client → retorna resultados similares |
| 6 | Dispositivo registrado | POST /api/message com X-Device-Token → registro no DB |
| 7 | Limite dispositivos | 4 tokens diferentes → 4º rejeitado (limite 3) |
| 8 | Dispositivo inativo limpo | Ping > 10min → removido pelo cleanup |
| 9 | Bug fix turnos_completos | Coluna correta usada no SQL |
| 10 | Limite interações | 26ª interação → mensagem amigável |
| 11 | Limite turnos | 6º turno → mensagem amigável |
| 12 | Reset diário | Novo dia → registro zerado automaticamente |
| 13 | Mensagem limite no frontend | SSE event `limite_atingido` renderizado |

---

## 8. Decisões de negócio documentadas (para Fase 5)

- Planos: Base (R$ 49,90/mês) e Familiar (R$ 79,90/mês)
- Opção de assinatura anual com desconto
- 3 dias de teste + garantia de devolução
- Dispositivos: Base = 2, Familiar = 3
- Gateway: Mercado Pago (Pix)
