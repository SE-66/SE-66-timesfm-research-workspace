FROM node:24.18.0-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
USER node
CMD ["node", "src/server.mjs"]
