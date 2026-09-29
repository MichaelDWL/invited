import { readSessionCookie, verifySessionToken } from '../lib/session.js';

export function requireAdmin(req, res, next) {
  const session = verifySessionToken(readSessionCookie(req));
  if (!session) {
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }

  req.admin = { email: session.sub };
  return next();
}
