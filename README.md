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

- PostgreSQL

Deploy:

- Vercel

As consultas usam o driver `pg`, com SQL direto. Não há ORM nem etapa de build.

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

## Como executar

Requer Node.js 20.6 ou superior.

```bash
git clone <url-do-repositorio>
cd invited
npm install
```

Suba um PostgreSQL local com Docker:

```bash
npm run db:up
```

O compose publica o banco em `127.0.0.1:5434` e aplica `src/database/schema.sql` na primeira inicialização do volume.

Sem Docker, crie um banco vazio e rode as tabelas depois de configurar o `.env`:

```bash
npm run db:init
```

Esse comando pode ser executado de novo. Ele cria o que falta e ajusta o limite de pessoas por confirmação.

Copie as variáveis de ambiente e preencha com os seus valores:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Para o Postgres do Docker, `DATABASE_URL` aponta para `127.0.0.1:5434`, com o usuário, a senha e o banco definidos em `docker-compose.yml`.

```bash
npm run dev
```

- Convite: http://localhost:3000
- Painel: http://localhost:3000/admin

`npm start` sobe o mesmo servidor sem recarregar ao salvar arquivos.

## Variáveis de ambiente

O arquivo `.env` não entra no Git. O modelo versionado é o `.env.example`, sem credenciais.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL de conexão do PostgreSQL |
| `ADMIN_EMAIL` | E-mail do painel |
| `ADMIN_PASSWORD` | Senha do painel. Fica só no ambiente, não no código e não no banco |
| `SESSION_SECRET` | Segredo para assinar a sessão. Use pelo menos 32 caracteres aleatórios |

`NODE_ENV=development` no ambiente local e `NODE_ENV=production` na Vercel. `PORT` é opcional e vale `3000` se não for informada.

Exemplo de geração do segredo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Banco de dados

Há duas tabelas:

- `event_settings`: uma linha (`id = 1`) com nome do evento, data, horário, local, endereço e link do mapa
- `rsvps`: confirmações, com `id`, `name`, `guests_count` (de 1 a 20), `status` (`confirmed` ou `declined`), `created_at` e `updated_at`

O mesmo nome não gera duas linhas. Um novo envio atualiza a quantidade de pessoas.

## API

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
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

O `vercel.json` publica `public/` como site estático e encaminha `/api` para `api/index.js`.

1. Envie o repositório para o GitHub.
2. Na Vercel, importe o projeto. Não há comando de build.
3. Em **Settings → Environment Variables**, cadastre `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` e `NODE_ENV` com o valor `production`.
4. Faça o deploy. Depois de mudar uma variável, publique de novo para ela passar a valer.
5. Crie as tabelas uma vez, com `npm run db:init` apontando para o banco de produção, ou executando `src/database/schema.sql` no painel do provedor.

Use a URL pooled do PostgreSQL quando o provedor oferecer uma.

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
