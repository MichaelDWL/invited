const LOCALE = 'pt-BR';

const formatters = {
  weekday: new Intl.DateTimeFormat(LOCALE, { weekday: 'long', timeZone: 'UTC' }),
  month: new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }),
  monthShort: new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' }),
  dateTime: new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }),
};

/** "2026-10-24" → Date ao meio-dia UTC (evita virar o dia por causa do fuso do navegador). */
function toCalendarDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function describeDate(isoDate) {
  const date = toCalendarDate(isoDate);
  const [year, month, day] = isoDate.split('-');
  return {
    weekday: formatters.weekday.format(date),
    day: String(Number(day)),
    dayPadded: day,
    monthNumber: month,
    month: formatters.month.format(date),
    monthShort: formatters.monthShort.format(date).replace('.', ''),
    year,
  };
}

/** "24 de outubro de 2026" */
export function formatLongDate(isoDate) {
  const { day, month, year } = describeDate(isoDate);
  return `${day} de ${month} de ${year}`;
}

/** "24 · 10 · 2026" */
export function formatDottedDate(isoDate) {
  const { dayPadded, monthNumber, year } = describeDate(isoDate);
  return `${dayPadded} · ${monthNumber} · ${year}`;
}

/** "20:00" → "20h" · "20:30" → "20h30" */
export function formatHour(time) {
  const [hours, minutes] = time.split(':');
  return minutes === '00' ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}

/** Timestamp ISO → "20/09/2026" no fuso do navegador. */
export function formatTimestamp(isoTimestamp) {
  return formatters.dateTime.format(new Date(isoTimestamp));
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}
