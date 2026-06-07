FROM node:20-alpine

WORKDIR /app

# netcat para el healthcheck de la DB en el entrypoint
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN chmod +x entrypoint.sh entrypoint.dev.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
