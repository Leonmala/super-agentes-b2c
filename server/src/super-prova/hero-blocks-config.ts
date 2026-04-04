// server/src/super-prova/hero-blocks-config.ts
// Definições dos blocos didáticos por herói — usadas para estruturar o prompt de síntese Gemini

export interface HeroBlockDefinition {
  id: string
  nome: string
  descricao: string
  exemplo: string
}

export const HERO_BLOCKS: Record<string, HeroBlockDefinition[]> = {
  CALCULUS: [
    { id: 'concreto_abstrato', nome: 'Concreto → Abstrato', descricao: 'Situação real que leva ao conceito matemático', exemplo: '3 caixas com 4 lápis → 3 × 4' },
    { id: 'visual_texto', nome: 'Visual em Texto', descricao: 'Representação visual usando texto/ASCII', exemplo: 'Arrays, frações em pizza, contas armadas' },
    { id: 'passo_a_passo', nome: 'Passo a Passo Visível', descricao: 'Algoritmo com sentido, numerado', exemplo: '1️⃣ identificar 2️⃣ escolher operação 3️⃣ calcular 4️⃣ conferir' },
    { id: 'erro_como_pista', nome: 'Erro como Pista', descricao: 'Diagnóstico do erro sem julgamento', exemplo: 'Esse resultado mostra que você juntou em vez de repartir' },
    { id: 'micro_desafio', nome: 'Micro-Desafio', descricao: 'Pergunta prática para o aluno resolver', exemplo: 'Desenha mentalmente 4 grupos de 5' },
    { id: 'checagem_sentido', nome: 'Checagem de Sentido', descricao: 'Verificação do resultado no contexto', exemplo: 'Seu número faz sentido para a história?' },
  ],
  VERBETTA: [
    { id: 'ancora_sentido', nome: 'Âncora de Sentido', descricao: 'Interpretação do sentido antes da regra gramatical', exemplo: 'O que esse texto quer dizer antes de analisar a gramática' },
    { id: 'antes_depois', nome: 'Antes e Depois', descricao: 'Comparação de versão original vs corrigida', exemplo: 'Antes: "fui na casa" → Depois: "fui à casa"' },
    { id: 'funcao_linguistica', nome: 'Função Linguística Visível', descricao: 'Marcação visual das funções na frase', exemplo: '[Sujeito] [Verbo] [Advérbio]' },
    { id: 'estrutura_textual', nome: 'Estrutura Textual', descricao: 'Organização do texto antes de escrever', exemplo: 'Introdução → Desenvolvimento → Conclusão' },
    { id: 'micro_producao', nome: 'Micro-Desafio de Produção', descricao: 'Aluno cria uma frase/parágrafo curto', exemplo: 'Escreva uma frase usando a regra vista' },
  ],
  NEURON: [
    { id: 'observacao_cotidiano', nome: 'Observação do Cotidiano', descricao: 'Fenômeno observável que ancora o conceito', exemplo: 'Quando você corre, o coração bate mais rápido' },
    { id: 'hipotese_simples', nome: 'Hipótese Simples', descricao: 'Ideia possível antes da explicação científica', exemplo: 'Uma ideia possível é que o corpo precise de mais energia' },
    { id: 'explicacao_cientifica', nome: 'Explicação Científica Curta', descricao: '1 conceito científico explicado claramente', exemplo: 'Os músculos precisam de oxigênio → coração acelera' },
    { id: 'visual_processo', nome: 'Visual em Texto (Processo)', descricao: 'Diagrama ASCII de sistema ou ciclo', exemplo: 'Pulmões → sangue → músculos' },
    { id: 'causa_consequencia', nome: 'Causa e Consequência', descricao: 'Relação lógica Se X então Y', exemplo: 'Se o coração não acelerasse, os músculos ficariam sem energia' },
    { id: 'micro_desafio', nome: 'Micro-Desafio Investigativo', descricao: 'Pergunta investigativa para o aluno', exemplo: 'O que aconteceria se corrêssemos ainda mais rápido?' },
  ],
  TEMPUS: [
    { id: 'localizacao_tempo', nome: 'Localização no Tempo', descricao: 'Situa o aluno no período histórico', exemplo: 'Estamos falando de um período em que...' },
    { id: 'contexto_historico', nome: 'Contexto Histórico', descricao: 'Situação social/econômica/cultural básica', exemplo: 'A Europa estava dividida entre potências imperialistas' },
    { id: 'processo_historico', nome: 'Processo Histórico', descricao: 'Explica mudança ou permanência histórica', exemplo: 'A revolução não foi um evento único, mas um processo de...' },
    { id: 'visual_temporal', nome: 'Visual Temporal em Texto', descricao: 'Linha do tempo ou comparação temporal ASCII', exemplo: 'Antes → Durante → Depois | [1933] → [1939] → [1945]' },
    { id: 'causa_consequencia', nome: 'Causa e Consequência', descricao: 'Cadeia histórica de causas e efeitos', exemplo: 'Isso aconteceu porque... → Isso gerou...' },
    { id: 'multiplos_atores', nome: 'Múltiplos Atores', descricao: 'Diferentes grupos que viveram o processo', exemplo: 'Para os judeus... Para os alemães comuns... Para os aliados...' },
  ],
  GAIA: [
    { id: 'do_conhecido_ao_global', nome: 'Do Conhecido ao Global', descricao: 'Escalas progressivas do bairro ao mundo', exemplo: 'Seu bairro → cidade → país → mundo' },
    { id: 'conceito_sentido', nome: 'Conceito + Sentido', descricao: 'Definição com propósito e uso real', exemplo: 'Território não é só área no mapa — é espaço controlado' },
    { id: 'cadeia_causa', nome: 'Cadeia Causa → Consequência', descricao: 'Relação geográfica em cadeia', exemplo: 'Desmatamento ↑ → umidade ↓ → chuva ↓' },
    { id: 'mapa_mental_texto', nome: 'Mapa Mental em Texto', descricao: 'Perfil altimétrico ou espacial em ASCII', exemplo: '🌊 Litoral ⛰️ Serra ☀️ Interior' },
    { id: 'comparacao_regioes', nome: 'Comparação A × B', descricao: 'Quadro comparativo de climas/regiões/países', exemplo: 'Equatorial: chuva frequente | Semiárido: chuva irregular' },
  ],
  VECTOR: [
    { id: 'cena_cotidiano', nome: 'Cena do Cotidiano', descricao: 'Situação física do dia a dia como ponto de partida', exemplo: 'Imagina empurrar um carrinho de supermercado...' },
    { id: 'explicacao_conceitual', nome: 'Explicação Conceitual', descricao: 'Fenômeno antes da fórmula', exemplo: 'Força é a causa da mudança de movimento' },
    { id: 'diagrama_forcas', nome: 'Diagrama de Forças ASCII', descricao: 'FBD com setas e nomes', exemplo: 'N↑ [bloco] → F\n← atrito\n↓ P' },
    { id: 'grafico_mini', nome: 'Mini-Gráfico ASCII', descricao: 'Gráfico v×t ou s×t qualitativo', exemplo: 'v| ────── t (velocidade constante)' },
    { id: 'cadeia_causa', nome: 'Cadeia Causa → Efeito', descricao: 'Relação física lógica', exemplo: 'Força resultante ↑ → aceleração ↑' },
  ],
  ALKA: [
    { id: 'observacao_cotidiano', nome: 'Observação do Cotidiano', descricao: 'Fenômeno químico do dia a dia', exemplo: 'Um prego enferruja mas um copo de vidro não' },
    { id: 'hipotese_simples', nome: 'Hipótese Simples', descricao: 'Ideia antes da explicação química', exemplo: 'Uma ideia possível é que o material reagiu com algo do ambiente' },
    { id: 'explicacao_quimica', nome: 'Explicação Química Curta', descricao: '1 conceito químico por vez', exemplo: 'Na ferrugem, o ferro reage com o oxigênio formando nova substância' },
    { id: 'visual_modelo', nome: 'Visual em Texto (Modelo Mental)', descricao: 'Representação da transformação química', exemplo: 'Ferro + Oxigênio → Ferrugem (nova substância)' },
    { id: 'causa_consequencia', nome: 'Causa e Consequência', descricao: 'Se reação química → o quê muda', exemplo: 'Se ocorre reação química, a matéria muda de identidade' },
  ],
  FLEX: [
    { id: 'situacao_uso', nome: 'Situação Real de Uso', descricao: 'Contexto comunicativo real do idioma', exemplo: 'Em inglês, quando queremos pedir algo educadamente...' },
    { id: 'frase_modelo', nome: 'Frase Modelo Curta', descricao: 'Exemplo simples e funcional na língua', exemplo: 'Could you help me? / ¿Puedes ayudarme?' },
    { id: 'ponte_significado', nome: 'Ponte de Significado', descricao: 'Tradução/explicação do sentido em português', exemplo: '"Could" aqui não é passado — é pedido educado' },
    { id: 'padrao_linguistico', nome: 'Padrão Linguístico', descricao: 'Estrutura sem jargão técnico', exemplo: 'Could + you + verbo? = pedido educado' },
    { id: 'micro_producao', nome: 'Micro-Produção do Aluno', descricao: 'Aluno cria frase curta no idioma', exemplo: 'Como você diria "posso sentar aqui?" em inglês?' },
  ],
}

export function getHeroBlocks(heroiId: string): HeroBlockDefinition[] {
  return HERO_BLOCKS[heroiId] ?? []
}
