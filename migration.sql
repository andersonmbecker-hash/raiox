-- Raio-X da Bio — tabela de respostas e resultados
CREATE TABLE IF NOT EXISTS raiox_bio_respostas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  nome          text,
  bio_atual     text,
  instagram     text,
  idade_publico text,
  transformacao text,
  nicho         text,
  pessoal       text,
  resultado     jsonb,         -- {score_geral, notas:{comunicacao,identificacao,clareza}, analise, sugestoes:[...]}
  criado_em     timestamptz DEFAULT now(),
  UNIQUE (email)               -- mesma pessoa sempre recebe o mesmo resultado (cache)
);

ALTER TABLE raiox_bio_respostas ENABLE ROW LEVEL SECURITY;

-- API usa service key (server-side), então políticas permissivas são ok
CREATE POLICY "raiox_insert" ON raiox_bio_respostas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "raiox_select" ON raiox_bio_respostas
  FOR SELECT USING (true);

CREATE POLICY "raiox_update" ON raiox_bio_respostas
  FOR UPDATE USING (true);
