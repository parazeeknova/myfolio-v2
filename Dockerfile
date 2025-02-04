FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY src/vite.config.js ./src/

RUN yarn install --frozen-lockfile

COPY src/ ./src/

RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
