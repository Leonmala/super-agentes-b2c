import pg from 'pg';

const client = new pg.Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.ahopvaekwejpsxzzrvux',
  password: 'AutoEGV44$_Database',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
CREATE TABLE IF NOT EXISTS b2c_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'base' CHECK (plano IN ('base', 'familiar')),
  max_filhos INT NOT NULL DEFAULT 1,
  max_dispositivos INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa', 'cancelada')),
  mp_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2c_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES b2c_familias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2c_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES b2c_familias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  serie TEXT NOT NULL,
  idade INT,
  nivel_ensino TEXT NOT NULL DEFAULT 'fundamental' CHECK (nivel_ensino IN ('fundamental', 'medio')),
  perfil TEXT,
  dificuldades TEXT,
  interesses TEXT,
  entrevista_psico JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2c_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES b2c_alunos(id) ON DELETE CASCADE,
  tipo_usuario TEXT NOT NULL DEFAULT 'filho' CHECK (tipo_usuario IN ('filho', 'pai')),
  responsavel_id UUID REFERENCES b2c_responsaveis(id),
  turno_atual INT NOT NULL DEFAULT 0,
  agente_atual TEXT NOT NULL DEFAULT 'PSICOPEDAGOGICO',
  tema_atual TEXT,
  plano_ativo TEXT,
  historico_resumido TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  instrucoes_pendentes TEXT,
  agente_destino TEXT,
  transicao_pendente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2c_turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES b2c_sessoes(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  agente TEXT NOT NULL,
  entrada TEXT NOT NULL,
  resposta TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONTINUIDADE',
  plano TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2c_turnos_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL,
  aluno_id UUID NOT NULL,
  numero INT NOT NULL,
  agente TEXT NOT NULL,
  entrada TEXT NOT NULL,
  resposta TEXT NOT NULL,
  status TEXT,
  plano TEXT,
  semana_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  original_created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS b2c_uso_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES b2c_alunos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  interacoes INT NOT NULL DEFAULT 0,
  turnos_completos INT NOT NULL DEFAULT 0,
  UNIQUE(aluno_id, data)
);

CREATE TABLE IF NOT EXISTS b2c_dispositivos_ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES b2c_familias(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL,
  tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('filho', 'pai')),
  device_token TEXT NOT NULL,
  ultimo_ping TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2c_qdrant_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES b2c_alunos(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL,
  semana_ref TEXT NOT NULL,
  ponto_ids TEXT[],
  resumo_semantico TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2c_sessoes_aluno ON b2c_sessoes(aluno_id, status);
CREATE INDEX IF NOT EXISTS idx_b2c_turnos_sessao ON b2c_turnos(sessao_id, numero);
CREATE INDEX IF NOT EXISTS idx_b2c_uso_diario ON b2c_uso_diario(aluno_id, data);
CREATE INDEX IF NOT EXISTS idx_b2c_dispositivos ON b2c_dispositivos_ativos(familia_id);
CREATE INDEX IF NOT EXISTS idx_b2c_alunos_familia ON b2c_alunos(familia_id);
`;

async function run() {
  console.log('Conectando ao Supabase PostgreSQL...');
  await client.connect();
  console.log('Conectado! Aplicando migração...\n');

  await client.query(SQL);
  console.log('✅ Migração aplicada com sucesso!');

  // Verificar tabelas criadas
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'b2c_%'
    ORDER BY table_name
  `);

  console.log('\nTabelas b2c_ encontradas (' + result.rows.length + '):');
  for (const row of result.rows) {
    console.log('  ✅ ' + row.table_name);
  }

  await client.end();
}

run().catch(err => {
  console.error('❌ ERRO:', err.message);
  process.exit(1);
});
