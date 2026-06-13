FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm turbo run build --filter=@chapterai/api \
  && test -f apps/api/dist/server.js

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["node", "apps/api/dist/server.js"]
