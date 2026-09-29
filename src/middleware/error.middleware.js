export function notFound(req, res) {
  res.status(404).json({ error: 'Recurso não encontrado.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.expose && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Requisição inválida.' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Conteúdo muito grande.' });
  }

  console.error('[erro]', err.message);
  return res.status(500).json({ error: 'Não foi possível concluir a solicitação.' });
}
