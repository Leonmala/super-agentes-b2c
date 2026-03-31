import type { HeroMeta, HeroId } from './types'

export const HEROES: Record<HeroId, HeroMeta> = {
  CALCULUS: {
    id: 'CALCULUS', nome: 'Calculus', materia: 'Matemática',
    cor: '#1E3F6B', gradientFrom: '#1E3F6B', gradientTo: '#0A1628', accent: '#3B6BA8',
    bgImage: '/heroes/bg-calculus.png',
    avatar: '/heroes/calculus_buble.png', card: '/heroes/calculus-card.png',
    logo: '/heroes/calculus-logo.png', limpo: '/heroes/calculus-limpo.png',
  },
  VERBETTA: {
    id: 'VERBETTA', nome: 'Verbetta', materia: 'Português',
    cor: '#5C2D90', gradientFrom: '#5C2D90', gradientTo: '#1E0B38', accent: '#8B5CF6',
    bgImage: '/heroes/bg-verbetta.png',
    avatar: '/heroes/verbetta_buble.png', card: '/heroes/verbetta-card.png',
    logo: '/heroes/verbetta-logo.png', limpo: '/heroes/verbetta-limpo.png',
  },
  NEURON: {
    id: 'NEURON', nome: 'Neuron', materia: 'Ciências / Biologia',
    cor: '#1E8A7A', gradientFrom: '#1E8A7A', gradientTo: '#0C3830', accent: '#34D399',
    bgImage: '/heroes/bg-neuron.png',
    avatar: '/heroes/neuron_buble.png', card: '/heroes/neuron-card.png',
    logo: '/heroes/neuron-logo.png', limpo: '/heroes/neuron-limpo.png',
  },
  TEMPUS: {
    id: 'TEMPUS', nome: 'Tempus', materia: 'História',
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
    id: 'VECTOR', nome: 'Vector', materia: 'Física',
    cor: '#9A7018', gradientFrom: '#9A7018', gradientTo: '#3A2808', accent: '#D4A030',
    bgImage: '/heroes/bg-vector.png',
    avatar: '/heroes/vector_buble.png', card: '/heroes/vector-card.png',
    logo: '/heroes/vector-logo.png', limpo: '/heroes/vector-limpo.png',
  },
  ALKA: {
    id: 'ALKA', nome: 'Alka', materia: 'Química',
    cor: '#4A2480', gradientFrom: '#4A2480', gradientTo: '#160838', accent: '#A855F7',
    bgImage: '/heroes/bg-alka.png',
    avatar: '/heroes/alka_buble.png', card: '/heroes/alka-card.png',
    logo: '/heroes/alka-logo.png', limpo: '/heroes/alka-limpo.png',
  },
  FLEX: {
    id: 'FLEX', nome: 'Flexy', materia: 'Inglês e Espanhol',
    cor: '#C02828', gradientFrom: '#C02828', gradientTo: '#4A0E0E', accent: '#F87171',
    bgImage: '/heroes/bg-flexy.png',
    avatar: '/heroes/flexy_buble.png', card: '/heroes/flexy-card.png',
    logo: '/heroes/flexy-logo.png', limpo: '/heroes/flexy-limpo.png',
  },
}

// Metadados de exibição para agentes especiais (não-heróis)
// Usados no ChatHeader quando agenteMenu !== 'super_agentes'
export const AGENTES_ESPECIAIS: Record<string, {
  nome: string
  materia: string
  gradientFrom: string
  gradientTo: string
  avatar: string
}> = {
  professor_ia: {
    nome: 'Prof. Pense-AI',
    materia: 'Uso de IA & Prompts',
    gradientFrom: '#0F766E',
    gradientTo: '#042F2E',
    avatar: '/LogoPenseAI.png',
  },
  supervisor: {
    nome: 'Supervisor Educacional',
    materia: 'Relatório Semanal',
    gradientFrom: '#047857',
    gradientTo: '#022C22',
    avatar: '/logo-super-agentes.png',
  },
}

export const INTERFACE_COLORS = {
  fundamental: '#2563EB',
  medio: '#7C3AED',
  pai: '#059669',
} as const

// Paleta vibrante saturada para filhos — sem gênero, atribuída por índice
export const FILHO_COLORS = [
  '#EAB308', // amarelo
  '#DC2626', // vermelho
  '#16A34A', // verde
  '#EA580C', // laranja
  '#7C3AED', // roxo
  '#0891B2', // ciano
] as const

// Azul institucional — responsável e botão enviar
export const PAI_COLOR = '#2563EB'

// Retorna a cor do perfil ativo: pai = azul, filho = paleta por índice
export function getProfileColor(tipoUsuario: 'filho' | 'pai', filhoIndex: number): string {
  if (tipoUsuario === 'pai') return PAI_COLOR
  return FILHO_COLORS[filhoIndex % FILHO_COLORS.length]
}
