import helmet from 'helmet';
import { isProduction } from '../config.js';

// Padrão do Helmet, sem `upgrade-insecure-requests`, para o convite continuar
// abrindo em http://localhost. As fontes do Google já são permitidas pelo padrão
// (`style-src` e `font-src` com https:).
const contentSecurityPolicy = {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'upgrade-insecure-requests': null,
};

const helmetMiddleware = helmet({
  contentSecurityPolicy: { directives: contentSecurityPolicy },
  strictTransportSecurity: isProduction,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xFrameOptions: { action: 'deny' },
});

export function securityHeaders(req, res, next) {
  helmetMiddleware(req, res, () => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
}

export function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}
