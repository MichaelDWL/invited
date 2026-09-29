-- Convite de aniversário: apenas duas tabelas.
-- Seguro para executar mais de uma vez.

CREATE TABLE IF NOT EXISTS event_settings (
  id               SMALLINT     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_name       VARCHAR(120) NOT NULL,
  event_date       DATE         NOT NULL,
  event_time       TIME         NOT NULL,
  location_name    VARCHAR(120) NOT NULL,
  location_address VARCHAR(300) NOT NULL,
  maps_url         VARCHAR(600) NOT NULL DEFAULT '',
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Valores iniciais: altere pelo painel /admin.
INSERT INTO event_settings (id, event_name, event_date, event_time, location_name, location_address, maps_url)
VALUES (1, 'Aniversário', '2026-10-24', '20:00', '[NOME DO LOCAL]', '[ENDEREÇO]', '')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS rsvps (
  id           SERIAL       PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  guests_count SMALLINT     NOT NULL CHECK (guests_count BETWEEN 1 AND 20),
  status       VARCHAR(10)  NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'declined')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Uma confirmação por nome: reenviar o formulário atualiza a quantidade em vez de duplicar.
CREATE UNIQUE INDEX IF NOT EXISTS rsvps_name_unique_idx ON rsvps (LOWER(name));
CREATE INDEX IF NOT EXISTS rsvps_created_at_idx ON rsvps (created_at DESC);

-- Bancos já criados com o limite antigo (50) passam a aceitar no máximo 20.
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS rsvps_guests_count_check;
ALTER TABLE rsvps ADD CONSTRAINT rsvps_guests_count_check CHECK (guests_count BETWEEN 1 AND 20);

-- No Supabase, o schema public também fica exposto pela Data API. RLS sem políticas
-- bloqueia esse acesso; o backend conecta como dono das tabelas e não é afetado.
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
