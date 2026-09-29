import pg from 'pg';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

let pool;

/**
 * Bancos remotos (Supabase) sempre usam TLS. O `pg` trata `sslmode=require` como
 * `verify-full`, o que rejeita a CA própria do Supabase; por isso o modo é
 * removido da URL e o TLS é configurado aqui. `sslmode=disable` desliga o TLS.
 */
function poolConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');

  const useSsl = sslMode ? sslMode !== 'disable' : !LOCAL_HOSTS.has(url.hostname);

  return {
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    // Cada instância serverless atende poucas requisições ao mesmo tempo; o pooler
    // do Supabase (porta 6543) é quem multiplexa as conexões reais.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  };
}

// Criado uma vez por instância e reaproveitado entre invocações.
function getPool() {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  pool = new pg.Pool(poolConfig(process.env.DATABASE_URL));
  pool.on('error', (err) => console.error('[db]', err.message));

  return pool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
