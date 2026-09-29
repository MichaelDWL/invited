import { clearedSessionCookie, createSessionToken, credentialsMatch, sessionCookie } from '../lib/session.js';

const readField = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

export function login(req, res) {
  const email = readField(req.body?.email, 254).trim();
  const password = readField(req.body?.password, 200);

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  if (!credentialsMatch(email, password)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
  return res.json({ authenticated: true });
}

export function logout(req, res) {
  res.setHeader('Set-Cookie', clearedSessionCookie());
  return res.json({ authenticated: false });
}

export function session(req, res) {
  return res.json({ authenticated: true, email: req.admin.email });
}
