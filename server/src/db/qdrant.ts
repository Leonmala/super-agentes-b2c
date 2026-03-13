// Qdrant Cloud integration — embeddings semanais por aluno
import { QdrantClient } from '@qdrant/js-client-rest'
import { GoogleGenerativeAI } from '@google/generative-ai'

const QDRANT_URL = process.env.QDRANT_URL || ''
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || ''
const COLLECTION_NAME = 'super_agentes_alunos'
const EMBEDDING_DIM = 768 // Gemini text-embedding-004

// Lazy init — only create client when actually needed
let qdrantClient: QdrantClient | null = null

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    if (!QDRANT_URL || !QDRANT_API_KEY) {
      throw new Error('QDRANT_URL e QDRANT_API_KEY são obrigatórios para integração Qdrant')
    }
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY
    })
  }
  return qdrantClient
}

// ============================================================
// INICIALIZAR COLLECTION
// ============================================================

export async function inicializarQdrant(): Promise<void> {
  const client = getQdrantClient()

  try {
    const collections = await client.getCollections()
    const existe = collections.collections.some(c => c.name === COLLECTION_NAME)

    if (!existe) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIM,
          distance: 'Cosine'
        }
      })
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' criada (${EMBEDDING_DIM}d, Cosine)`)
    } else {
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' já existe`)
    }
  } catch (erro: any) {
    console.error('[Qdrant] Erro ao inicializar:', erro.message)
    throw erro
  }
}

// ============================================================
// GERAR EMBEDDING (Gemini text-embedding-004)
// ============================================================

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY é obrigatório para gerar embeddings')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

  const result = await model.embedContent(texto)
  const embedding = result.embedding.values

  if (!embedding || embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Embedding inválido: esperado ${EMBEDDING_DIM}d, recebido ${embedding?.length || 0}d`)
  }

  return embedding
}

// ============================================================
// SALVAR EMBEDDING SEMANAL
// ============================================================

export async function salvarEmbeddingSemanal(
  alunoId: string,
  semanaRef: string,
  embedding: number[],
  resumo: string
): Promise<string> {
  const client = getQdrantClient()
  const pontoId = crypto.randomUUID()

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: pontoId,
        vector: embedding,
        payload: {
          aluno_id: alunoId,
          semana_ref: semanaRef,
          resumo,
          created_at: new Date().toISOString()
        }
      }
    ]
  })

  console.log(`[Qdrant] Ponto ${pontoId} salvo para aluno ${alunoId} (${semanaRef})`)
  return pontoId
}

// ============================================================
// BUSCAR CONTEXTO LONGO PRAZO (para SUPERVISOR)
// ============================================================

export async function buscarContextoLongoPrazo(
  alunoId: string,
  queryTexto: string,
  topK: number = 3
): Promise<Array<{ semana_ref: string; resumo: string; score: number }>> {
  const client = getQdrantClient()
  const queryEmbedding = await gerarEmbedding(queryTexto)

  const results = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit: topK,
    filter: {
      must: [
        {
          key: 'aluno_id',
          match: { value: alunoId }
        }
      ]
    },
    with_payload: true
  })

  return results.map(r => ({
    semana_ref: (r.payload as any)?.semana_ref || '',
    resumo: (r.payload as any)?.resumo || '',
    score: r.score
  }))
}

// ============================================================
// VERIFICAR SE QDRANT ESTÁ CONFIGURADO
// ============================================================

export function qdrantConfigurado(): boolean {
  return Boolean(QDRANT_URL && QDRANT_API_KEY)
}
