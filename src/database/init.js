import { readFile } from 'node:fs/promises';
import { query, closePool } from './connection.js';

try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await query(schema);
  console.log('Tabelas event_settings e rsvps prontas.');
} catch (err) {
  console.error('Falha ao criar as tabelas:', err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
