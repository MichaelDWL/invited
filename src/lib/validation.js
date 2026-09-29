const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g;
const ANGLE_BRACKETS = /[<>]/g;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.expose = true;
  }
}

export function sanitizeText(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';

  const text = value.normalize('NFC').replace(CONTROL_CHARS, '').replace(ANGLE_BRACKETS, '');
  if (!multiline) return text.replace(/\s+/g, ' ').trim();

  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export function requireText(value, label, { min, max, multiline = false }) {
  const text = sanitizeText(value, { multiline });
  if (text.length < min || text.length > max) {
    throw new ValidationError(`${label} deve ter entre ${min} e ${max} caracteres.`);
  }
  return text;
}

export function requirePersonName(value, { min, max }) {
  const name = requireText(value, 'O nome', { min, max });
  if (!/\p{L}/u.test(name)) throw new ValidationError('Informe um nome válido.');
  return name;
}

export function requireInteger(value, label, { min, max }) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new ValidationError(`${label} deve ser um número entre ${min} e ${max}.`);
  }
  return number;
}

export function requireId(value) {
  return requireInteger(value, 'O identificador', { min: 1, max: 2_147_483_647 });
}

export function requireDate(value) {
  const match = typeof value === 'string' ? DATE_PATTERN.exec(value.trim()) : null;
  if (!match) throw new ValidationError('Informe uma data válida.');

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealDate || year < 2000 || year > 2100) throw new ValidationError('Informe uma data válida.');

  return match[0];
}

export function requireTime(value) {
  const match = typeof value === 'string' ? TIME_PATTERN.exec(value.trim()) : null;
  if (!match) throw new ValidationError('Informe um horário válido.');
  return `${match[1]}:${match[2]}`;
}

export function optionalHttpsUrl(value, { max }) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  if (text.length > max) throw new ValidationError(`O link deve ter no máximo ${max} caracteres.`);

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new ValidationError('Informe um link válido, começando com https://');
  }
  if (url.protocol !== 'https:') throw new ValidationError('O link deve começar com https://');

  return url.toString();
}

export function requireOneOf(value, label, options) {
  if (!options.includes(value)) throw new ValidationError(`${label} inválido.`);
  return value;
}
