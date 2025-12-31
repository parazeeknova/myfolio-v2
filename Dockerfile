FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lockb ./
COPY src/vite.config.js ./src/

RUN bun install

COPY src/ ./src/

RUN bun run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
