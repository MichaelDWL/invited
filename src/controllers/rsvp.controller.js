import { query } from '../database/connection.js';
import { LIMITS, RSVP_MAX_GUESTS } from '../config.js';
import { requireId, requireInteger, requireOneOf, requirePersonName } from '../lib/validation.js';

const RSVP_COLUMNS = 'id, name, guests_count, status, created_at, updated_at';
const STATUSES = ['confirmed', 'declined'];
const UNIQUE_VIOLATION = '23505';

const parseName = (value) => requirePersonName(value, LIMITS.guestName);
const parseGuests = (value) => requireInteger(value, 'A quantidade de pessoas', { min: 1, max: RSVP_MAX_GUESTS });
const parseStatus = (value) => requireOneOf(value, 'Status', STATUSES);

function parseUpdateInput(body = {}) {
  return {
    name: body.name === undefined ? null : parseName(body.name),
    guestsCount: body.guests_count === undefined ? null : parseGuests(body.guests_count),
    status: body.status === undefined ? null : parseStatus(body.status),
  };
}

export async function createRsvp(req, res) {
  const name = parseName(req.body?.name);
  const guestsCount = parseGuests(req.body?.guests_count);

  const { rows } = await query(
    `INSERT INTO rsvps (name, guests_count, status)
     VALUES ($1, $2, 'confirmed')
     ON CONFLICT ((LOWER(name))) DO UPDATE SET
       guests_count = EXCLUDED.guests_count,
       status = 'confirmed',
       updated_at = NOW()
     RETURNING name, guests_count, status`,
    [name, guestsCount],
  );

  return res.status(201).json({ rsvp: rows[0] });
}

export async function listRsvps(req, res) {
  const { rows } = await query(`SELECT ${RSVP_COLUMNS} FROM rsvps ORDER BY created_at DESC, id DESC`);
  return res.json({ rsvps: rows });
}

export async function updateRsvp(req, res) {
  const id = requireId(req.params.id);
  const { name, guestsCount, status } = parseUpdateInput(req.body);

  try {
    const { rows } = await query(
      `UPDATE rsvps SET
         name = COALESCE($2, name),
         guests_count = COALESCE($3, guests_count),
         status = COALESCE($4, status),
         updated_at = NOW()
       WHERE id = $1
       RETURNING ${RSVP_COLUMNS}`,
      [id, name, guestsCount, status],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Confirmação não encontrada.' });
    return res.json({ rsvp: rows[0] });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: 'Já existe uma confirmação com esse nome.' });
    }
    throw err;
  }
}

export async function deleteRsvp(req, res) {
  const id = requireId(req.params.id);
  const { rowCount } = await query('DELETE FROM rsvps WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'Confirmação não encontrada.' });
  return res.status(204).end();
}
