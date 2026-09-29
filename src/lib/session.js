import crypto from 'node:crypto';
import { isProduction, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../config.js';

/**
 * Sessão stateless: payload assinado com HMAC-SHA256 em cookie httpOnly.
 * Não depende de memória do processo, compatível com funções serverless.
 */

function readRequiredEnv(name, minLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(`Variável de ambiente ${name} ausente ou inválida.`);
  }
  return value;
}

function adminEmail() {
  return readRequiredEnv('ADMIN_EMAIL').trim().toLowerCase();
}

function sign(data) {
  return crypto.createHmac('sha256', readRequiredEnv('SESSION_SECRET', 32)).update(data).digest('base64url');
}

function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function credentialsMatch(email, password) {
  const emailOk = safeEqual(email.trim().toLowerCase(), adminEmail());
  const passwordOk = safeEqual(password, readRequiredEnv('ADMIN_PASSWORD'));
  return emailOk && passwordOk;
}

export function createSessionToken() {
  const payload = { sub: adminEmail(), exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token) {
  if (typeof token !== 'string' || token.length > 1024) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature || !safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (payload.sub !== adminEmail()) return null;
    return payload;
  } catch {
    return null;
  }
}

function serializeCookie(value, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/api',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export function sessionCookie(token) {
  return serializeCookie(token, SESSION_TTL_SECONDS);
}

export function clearedSessionCookie() {
  return serializeCookie('', 0);
}

export function readSessionCookie(req) {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const pair of header.split(';')) {
    const index = pair.indexOf('=');
    if (index === -1) continue;
    if (pair.slice(0, index).trim() === SESSION_COOKIE) return pair.slice(index + 1).trim();
  }
  return null;
}
