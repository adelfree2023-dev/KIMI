# Build stage
FROM oven-sh/bun:latest AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# Production stage
FROM oven-sh/bun:latest
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 bun-group && \
    useradd -u 1001 -g bun-group -s /bin/sh bun-user

COPY --from=builder /app/apps/web /app/apps/web
COPY --from=builder /app/package.json /app/app-package.json
COPY --from=builder /app/bun.lock /app/bun.lock

RUN chown -R bun-user:bun-group /app
USER bun-user

EXPOSE 3000
CMD ["bun", "run", "apps/web/node_modules/.bin/next", "start", "apps/web"]
