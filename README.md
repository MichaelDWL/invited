# Convite digital de aniversário

Convite de uma página, com confirmação de presença e um painel para quem organiza o evento.

## Preview

Espaço para as capturas de tela. Quando os arquivos existirem, descomente:

<!--
![Página do convite](docs/preview-convite.png)
![Painel administrativo](docs/preview-admin.png)
-->

- `docs/preview-convite.png` — página do convite
- `docs/preview-admin.png` — painel administrativo

## Sobre

O projeto é um convite digital de aniversário. A pessoa convidada vê quem celebra, a contagem regressiva, o local e um link para o mapa, e confirma quantas pessoas vão. Quem organiza altera data, horário e local, acompanha a lista e copia os confirmados para o WhatsApp.

Não há cadastro de usuários. O painel usa um único acesso administrativo, definido por variáveis de ambiente.

## Funcionalidades

- convite digital
- countdown
- localização
- Google Maps
- confirmação de presença
- painel administrativo
- alteração de informações do evento
- lista de convidados
- exportação para WhatsApp

## Stack

Frontend:

- HTML
- CSS
- JavaScript

Backend:

- Node.js
- Express

Database:

- PostgreSQL, hospedado no Supabase

Deploy:

- Vercel

As consultas usam o driver `pg`, com SQL direto. Não há ORM, nem cliente JS do Supabase, nem etapa de build.

## Arquitetura

```
Browser
   │
   ▼
Vercel
├── Frontend estático (public/)
│
└── API / Express (api/index.js → /api/*)
        │
        ▼
    Supabase
    PostgreSQL
```

- **Browser:** HTML, CSS e JavaScript sem framework. Todas as chamadas vão para `/api/...` na mesma origem, então não há CORS.
- **Frontend estático:** a Vercel publica `public/` direto na CDN. `/` entrega `index.html`, `/admin` entrega `admin/index.html` e `/admin/login` entrega `admin/login.html`.
- **API / Express:** `api/index.js` exporta o app Express, sem `app.listen`, e a Vercel o executa como função serverless. O `vercel.json` encaminha todo `/api/*` para essa função. Nada é guardado em memória ou em disco: os dados ficam no banco e a sessão do admin fica num cookie assinado.
- **Supabase PostgreSQL:** guarda as tabelas `event_settings` e `rsvps`. O backend conecta pelo pooler do Supabase usando `DATABASE_URL`.

Localmente, `src/server.js` sobe o mesmo app com `app.listen` e também serve `public/`.

## Estrutura

```
/
├── api/
│   └── index.js                  # App Express na Vercel
├── public/
│   ├── index.html                # Convite
│   ├── admin/
│   │   ├── index.html            # Painel
│   │   └── login.html
│   ├── assets/
│   │   ├── icons/favicon.svg
│   │   └── images/profile.jpg
│   ├── css/
│   └── js/
├── src/
│   ├── app.js
│   ├── server.js                 # Servidor local
│   ├── config.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── lib/
│   └── database/
│       ├── connection.js
│       ├── schema.sql
│       └── init.js
├── .env.example
├── docker-compose.yml
├── vercel.json
└── package.json
```

## Desenvolvimento local

Requer Node.js 24. É a versão fixada em `engines`, a mesma que a Vercel usa.

1. Clone e instale:

   ```bash
   git clone <url-do-repositorio>
   cd invited
   npm install
   ```

2. Crie o `.env` a partir do modelo:

   ```bash
   cp .env.example .env
   ```

   No PowerShell, use `Copy-Item .env.example .env`.

3. Configure `DATABASE_URL` com uma das opções:

   - **Supabase:** a mesma URL de produção ou a de outro projeto Supabase, só para desenvolvimento. Veja [Deploy → Supabase](#1-supabase).
   - **PostgreSQL local com Docker:** rode `npm run db:up` e use `postgres://convite:convite@127.0.0.1:5434/convite`. O compose já aplica o schema na primeira inicialização do volume. `npm run db:down` para o container sem perder os dados.

   Preencha também `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` e `NODE_ENV=development`.

4. Crie as tabelas, se ainda não existirem:

   ```bash
   npm run db:init
   ```

   O comando executa `src/database/schema.sql` e pode ser repetido sem apagar dados. No Supabase, também dá para colar esse arquivo no SQL Editor.

5. Suba o servidor:

   ```bash
   npm run dev
   ```

   - Convite: http://localhost:3000
   - Painel: http://localhost:3000/admin
   - Health check: http://localhost:3000/api/health

`npm run dev` reinicia ao salvar arquivos. `npm start` sobe o mesmo servidor sem recarregar.

## Desenvolvimento × produção

| | Desenvolvimento | Produção |
| --- | --- | --- |
| Servidor | Node local (`src/server.js`, `app.listen`) | Função serverless da Vercel (`api/index.js`) |
| Frontend | servido pelo próprio Express | CDN da Vercel |
| Banco | Supabase ou PostgreSQL no Docker | Supabase PostgreSQL |
| Variáveis | arquivo `.env` | Vercel → Project Settings → Environment Variables |
| `NODE_ENV` | `development` | `production` (cookie de sessão com `Secure`) |

O código da API é o mesmo nos dois casos: `src/app.js`.

## Variáveis de ambiente

O arquivo `.env` não entra no Git. O modelo versionado é o `.env.example`, sem credenciais.

- **Local:** arquivo `.env` na raiz, lido com `node --env-file=.env`.
- **Vercel:** Project Settings → Environment Variables, marcadas pelo menos para **Production**. Marque **Preview** também se for usar deploys de preview.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL de conexão do PostgreSQL. Na Vercel, a do Transaction pooler do Supabase |
| `ADMIN_EMAIL` | E-mail do painel |
| `ADMIN_PASSWORD` | Senha do painel. Fica só no ambiente, não no código e não no banco |
| `SESSION_SECRET` | Segredo para assinar a sessão. Use pelo menos 32 caracteres aleatórios |
| `NODE_ENV` | `development` no ambiente local e `production` na Vercel |
| `PORT` | Opcional, só local. Padrão `3000` |

Trocar `SESSION_SECRET` desconecta quem estiver logado no painel.

Exemplo de geração do segredo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Banco de dados

Há duas tabelas:

- `event_settings`: uma linha (`id = 1`) com nome do evento, data, horário, local, endereço e link do mapa
- `rsvps`: confirmações, com `id`, `name`, `guests_count` (de 1 a 20), `status` (`confirmed` ou `declined`), `created_at` e `updated_at`

O mesmo nome não gera duas linhas. Um novo envio atualiza a quantidade de pessoas.

O schema está em `src/database/schema.sql`. Ele usa `CREATE TABLE IF NOT EXISTS` e `ON CONFLICT DO NOTHING`, não tem `DROP TABLE` e pode ser executado mais de uma vez. Ele também liga o Row Level Security nas duas tabelas. Sem políticas, isso bloqueia o acesso pela Data API do Supabase (`anon` e `authenticated`). O backend conecta como dono das tabelas e continua lendo e gravando normalmente.

### Conexão

`src/database/connection.js` cria um único `Pool` do `pg` por instância, reaproveitado entre as invocações da função. O pool abre no máximo 3 conexões e fecha as ociosas depois de 10 segundos. Nenhum controller abre conexão própria.

Para hosts remotos, a conexão usa TLS sem verificar a CA, porque o Supabase assina os certificados com uma CA própria. Para `localhost` e `127.0.0.1`, usa conexão sem TLS. Um `?sslmode=...` na URL é respeitado só para ligar ou desligar o TLS: `disable` desliga, qualquer outro valor liga.

### Fuso horário

O evento acontece no horário de Brasília (UTC−3, sem horário de verão desde 2019):

- `event_date` (`DATE`) e `event_time` (`TIME`) são guardados sem fuso, exatamente como foram digitados no painel. O banco devolve os valores como texto (`to_char`), então o fuso do PostgreSQL e o da Vercel, ambos UTC, não interferem.
- A API monta `starts_at` juntando data, hora e o offset fixo `EVENT_UTC_OFFSET = '-03:00'` (`src/config.js`), por exemplo `2026-10-24T20:00:00-03:00`. A contagem regressiva usa esse instante e fica correta em qualquer fuso do navegador.
- `created_at` e `updated_at` são `TIMESTAMPTZ`, gravados pelo `NOW()` do banco e retornados em ISO UTC. O painel os exibe em `America/Sao_Paulo`.
- A data do evento na página é formatada a partir do texto `YYYY-MM-DD`, sem conversão de fuso.

Para um evento em outro fuso, altere `EVENT_UTC_OFFSET` em `src/config.js` e `EVENT_TIME_ZONE` em `public/js/format.js`.

## API

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | `{ "status": "ok", "environment": "production" }`, sem consultar o banco |
| GET | `/api/event` | Público | Dados do evento, início em ISO e máximo de pessoas |
| PUT | `/api/event` | Admin | Atualiza o evento |
| POST | `/api/rsvps` | Público | Confirma presença |
| GET | `/api/rsvps` | Admin | Lista as confirmações |
| PUT | `/api/rsvps/:id` | Admin | Altera nome, quantidade ou status |
| DELETE | `/api/rsvps/:id` | Admin | Exclui uma confirmação |
| POST | `/api/admin/login` | Público | Inicia a sessão |
| POST | `/api/admin/logout` | Público | Encerra a sessão |
| GET | `/api/admin/session` | Admin | Informa se a sessão é válida |

Dados inválidos no RSVP ou no evento respondem `400`. Rotas de admin sem sessão respondem `401`.

## Segurança básica

O que está implementado:

- variáveis de ambiente para banco, acesso do painel e segredo da sessão
- `.env` fora do Git
- queries parametrizadas (`$1`, `$2`, …) para valores vindos do usuário
- validação de `name` e `guests_count` no servidor
- nome exibido com `textContent`; o servidor também remove `<` e `>` dos textos
- rotas administrativas protegidas por sessão assinada (cookie `httpOnly`, `SameSite=Strict`, `Secure` em produção)
- Helmet com a configuração padrão, sem `upgrade-insecure-requests`, para não quebrar o uso local em HTTP
- rate limiting no login (10 pedidos a cada 15 minutos) e na confirmação de presença (20 pedidos a cada 15 minutos)
- erros internos respondidos com uma mensagem genérica, sem stack trace nem dados de conexão

O contador do rate limit fica na memória de cada processo. Na Vercel, cada instância da função conta separadamente.

## Deploy

### 1. Supabase

1. Em [supabase.com](https://supabase.com), crie um projeto. Guarde a senha do banco definida nesse momento. Em **Region**, escolha **South America (São Paulo)**, a mesma região das funções na Vercel (veja o passo 2).
2. Abra **SQL Editor → New query**, cole o conteúdo de `src/database/schema.sql` e clique em **Run**. O editor pode pedir confirmação por causa do `DROP CONSTRAINT IF EXISTS`. Esse comando só recria a regra de 1 a 20 pessoas e não apaga dados.
3. Confira em **Table Editor** que `event_settings` (com uma linha) e `rsvps` foram criadas.
4. Clique em **Connect**, no topo do projeto, e copie a connection string do **Transaction pooler** (porta `6543`). Ela tem este formato:

   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@<host-do-pooler>.pooler.supabase.com:6543/postgres
   ```

   Troque `[YOUR-PASSWORD]` pela senha do banco. Se a senha tiver caracteres como `@`, `:`, `/` ou `#`, codifique-os na URL (por exemplo, `@` vira `%40`).

Na Vercel, use o **Transaction pooler**:

- A conexão direta (`db.<project-ref>.supabase.co:5432`) só funciona por IPv6 no plano padrão, e as funções da Vercel não conectam por IPv6.
- Funções serverless abrem e fecham muitas conexões curtas. No modo transaction, o pooler do Supabase divide poucas conexões reais entre elas.

O backend não usa prepared statements nomeados, que o modo transaction não suporta.

### 2. Vercel

1. Envie o repositório para o GitHub. O `.env` fica de fora pelo `.gitignore`.
2. Na Vercel, clique em **Add New → Project** e importe o repositório.
3. Deixe **Framework Preset** como **Other**, **Build Command** vazio e **Root Directory** na raiz. O `vercel.json` já define:
   - `outputDirectory: "public"`: publica o frontend estático;
   - `rewrites`: `/api/*` → `api/index.js`, o app Express;
   - `cleanUrls`: `/admin` e `/admin/login` sem `.html`;
   - `regions: ["gru1"]`: a função roda em São Paulo, perto do banco. Se o Supabase estiver em outra região, troque pelo [código da região da Vercel](https://vercel.com/docs/regions) mais próxima;
   - cabeçalhos de segurança (CSP e outros) para os arquivos estáticos.
4. Em **Environment Variables**, cadastre as variáveis da seção abaixo antes do primeiro deploy.
5. Clique em **Deploy**. A versão do Node vem de `engines` no `package.json` (`24.x`).

Depois de alterar uma variável, faça um **Redeploy** para ela passar a valer.

### 3. Variáveis

| Variável | Valor na Vercel |
| --- | --- |
| `DATABASE_URL` | URL do Transaction pooler do Supabase, já com a senha |
| `ADMIN_EMAIL` | E-mail de acesso ao painel |
| `ADMIN_PASSWORD` | Senha forte de acesso ao painel |
| `SESSION_SECRET` | 32 ou mais caracteres aleatórios (veja o comando em [Variáveis de ambiente](#variáveis-de-ambiente)) |
| `NODE_ENV` | `production` |

Nenhuma delas é enviada ao navegador. Só a função da API as lê.

### 4. Teste

Depois do deploy, na URL do projeto:

1. `/api/health` responde `{"status":"ok","environment":"production"}`.
2. `/` abre o convite com foto, data, contagem regressiva e local, e o botão do mapa abre o link.
3. Confirme presença pelo formulário e veja a mensagem de sucesso.
4. `/admin` redireciona para `/admin/login`. Entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
5. A confirmação do passo 3 aparece na lista e nos totais.
6. Altere data, horário ou local no painel, salve e recarregue `/`: o convite mostra os novos dados.
7. Use **Copiar lista para WhatsApp** e **Baixar lista .txt**.
8. No Supabase, em **Table Editor → rsvps**, o registro está lá. Isso confirma a persistência.
9. Exclua a confirmação de teste pelo painel.

### Checklist

- [ ] Supabase criado
- [ ] schema executado
- [ ] DATABASE_URL configurada
- [ ] ADMIN_EMAIL configurado
- [ ] ADMIN_PASSWORD configurado
- [ ] SESSION_SECRET configurado
- [ ] .env não está no Git
- [ ] Vercel configurada
- [ ] Deploy realizado
- [ ] Página pública funcionando
- [ ] Countdown funcionando
- [ ] RSVP funcionando
- [ ] Registro aparecendo no banco
- [ ] Admin funcionando
- [ ] Alteração de evento funcionando
- [ ] Exportação funcionando

### Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| API responde 500 e o log da função mostra `ENOTFOUND` ou `ENETUNREACH` | `DATABASE_URL` usa a conexão direta (IPv6). Use o Transaction pooler |
| `password authentication failed` | Senha errada ou com caracteres especiais sem codificar na URL |
| Login do admin responde 500 | `ADMIN_EMAIL`, `ADMIN_PASSWORD` ou `SESSION_SECRET` ausente, ou `SESSION_SECRET` com menos de 32 caracteres |
| Variável alterada não tem efeito | Falta um Redeploy |

## Melhorias futuras

- múltiplos eventos
- múltiplos administradores
- testes automatizados
- integração com WhatsApp
- lembretes automáticos

## O que este projeto demonstra

- desenvolvimento frontend com JavaScript vanilla
- criação de API REST
- integração com PostgreSQL
- autenticação administrativa
- validação de dados
- integração com serviço externo de mapas
- deploy em ambiente serverless
- preocupação com segurança básica
- documentação de projeto
