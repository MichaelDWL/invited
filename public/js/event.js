import { requestJson } from './http.js';
import { describeDate, formatDottedDate } from './format.js';
import { INVITE } from './config.js';

const MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=';

export async function loadEvent() {
  const { event } = await requestJson('/api/event');
  return event;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildMapsUrl({ maps_url: mapsUrl, location_name: name, location_address: address }) {
  if (mapsUrl && isHttpsUrl(mapsUrl)) return mapsUrl;
  const query = [name, address.replace(/\n+/g, ', ')].filter(Boolean).join(', ');
  return MAPS_SEARCH_URL + encodeURIComponent(query);
}

function fillEventFields(values) {
  for (const element of document.querySelectorAll('[data-event]')) {
    const value = values[element.dataset.event];
    if (value !== undefined) element.textContent = value;
  }
  document.documentElement.classList.add('event-ready');
}

export function renderEvent(event) {
  const date = describeDate(event.event_date);

  fillEventFields({
    weekday: date.weekday,
    day: date.day,
    month: `de ${date.month}`,
    year: date.year,
    time: event.event_time,
    short_date: formatDottedDate(event.event_date),
    location_name: event.location_name,
    location_address: event.location_address,
    event_name: event.event_name,
  });

  document.querySelector('[data-event-datetime]')?.setAttribute('datetime', `${event.event_date}T${event.event_time}`);
  document.querySelector('[data-maps-link]')?.setAttribute('href', buildMapsUrl(event));
  document.title = event.event_name;
}

export function renderEventFallback() {
  fillEventFields(INVITE.placeholders);
}
