import { requestJson } from './http.js';

const LOGIN_PATH = '/admin/login';

/** Requisições do painel: sessão expirada leva de volta ao login. */
export async function adminRequest(path, options) {
  try {
    return await requestJson(path, options);
  } catch (error) {
    if (error.status === 401) {
      window.location.replace(LOGIN_PATH);
      return new Promise(() => {});
    }
    throw error;
  }
}

export const adminApi = {
  session: () => adminRequest('/api/admin/session'),
  logout: () => requestJson('/api/admin/logout', { method: 'POST' }),
  getEvent: () => requestJson('/api/event'),
  updateEvent: (event) => adminRequest('/api/event', { method: 'PUT', body: event }),
  listRsvps: () => adminRequest('/api/rsvps'),
  updateRsvp: (id, changes) => adminRequest(`/api/rsvps/${id}`, { method: 'PUT', body: changes }),
  deleteRsvp: (id) => adminRequest(`/api/rsvps/${id}`, { method: 'DELETE' }),
};
