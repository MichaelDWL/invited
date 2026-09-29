export const isProduction = process.env.NODE_ENV === 'production';

/** Máximo de pessoas por confirmação (inclui o próprio convidado). */
export const RSVP_MAX_GUESTS = 20;

/** Fuso do local do evento. A data/hora salva no banco é interpretada neste fuso. */
export const EVENT_UTC_OFFSET = '-03:00';

export const SESSION_COOKIE = 'invite_admin';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const LIMITS = {
  guestName: { min: 2, max: 100 },
  eventName: { min: 2, max: 120 },
  locationName: { min: 2, max: 120 },
  locationAddress: { min: 2, max: 300 },
  mapsUrl: { max: 600 },
};
