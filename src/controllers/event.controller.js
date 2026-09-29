import { query } from '../database/connection.js';
import { EVENT_UTC_OFFSET, LIMITS, RSVP_MAX_GUESTS } from '../config.js';
import { optionalHttpsUrl, requireDate, requireText, requireTime } from '../lib/validation.js';

const EVENT_COLUMNS = `
  event_name,
  to_char(event_date, 'YYYY-MM-DD') AS event_date,
  to_char(event_time, 'HH24:MI') AS event_time,
  location_name,
  location_address,
  maps_url,
  updated_at
`;

function toResponse(row) {
  return {
    ...row,
    starts_at: `${row.event_date}T${row.event_time}:00${EVENT_UTC_OFFSET}`,
    max_guests: RSVP_MAX_GUESTS,
  };
}

function parseEventInput(body = {}) {
  return {
    eventName: requireText(body.event_name, 'O nome do evento', LIMITS.eventName),
    eventDate: requireDate(body.event_date),
    eventTime: requireTime(body.event_time),
    locationName: requireText(body.location_name, 'O nome do local', LIMITS.locationName),
    locationAddress: requireText(body.location_address, 'O endereço', { ...LIMITS.locationAddress, multiline: true }),
    mapsUrl: optionalHttpsUrl(body.maps_url, LIMITS.mapsUrl),
  };
}

export async function getEvent(req, res) {
  const { rows } = await query(`SELECT ${EVENT_COLUMNS} FROM event_settings WHERE id = 1`);
  if (!rows[0]) return res.status(404).json({ error: 'Evento ainda não configurado.' });
  return res.json({ event: toResponse(rows[0]) });
}

export async function updateEvent(req, res) {
  const input = parseEventInput(req.body);

  const { rows } = await query(
    `INSERT INTO event_settings (id, event_name, event_date, event_time, location_name, location_address, maps_url)
     VALUES (1, $1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       event_name = EXCLUDED.event_name,
       event_date = EXCLUDED.event_date,
       event_time = EXCLUDED.event_time,
       location_name = EXCLUDED.location_name,
       location_address = EXCLUDED.location_address,
       maps_url = EXCLUDED.maps_url,
       updated_at = NOW()
     RETURNING ${EVENT_COLUMNS}`,
    [input.eventName, input.eventDate, input.eventTime, input.locationName, input.locationAddress, input.mapsUrl],
  );

  return res.json({ event: toResponse(rows[0]) });
}
