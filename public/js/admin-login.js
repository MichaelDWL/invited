import { requestJson } from './http.js';

const PANEL_PATH = '/admin';

const form = document.querySelector('[data-login-form]');
const errorMessage = document.querySelector('[data-login-error]');
const submitButton = document.querySelector('[data-login-submit]');

function showError(text) {
  errorMessage.textContent = text;
  errorMessage.hidden = false;
}

function messageFor(error) {
  if (error.status === 401 || error.status === 400 || error.status === 429) return error.message;
  if (error.status === 0) return error.message;
  return 'Não foi possível entrar agora. Tente novamente.';
}

async function redirectIfAuthenticated() {
  try {
    await requestJson('/api/admin/session');
    window.location.replace(PANEL_PATH);
  } catch {
    // Sem sessão: permanece no login.
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  errorMessage.hidden = true;

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email || !password) {
    showError('Informe e-mail e senha.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Entrando…';

  try {
    await requestJson('/api/admin/login', { method: 'POST', body: { email, password } });
    window.location.replace(PANEL_PATH);
  } catch (error) {
    showError(messageFor(error));
    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';
    form.elements.password.select();
  }
}

form.addEventListener('submit', handleSubmit);
redirectIfAuthenticated();
