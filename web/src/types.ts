export interface Familia {
  id: string
  email: string
  plano: string
  status: string
}

export interface Filho {
  id: string
  nome: string
  serie: string
  nivel_ensino: 'fundamental' | 'medio'
}

export interface Responsavel {
  id: string
  nome: string
}

export interface LoginResponse {
  token: string
  familia: Familia
  filhos: Filho[]
  responsavel: Responsavel | null
}

export interface SelectProfileResponse {
  sessao: {
    aluno_id?: string
    familia_id: string
    responsavel_id?: string
    tipo_usuario: 'filho' | 'pai'
  }
  tipo_interface: 'fundamental' | 'medio' | 'pai'
  aluno?: Filho
}

export type TipoUsuario = 'filho' | 'pai'
export type TipoInterface = 'fundamental' | 'medio' | 'pai'

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  agente?: string
  timestamp: number
}

export type HeroId =
  | 'CALCULUS' | 'VERBETTA' | 'NEURON' | 'TEMPUS'
  | 'GAIA' | 'VECTOR' | 'ALKA' | 'FLEX'

export interface HeroMeta {
  id: HeroId
  nome: string
  materia: string
  cor: string
  gradientFrom: string
  gradientTo: string
  accent: string
  bgImage: string
  avatar: string
  card: string
  logo: string | null
  limpo: string
}
