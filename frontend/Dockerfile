FROM node:16-alpine
WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend/ .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "dev"]