import { formatHour, formatLongDate, pluralize } from './format.js';

const DIVIDER = '━━━━━━━━━━━━━━';

function confirmedInArrivalOrder(rsvps) {
  return rsvps
    .filter((rsvp) => rsvp.status === 'confirmed')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function summarize(rsvps) {
  const confirmed = rsvps.filter((rsvp) => rsvp.status === 'confirmed');
  return {
    confirmations: confirmed.length,
    people: confirmed.reduce((total, rsvp) => total + rsvp.guests_count, 0),
  };
}

/**
 * Lista de confirmados. `whatsapp: true` usa *negrito* e _itálico_;
 * `false` gera texto puro para o arquivo .txt.
 */
export function buildGuestList(event, rsvps, { whatsapp = true } = {}) {
  const bold = (text) => (whatsapp ? `*${text}*` : text);
  const italic = (text) => (whatsapp ? `_${text}_` : text);
  const clean = (text) => (whatsapp ? text.replace(/[*_~`]/g, '') : text);

  const confirmed = confirmedInArrivalOrder(rsvps);
  const { confirmations, people } = summarize(confirmed);
  const title = (event?.event_name || 'Aniversário').toUpperCase();

  const guestLines = confirmed.length
    ? confirmed.map((rsvp, index) => {
      const label = pluralize(rsvp.guests_count, 'pessoa', 'pessoas');
      return `${index + 1}. ${clean(rsvp.name)} — ${rsvp.guests_count} ${label}`;
    })
    : [italic('Nenhuma confirmação até o momento.')];

  const eventLines = event
    ? [`📅 ${formatLongDate(event.event_date)}`, `🕐 ${formatHour(event.event_time)}`, `📍 ${clean(event.location_name)}`]
    : [];

  return [
    `🎉 ${bold(`${clean(title)} — CONFIRMAÇÕES`)}`,
    '',
    ...eventLines,
    '',
    DIVIDER,
    '',
    `👥 ${bold('LISTA DE CONFIRMADOS')}`,
    '',
    ...guestLines,
    '',
    DIVIDER,
    '',
    `👤 Total de convidados: ${confirmations}`,
    `🎉 Total de pessoas: ${people}`,
    '',
    'Obrigado a todos pela confirmação! ❤️',
  ].join('\n');
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Cópia não suportada.');
}

export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
