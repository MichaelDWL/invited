# Convite digital de aniversário

## 1. Descrição

Site de convite de aniversário com estética "dark luxury": fundo líquido com luz âmbar, bokeh, retrato com moldura dourada fina, revelação progressiva ao rolar, contagem regressiva e confirmação de presença.

Inclui um painel administrativo (`/admin`) para alterar data, horário e local do evento, acompanhar as confirmações e exportar a lista para WhatsApp ou `.txt`.

A página pública é uma só, contada em capítulos:

1. Hero: quem está celebrando
2. O momento: idade
3. A data e a contagem regressiva
4. O local, com botão para abrir no mapa
5. Confirmação de presença
6. Mensagem final

## 2. Stack

| Camada   | Tecnologia                                    |
| -------- | --------------------------------------------- |
| Frontend | HTML5, CSS3, JavaScript puro (ES Modules)     |
| Backend  | Node.js + Express 5                           |
| Banco    | PostgreSQL via `pg` (SQL puro, sem ORM)       |
| Deploy   | Vercel (arquivos estáticos + função serverless) |

Dependências de produção: `express`, `pg` e `express-rate-limit`. Não há bundler nem etapa de build.

## 3. Estrutura

```
/
├── api/
│   └── index.js                 # Função serverless da Vercel (exporta o app Express)
├── public/                      # Servido como estático pela CDN da Vercel
│   ├── index.html               # Convite (página única)
│   ├── admin/
│   │   ├── login.html
│   │   └── index.html
│   ├── assets/
│   │   ├── images/profile.jpg   # Foto do aniversariante
│   │   └── icons/favicon.svg
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css        # Paleta, fontes, tamanho/zoom da foto
│   │   ├── ambient.css          # Camadas do fundo (bokeh, vidro, grão, vinheta)
│   │   ├── main.css             # Layout do convite
│   │   ├── animations.css       # Keyframes, revelação ao rolar, movimento reduzido
│   │   ├── noscript.css
│   │   └── admin.css
│   └── js/
│       ├── config.js            # TEXTOS DO CONVITE (nome, idade, frases)
│       ├── main.js              # Inicialização do convite
│       ├── ambient.js           # Fundo líquido (WebGL leve)
│       ├── event.js             # Carrega e exibe data/local
│       ├── countdown.js
│       ├── rsvp.js              # Formulário de confirmação
│       ├── format.js            # Datas em pt-BR (compartilhado)
│       ├── http.js              # fetch + tratamento de erros (compartilhado)
│       ├── admin.js             # Painel
│       ├── admin-api.js
│       ├── admin-table.js
│       ├── admin-export.js      # Texto para WhatsApp e .txt
│       └── admin-login.js
├── src/
│   ├── app.js                   # Monta o app Express (usado local e na Vercel)
│   ├── server.js                # Servidor local
│   ├── config.js                # Máx. de convidados, fuso do evento, sessão
│   ├── routes/                  # event, rsvp, admin
│   ├── controllers/             # event, rsvp, admin
│   ├── middleware/              # auth, rate limit, headers de segurança, erros
│   ├── lib/
│   │   ├── session.js           # Sessão assinada (HMAC) em cookie httpOnly
│   │   └── validation.js        # Validação e sanitização
│   └── database/
│       ├── connection.js
│       ├── schema.sql
│       └── init.js              # npm run db:init
├── .env.example
├── vercel.json
└── package.json
```

## 4. Instalação

Requer Node.js 20.6 ou superior.

```bash
npm install
```

## 5. Configuração do PostgreSQL

Qualquer PostgreSQL 13+ funciona. Para a Vercel, prefira um provedor gerenciado:

- [Neon](https://neon.tech): integração nativa pelo Marketplace da Vercel
- [Supabase](https://supabase.com)
- Qualquer outro provedor que ofereça uma URL `postgres://`

Em ambiente serverless, use a URL de conexão **pooled** do provedor (Neon: host com `-pooler`; Supabase: porta `6543`). Mantenha `?sslmode=require` na URL quando o provedor exigir SSL.

Localmente, o jeito mais simples é usar o Docker (`docker-compose.yml` já incluso):

```bash
npm run db:up     # sobe o PostgreSQL em 127.0.0.1:5434 e cria as tabelas
npm run db:down   # para o container (os dados ficam no volume)
```

Com o Docker, use no `.env`:

```env
DATABASE_URL=postgres://convite:convite@127.0.0.1:5434/convite
```

Sem Docker, basta ter um banco criado:

```bash
createdb convite
```

## 6. Configuração do `.env`

Copie o exemplo e preencha:

```bash
cp .env.example .env
```

| Variável         | Descrição                                                                    |
| ---------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`   | `postgres://usuario:senha@host:5432/banco`                                   |
| `ADMIN_EMAIL`    | E-mail de acesso ao painel                                                   |
| `ADMIN_PASSWORD` | Senha do painel. Fica apenas na variável de ambiente, nunca no banco         |
| `SESSION_SECRET` | Texto aleatório com **no mínimo 32 caracteres**                              |
| `NODE_ENV`       | `development` localmente, `production` na Vercel (ativa o cookie `Secure`)   |
| `PORT`           | Opcional, porta local (padrão `3000`)                                        |

Para gerar um `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Trocar `SESSION_SECRET` ou `ADMIN_EMAIL` encerra todas as sessões abertas do painel.

## 7. Execução local

```bash
npm run dev      # com recarregamento automático
# ou
npm start
```

- Convite: <http://localhost:3000>
- Painel: <http://localhost:3000/admin>

Os scripts carregam o `.env` com a flag nativa `--env-file` do Node, então o arquivo precisa existir.

## 8. Criação das tabelas

```bash
npm run db:init
```

O script executa `src/database/schema.sql`. Ele pode ser rodado mais de uma vez sem apagar dados. Também é possível colar o conteúdo de `schema.sql` no editor SQL do seu provedor.

São criadas apenas duas tabelas:

- `event_settings`: uma única linha (`id = 1`) com nome do evento, data, horário, local, endereço e link do Maps
- `rsvps`: `id`, `name`, `guests_count`, `status` (`confirmed` ou `declined`), `created_at`, `updated_at`

Não são armazenados telefone, e-mail, CPF nem qualquer outro dado pessoal além do nome. Se o mesmo nome confirmar de novo, a quantidade de pessoas é atualizada em vez de criar uma linha duplicada.

## 9. Configuração da Vercel

O `vercel.json` já está pronto:

- `public/` é servido pela CDN (`outputDirectory`), com `cleanUrls` (então `/admin/login` serve `admin/login.html`)
- Todas as rotas `/api/*` são reescritas para a função `api/index.js`, que executa o app Express
- Headers de segurança (CSP, `X-Frame-Options`, `nosniff`, etc.) aplicados a todas as rotas

Nenhum dado é gravado em disco nem na memória do processo: evento e confirmações ficam no PostgreSQL, e a sessão fica em um cookie assinado.

## 10. Banco PostgreSQL na Vercel

1. No painel da Vercel, abra o projeto e vá em **Storage → Create Database → Neon** (ou conecte um banco externo).
2. Copie a URL **pooled** para a variável `DATABASE_URL`.
3. Crie as tabelas uma vez: coloque temporariamente a URL de produção no seu `.env` local e rode `npm run db:init`. Outra opção é colar `schema.sql` no SQL Editor do provedor.

## 11. Deploy

1. Envie o projeto para um repositório Git (GitHub, GitLab ou Bitbucket).
2. Na Vercel, clique em **Add New → Project** e importe o repositório. Mantenha o preset **Other**, sem comando de build.
3. Em **Settings → Environment Variables**, cadastre `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` e `NODE_ENV=production`.
4. Faça o deploy. Depois de alterar variáveis de ambiente, é preciso um novo deploy para que elas valham.

Com a CLI:

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # produção
```

**Pré-visualização no WhatsApp:** em `public/index.html`, troque a `og:image` por uma URL absoluta do domínio final (ex.: `https://seu-dominio.vercel.app/assets/images/profile.jpg`), porque o WhatsApp não aceita caminhos relativos.

## 12. Como trocar a foto

1. Substitua `public/assets/images/profile.jpg` pela foto final, mantendo o mesmo nome. O ideal é uma imagem quadrada de cerca de 1024 × 1024 px e até 300 KB.
2. Ajuste o enquadramento em `public/css/variables.css`, se necessário:

   ```css
   --portrait-zoom: 1.08;      /* aproxima a foto dentro do círculo */
   --portrait-focus: 50% 40%;  /* posição do rosto (horizontal vertical) */
   ```

   A foto de referência já traz um aro dourado próprio. O zoom de `1.08` corta esse aro para não duplicar a moldura. Com uma foto sem aro, use `1`.

A foto não é alterada: o recorte circular, a borda, o brilho e a vinheta são aplicados via CSS.

## 13. Como trocar os textos

**Nome, idade e frases:** edite `public/js/config.js`.

```js
celebrant: {
  name: '[NOME DO ANIVERSARIANTE]',
  age: '[IDADE]',
  photoAlt: 'Foto de [NOME DO ANIVERSARIANTE]',
},
texts: {
  eyebrow: 'Você é meu convidado',
  tagline: 'Uma noite para celebrar.',
  momentTitle: 'Um novo capítulo.',
  ...
}
```

**Data, horário, local, endereço e link do Maps:** pelo painel `/admin`. Esses dados vêm do banco e nunca ficam fixos no HTML.

- Sem link do Maps, o botão "Abrir no mapa" pesquisa `nome do local + endereço` no Google Maps.
- No endereço, use uma quebra de linha para separar rua e cidade.

**Outros ajustes** (em `src/config.js`):

- `RSVP_MAX_GUESTS`: máximo de pessoas por confirmação (padrão `10`). O formulário público lê esse valor da API.
- `EVENT_UTC_OFFSET`: fuso do local do evento (padrão `-03:00`, horário de Brasília). A contagem regressiva usa esse fuso, então funciona para convidados em qualquer lugar.

**Título da aba e pré-visualização:** as metatags em `public/index.html`. O título da aba passa a ser o nome do evento assim que os dados carregam.

## 14. Como acessar o admin

1. Acesse `/admin`. Sem sessão ativa, você é redirecionado para `/admin/login`.
2. Entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
3. A sessão dura 8 horas e usa um cookie `httpOnly`, `SameSite=Strict` e `Secure` (em produção), restrito a `/api`.

No painel você pode:

- ver data, total de confirmações e total de pessoas (só status "confirmado")
- editar nome do evento, data, horário, local, endereço e link do Google Maps
- buscar convidados por nome (a busca ignora acentos)
- alterar o status de uma confirmação ou excluí-la (com diálogo de confirmação)
- **Copiar lista para WhatsApp**: texto com *negrito*, emojis e totais, pronto para colar
- **Baixar lista .txt**: mesma lista, sem marcação

---

### API

| Método | Rota                  | Acesso  | Descrição                                   |
| ------ | --------------------- | ------- | ------------------------------------------- |
| GET    | `/api/event`          | Público | Dados do evento + `starts_at` + `max_guests` |
| PUT    | `/api/event`          | Admin   | Atualiza o evento                           |
| POST   | `/api/rsvps`          | Público | Confirma presença (limitado por IP)         |
| GET    | `/api/rsvps`          | Admin   | Lista confirmações (mais recentes primeiro) |
| PUT    | `/api/rsvps/:id`      | Admin   | Altera nome, quantidade ou status           |
| DELETE | `/api/rsvps/:id`      | Admin   | Exclui confirmação                          |
| POST   | `/api/admin/login`    | Público | Login (limitado por IP)                     |
| POST   | `/api/admin/logout`   | Público | Encerra a sessão                            |
| GET    | `/api/admin/session`  | Admin   | Verifica a sessão                           |

### Segurança

- Validação e sanitização no servidor: remoção de caracteres de controle e `<` `>`, limites de tamanho, inteiros dentro da faixa, datas reais e links do Maps obrigatoriamente `https://`
- Consultas SQL sempre parametrizadas
- Senha comparada em tempo constante; nunca é gravada nem devolvida
- Rotas de escrita e de leitura das confirmações exigem sessão
- Rate limit: 20 confirmações e 10 tentativas de login a cada 15 minutos por IP. Na Vercel, o contador é mantido por instância da função, o que basta como proteção contra spam casual.
- Erros internos aparecem só no log do servidor; o cliente recebe mensagens genéricas, sem stack trace
- Corpo JSON limitado a 10 KB
- As páginas do admin só mostram dados vindos da API protegida. O HTML delas é público, mas vazio.
