export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function requestJson(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new HttpError('Sem conexão. Verifique sua internet e tente novamente.', 0);
  }

  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(typeof data.error === 'string' ? data.error : '', response.status);
  }
  return data;
}
