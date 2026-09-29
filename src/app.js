import express from 'express';
import eventRoutes from './routes/event.routes.js';
import rsvpRoutes from './routes/rsvp.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { securityHeaders, noStore } from './middleware/security.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

/**
 * Na Vercel, os arquivos de /public são servidos pela CDN e este app atende apenas /api.
 * Localmente, `staticDir` faz o Express servir também o frontend.
 */
export function createApp({ staticDir } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);

  app.use('/api', noStore, express.json({ limit: '10kb' }));
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development' });
  });
  app.use('/api/event', eventRoutes);
  app.use('/api/rsvps', rsvpRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFound);

  if (staticDir) {
    app.use(express.static(staticDir, { extensions: ['html'] }));
  }

  app.use(errorHandler);
  return app;
}
