import { adminApi } from './admin-api.js';
import { buildGuestList, copyToClipboard, downloadText, summarize } from './admin-export.js';
import { filterByName, renderTable } from './admin-table.js';
import { describeDate } from './format.js';

const SETTINGS_FIELDS = ['event_name', 'event_date', 'event_time', 'location_name', 'location_address', 'maps_url'];

const state = {
  event: null,
  rsvps: [],
  search: '',
};

const ui = {
  shell: document.querySelector('[data-admin-shell]'),
  eventName: document.querySelector('[data-admin-event-name]'),
  stat: (name) => document.querySelector(`[data-stat="${name}"]`),
  settingsForm: document.querySelector('[data-settings-form]'),
  settingsStatus: document.querySelector('[data-settings-status]'),
  settingsSubmit: document.querySelector('[data-settings-submit]'),
  search: document.querySelector('[data-search]'),
  tableBody: document.querySelector('[data-guests-body]'),
  empty: document.querySelector('[data-empty]'),
  deleteDialog: document.querySelector('[data-delete-dialog]'),
  deleteName: document.querySelector('[data-delete-name]'),
  toast: document.querySelector('[data-toast]'),
};

let toastTimer;

function toast(message, { error = false } = {}) {
  ui.toast.textContent = message;
  ui.toast.classList.toggle('is-error', error);
  ui.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('is-visible'), 3200);
}

function friendlyError(error, fallback) {
  return error.status === 400 || error.status === 409 || error.status === 0 ? error.message || fallback : fallback;
}

/* Resumo ------------------------------------------------------------------ */

function renderEventSummary() {
  const { event } = state;
  if (!event) return;

  const date = describeDate(event.event_date);
  ui.eventName.textContent = event.event_name;
  ui.stat('day-month').textContent = `${date.dayPadded} ${date.monthShort}`;
  ui.stat('year').textContent = date.year;
  ui.stat('time').textContent = event.event_time;
}

function renderCounters() {
  const { confirmations, people } = summarize(state.rsvps);
  ui.stat('confirmations').textContent = String(confirmations);
  ui.stat('people').textContent = String(people);
}

function renderGuests() {
  const visible = filterByName(state.rsvps, state.search);
  renderTable(ui.tableBody, ui.empty, visible, { hasSearch: Boolean(state.search.trim()) });
  renderCounters();
}

/* Configurações ------------------------------------------------------------ */

function fillSettingsForm() {
  if (!state.event) return;
  for (const field of SETTINGS_FIELDS) {
    ui.settingsForm.elements[field].value = state.event[field] ?? '';
  }
}

function readSettingsForm() {
  return Object.fromEntries(SETTINGS_FIELDS.map((field) => [field, ui.settingsForm.elements[field].value]));
}

function setSettingsStatus(message, type = '') {
  ui.settingsStatus.textContent = message;
  ui.settingsStatus.className = `settings__status${type ? ` is-${type}` : ''}`;
}

async function handleSettingsSubmit(event) {
  event.preventDefault();
  if (!ui.settingsForm.reportValidity()) return;

  ui.settingsSubmit.disabled = true;
  setSettingsStatus('Salvando…');

  try {
    const { event: saved } = await adminApi.updateEvent(readSettingsForm());
    state.event = saved;
    fillSettingsForm();
    renderEventSummary();
    setSettingsStatus('Alterações salvas.', 'success');
  } catch (error) {
    setSettingsStatus(friendlyError(error, 'Não foi possível salvar. Tente novamente.'), 'error');
  } finally {
    ui.settingsSubmit.disabled = false;
  }
}

/* Confirmações --------------------------------------------------------------- */

function findRsvp(element) {
  const id = Number(element.closest('tr')?.dataset.id);
  return state.rsvps.find((rsvp) => rsvp.id === id);
}

async function changeStatus(select) {
  const rsvp = findRsvp(select);
  if (!rsvp) return;

  select.disabled = true;
  try {
    const { rsvp: updated } = await adminApi.updateRsvp(rsvp.id, { status: select.value });
    Object.assign(rsvp, updated);
    toast('Status atualizado.');
  } catch (error) {
    toast(friendlyError(error, 'Não foi possível atualizar.'), { error: true });
  } finally {
    renderGuests();
  }
}

function confirmDeletion(rsvp) {
  return new Promise((resolve) => {
    ui.deleteName.textContent = rsvp.name;
    ui.deleteDialog.returnValue = '';
    ui.deleteDialog.addEventListener('close', () => resolve(ui.deleteDialog.returnValue === 'confirm'), { once: true });
    ui.deleteDialog.showModal();
  });
}

async function removeRsvp(button) {
  const rsvp = findRsvp(button);
  if (!rsvp || !(await confirmDeletion(rsvp))) return;

  try {
    await adminApi.deleteRsvp(rsvp.id);
    state.rsvps = state.rsvps.filter((item) => item.id !== rsvp.id);
    renderGuests();
    toast('Confirmação excluída.');
  } catch (error) {
    toast(friendlyError(error, 'Não foi possível excluir.'), { error: true });
  }
}

/* Exportação ------------------------------------------------------------------ */

async function copyWhatsAppList() {
  try {
    await copyToClipboard(buildGuestList(state.event, state.rsvps, { whatsapp: true }));
    toast('Lista copiada. Agora é só colar no WhatsApp.');
  } catch {
    toast('Não foi possível copiar. Use o botão de baixar .txt.', { error: true });
  }
}

function downloadTxtList() {
  const today = new Date().toISOString().slice(0, 10);
  downloadText(buildGuestList(state.event, state.rsvps, { whatsapp: false }), `confirmacoes-${today}.txt`);
}

/* Inicialização -------------------------------------------------------------- */

async function logout() {
  try {
    await adminApi.logout();
  } finally {
    window.location.replace('/admin/login');
  }
}

function bindEvents() {
  ui.settingsForm.addEventListener('submit', handleSettingsSubmit);
  ui.search.addEventListener('input', () => {
    state.search = ui.search.value;
    renderGuests();
  });
  ui.tableBody.addEventListener('change', (event) => {
    if (event.target.dataset.action === 'status') changeStatus(event.target);
  });
  ui.tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (button) removeRsvp(button);
  });
  document.querySelector('[data-copy-whatsapp]').addEventListener('click', copyWhatsAppList);
  document.querySelector('[data-download-txt]').addEventListener('click', downloadTxtList);
  document.querySelector('[data-logout]').addEventListener('click', logout);
}

async function loadEvent() {
  try {
    const { event } = await adminApi.getEvent();
    state.event = event;
  } catch {
    setSettingsStatus('Evento ainda não configurado. Preencha e salve.', 'error');
  }
}

async function init() {
  await adminApi.session();
  ui.shell.hidden = false;
  bindEvents();

  const [, { rsvps }] = await Promise.all([loadEvent(), adminApi.listRsvps()]);
  state.rsvps = rsvps;

  fillSettingsForm();
  renderEventSummary();
  renderGuests();
}

init().catch(() => {
  ui.shell.hidden = false;
  toast('Não foi possível carregar o painel. Recarregue a página.', { error: true });
});
