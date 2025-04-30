FROM oven/bun:1.2.10

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY bun.lock ./
COPY package.json ./

COPY prisma ./prisma/
RUN bun install && \
  bunx prisma db push && \
  bunx prisma generate

COPY . .

EXPOSE 4000
CMD ["bun", "dev"]
