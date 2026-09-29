import pg from 'pg';

let pool;

// Pool pequeno e reaproveitado entre invocações da mesma instância serverless.
function getPool() {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
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
