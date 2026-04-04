// server/src/super-prova/fontes-por-materia.ts
// Fontes pedagógicas garantidas por matéria — usadas como ancoragem no prompt Gemini

export interface FonteConfig {
  url: string
  nome: string
}

export const FONTES_POR_MATERIA: Record<string, FonteConfig[]> = {
  matematica: [
    { url: 'https://pt.khanacademy.org', nome: 'Khan Academy Brasil' },
    { url: 'https://mundoeducacao.uol.com.br/matematica', nome: 'Mundo Educação' },
  ],
  portugues: [
    { url: 'https://brasilescola.uol.com.br/gramatica', nome: 'Brasil Escola' },
    { url: 'https://mundoeducacao.uol.com.br/gramatica', nome: 'Mundo Educação' },
  ],
  ciencias_biologia: [
    { url: 'https://pt.wikipedia.org/wiki/Biologia', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/biologia', nome: 'Brasil Escola' },
  ],
  historia: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/historiab', nome: 'Brasil Escola' },
  ],
  geografia: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/geografia', nome: 'Brasil Escola' },
  ],
  fisica: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://brasilescola.uol.com.br/fisica', nome: 'Brasil Escola' },
  ],
  quimica: [
    { url: 'https://pt.wikipedia.org', nome: 'Wikipedia PT' },
    { url: 'https://mundoeducacao.uol.com.br/quimica', nome: 'Mundo Educação' },
  ],
  idiomas: [
    { url: 'https://dictionary.cambridge.org/pt', nome: 'Cambridge Dictionary PT' },
    { url: 'https://www.britishcouncil.org.br', nome: 'British Council Brasil' },
  ],
}

export function getFontesParaMateria(materia: string): FonteConfig[] {
  return FONTES_POR_MATERIA[materia] ?? []
}
