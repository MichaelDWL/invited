import { formatTimestamp, pluralize } from './format.js';

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'declined', label: 'Recusado' },
];

const TRASH_ICON = 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5';

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterByName(rsvps, search) {
  const term = normalize(search.trim());
  return term ? rsvps.filter((rsvp) => normalize(rsvp.name).includes(term)) : rsvps;
}

function cell(className, content) {
  const td = document.createElement('td');
  td.className = className;
  if (content instanceof Node) td.append(content);
  else td.textContent = content;
  return td;
}

function statusSelect(rsvp) {
  const select = document.createElement('select');
  select.className = 'status-select';
  select.dataset.action = 'status';
  select.dataset.status = rsvp.status;
  select.setAttribute('aria-label', `Status de ${rsvp.name}`);

  for (const option of STATUS_OPTIONS) {
    select.add(new Option(option.label, option.value, false, option.value === rsvp.status));
  }
  return select;
}

function deleteButton(rsvp) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-btn';
  button.dataset.action = 'delete';
  button.setAttribute('aria-label', `Excluir confirmação de ${rsvp.name}`);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', TRASH_ICON);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.2');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  button.append(svg);
  return button;
}

function row(rsvp) {
  const tr = document.createElement('tr');
  tr.dataset.id = String(rsvp.id);

  const count = cell('guests__count', String(rsvp.guests_count));
  count.dataset.suffix = ` ${pluralize(rsvp.guests_count, 'pessoa', 'pessoas')}`;

  tr.append(
    cell('guests__name', rsvp.name),
    count,
    cell('guests__status', statusSelect(rsvp)),
    cell('guests__date', formatTimestamp(rsvp.created_at)),
    cell('guests__actions', deleteButton(rsvp)),
  );
  return tr;
}

export function renderTable(body, emptyMessage, rsvps, { hasSearch }) {
  body.replaceChildren(...rsvps.map(row));
  emptyMessage.hidden = rsvps.length > 0;
  emptyMessage.textContent = hasSearch ? 'Nenhum nome encontrado.' : 'Nenhuma confirmação ainda.';
}
