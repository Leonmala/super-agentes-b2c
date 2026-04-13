import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// TIPOS — UNIVERSAL METHOD (PSICO → HERÓI)
// ============================================================

export interface TopicoPlano {
  id: number
  nome: string
  status: 'pendente' | 'em_progresso' | 'concluido'
}

export interface PsicoPlanoUniversal {
  ativo: boolean
  topicos: TopicoPlano[]
  topico_atual_id: number
  total: number
  fechar_com_quiz: boolean
}

export interface QuizResultado {
  total: number
  acertos: number
  erros: Array<{ questao: number; topico: string }>
}

// ============================================================
// INTERFACES DE DADOS
// ============================================================

export interface Familia {
  id: string
  email: string
  senha_hash: string
  plano: 'base' | 'familiar'
  status: 'ativa' | 'pausada' | 'cancelada'
  created_at: string
  updated_at: string
}

export interface Responsavel {
  id: string
  familia_id: string
  nome: string
  pin_hash: string
  created_at: string
  updated_at: string
}

export interface Aluno {
  id: string
  familia_id: string
  nome: string
  serie: string
  idade: number | null
  nivel_ensino: 'fundamental' | 'medio'
  entrevista_psico: Record<string, unknown> | null
  perfil?: string | null
  dificuldades?: string | null
  interesses?: string | null
  created_at: string
  updated_at: string
}

export interface Sessao {
  id: string
  aluno_id: string
  responsavel_id: string | null
  tipo_usuario: 'filho' | 'pai'
  turno_atual: number
  agente_atual: string
  tema_atual: string | null
  plano_ativo: string | null
  historico_resumido: string | null
  status: 'ativa' | 'pausada' | 'encerrada'
  instrucoes_pendentes: string | null
  agente_destino: string | null
  transicao_pendente: boolean
  created_at: string
  updated_at: string
  ultimo_turno_at: string
  link_pendente: string | null  // URL aguardando contexto do aluno (Hook 0 — Link Guardian)
}

export interface Turno {
  id: string
  sessao_id: string
  numero: number
  agente: string
  entrada: string
  resposta: string
  status: 'CONTINUIDADE' | 'TROCA_TEMA' | 'ENCAMINHADO_PSICO' | 'PAUSA'
  plano: string | null
  observacao: string | null
  sinal_psicopedagogico: boolean
  motivo_sinal: string | null
  observacoes_internas: string | null
  created_at: string
}

export interface UsoDiario {
  id: string
  aluno_id: string
  data: string
  interacoes: number
  turnos_completos: number
  created_at: string
  updated_at: string
}

export interface DispositivoAtivo {
  id: string
  familia_id: string
  perfil_id: string
  tipo_perfil: string
  device_token: string
  ultimo_ping: string
  created_at: string
}

export interface QdrantRef {
  id: string
  aluno_id: string
  namespace: string
  semana_ref: string
  ponto_ids: string[] | null
  resumo_semantico: string | null
  created_at: string
}
