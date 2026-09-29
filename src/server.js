import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const staticDir = fileURLToPath(new URL('../public', import.meta.url));
const port = Number(process.env.PORT) || 3000;

createApp({ staticDir }).listen(port, () => {
  console.log(`Convite disponível em http://localhost:${port}`);
  console.log(`Painel em http://localhost:${port}/admin`);
});
