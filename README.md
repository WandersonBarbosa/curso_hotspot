# Hotspot SaaS — MikroTik · Atlaz · PIX

Monorepo **multiempresa** com backend Node (Express + Drizzle + BullMQ + WebSocket), frontend React (Vite + Tailwind + padrão Shadcn/Radix) e infraestrutura Docker (Postgres, Redis, Nginx, PM2).

## Requisitos

- Node.js 20+
- Docker Desktop (opcional, para stack completa)

## Desenvolvimento local

1. Copie variáveis de ambiente:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

2. Suba Postgres e Redis (exemplo com Docker):

```bash
docker run -d --name pg-hotspot -e POSTGRES_PASSWORD=hotspot -e POSTGRES_USER=hotspot -e POSTGRES_DB=hotspot -p 5432:5432 postgres:16-alpine
docker run -d --name redis-hotspot -p 6379:6379 redis:7-alpine
```

3. Instale dependências na raiz:

```bash
npm install
```

4. Gere o schema no banco (desenvolvimento):

```bash
cd apps/backend
npx drizzle-kit push
```

5. Seed (empresa demo, admin, plano, MikroTik fictício, fatura):

```bash
npm run db:seed
```

6. Rode API e UI:

```bash
# raiz
npm run dev:backend
npm run dev:frontend
```

- API: `http://localhost:4000/health`, Swagger: `http://localhost:4000/api/v1/docs`
- UI: `http://localhost:5173` (login seed: `admin@demo.local` / `admin123`)

## Docker Compose (produção-like)

Na raiz:

```bash
npm run docker:up
```

- Nginx em `http://localhost` encaminha `/api` para o backend e `/` para o frontend.
- SSL: edite `docker/nginx.conf` e monte certificados em `docker/ssl/`.

O backend inicia com **PM2** (`pm2-runtime`) e executa `drizzle-kit push` no entrypoint para criar/atualizar tabelas.

Após o primeiro `up`, rode o seed **dentro** do container backend (ou localmente apontando para o Postgres do compose):

```bash
docker compose -f docker/docker-compose.yml exec backend sh -lc "cd /repo/apps/backend && npx tsx src/db/seed.ts"
```

> Ajuste o comando conforme o shell disponível na imagem; alternativamente use `npm run db:seed` local com `DATABASE_URL` apontando para `localhost:5432`.

## Estrutura

- `apps/backend` — API REST `/api/v1`, integrações `src/integrations/{mikrotik,atlaz,payments}`, filas BullMQ, WebSocket `/ws`.
- `apps/frontend` — SPA painel SaaS (sidebar, dark mode, tabelas, toasts, skeletons).
- `packages/shared` — tipos compartilhados.
- `docker` — Compose, Nginx, Dockerfiles auxiliares.

## Segurança

Troque **todos** os segredos JWT e senhas de banco em produção. Proteja credenciais da API MikroTik (criptografia em repouso recomendada). Valide assinaturas de webhooks (PIX / Atlaz) antes de liberar acesso.

## Licença

Uso interno / projeto base — adapte contratos legais e políticas da sua operação.
