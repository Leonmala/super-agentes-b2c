import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
  created_at: string
}

export interface UsoDiario {
  id: string
  aluno_id: string
  data: string
  interacoes: number
  turnos: number
  created_at: string
  updated_at: string
}

export interface DispositivoAtivo {
  id: string
  sessao_id: string
  user_agent: string
  ip_address: string | null
  ultimo_heartbeat: string
  created_at: string
}
