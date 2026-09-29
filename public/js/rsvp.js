import { requestJson } from './http.js';

const LABELS = {
  idle: 'Confirmar presença',
  loading: 'Confirmando…',
  done: '✓ Presença confirmada',
};

const MESSAGES = {
  name: 'Por favor, informe seu nome completo.',
  guests: (max) => `Informe entre 1 e ${max} pessoas.`,
  tooManyRequests: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  generic: 'Não foi possível confirmar agora. Tente novamente.',
};

const SUCCESS_DELAY = 900;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function errorMessageFor(error) {
  if (error.status === 429) return MESSAGES.tooManyRequests;
  if (error.status === 400 && error.message) return error.message;
  if (error.status === 0) return error.message;
  return MESSAGES.generic;
}

export function initRsvp(form, successPanel) {
  const nameInput = form.elements.name;
  const guestsInput = form.elements.guests_count;
  const [decrement, increment] = form.querySelectorAll('[data-step]');
  const submitButton = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const message = form.querySelector('[data-form-message]');

  let maxGuests = Number(guestsInput.max) || 10;
  let isSubmitting = false;

  function readGuests() {
    return Number.parseInt(guestsInput.value, 10);
  }

  function setGuests(value) {
    const guests = clamp(Number.isNaN(value) ? 1 : value, 1, maxGuests);
    guestsInput.value = String(guests);
    decrement.disabled = guests <= 1;
    increment.disabled = guests >= maxGuests;
  }

  function showMessage(text, field) {
    message.textContent = text;
    message.hidden = false;
    field?.setAttribute('aria-invalid', 'true');
    field?.focus();
  }

  function clearMessage() {
    message.hidden = true;
    message.textContent = '';
    nameInput.removeAttribute('aria-invalid');
    guestsInput.removeAttribute('aria-invalid');
  }

  function setState(state) {
    submitLabel.textContent = LABELS[state];
    submitButton.disabled = state !== 'idle';
    submitButton.classList.toggle('is-success', state === 'done');
    form.setAttribute('aria-busy', String(state === 'loading'));
  }

  function validate() {
    const name = nameInput.value.replace(/\s+/g, ' ').trim();
    if (name.length < 2 || !/\p{L}/u.test(name)) {
      showMessage(MESSAGES.name, nameInput);
      return null;
    }

    const guests = readGuests();
    if (!Number.isInteger(guests) || guests < 1 || guests > maxGuests) {
      showMessage(MESSAGES.guests(maxGuests), guestsInput);
      return null;
    }

    return { name, guests_count: guests };
  }

  function revealSuccess() {
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus({ preventScroll: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    clearMessage();
    const payload = validate();
    if (!payload) return;

    isSubmitting = true;
    setState('loading');

    try {
      await requestJson('/api/rsvps', { method: 'POST', body: payload });
      setState('done');
      setTimeout(revealSuccess, SUCCESS_DELAY);
    } catch (error) {
      isSubmitting = false;
      setState('idle');
      showMessage(errorMessageFor(error));
    }
  }

  decrement.addEventListener('click', () => setGuests(readGuests() - 1));
  increment.addEventListener('click', () => setGuests(readGuests() + 1));
  guestsInput.addEventListener('change', () => setGuests(readGuests()));
  nameInput.addEventListener('input', () => nameInput.removeAttribute('aria-invalid'));
  form.addEventListener('submit', handleSubmit);

  setGuests(readGuests());

  return {
    setMaxGuests(value) {
      if (!Number.isInteger(value) || value < 1) return;
      maxGuests = value;
      guestsInput.max = String(value);
      setGuests(readGuests());
    },
  };
}
