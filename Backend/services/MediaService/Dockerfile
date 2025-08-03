FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 python3-pip make g++ pkg-config ninja-build meson curl git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
