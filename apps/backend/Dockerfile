# Contexto de build: raiz do monorepo (..)
FROM node:20-bookworm AS build
WORKDIR /repo
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm install
COPY packages/shared packages/shared
COPY apps/backend apps/backend
COPY docker docker
RUN npm run build -w @hotspot/shared && npm run build -w @hotspot/backend

FROM node:20-bookworm-slim AS runner
RUN apt-get update && apt-get install -y postgresql-client ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /repo/apps/backend
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/packages /repo/packages
COPY --from=build /repo/apps/backend /repo/apps/backend
COPY --from=build /repo/docker /repo/docker
RUN npm install -g pm2
RUN chmod +x /repo/docker/entrypoint-backend.sh
ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["/repo/docker/entrypoint-backend.sh"]
