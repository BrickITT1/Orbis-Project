FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["npx", "ts-node", "./src/server.ts"]
