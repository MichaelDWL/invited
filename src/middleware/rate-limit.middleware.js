import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function limiter(limit, message) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
  });
}

export const rsvpLimiter = limiter(20, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');

export const loginLimiter = limiter(10, 'Muitas tentativas de acesso. Aguarde alguns minutos.');
