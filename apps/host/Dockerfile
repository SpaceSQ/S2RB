FROM node:22-bookworm-slim
WORKDIR /opt/s2rb
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
COPY packages/mcp/package.json ./packages/mcp/
COPY packages/did/package.json ./packages/did/
WORKDIR /opt/s2rb/apps/web
RUN npm ci || npm install
WORKDIR /opt/s2rb
COPY apps/web ./apps/web
COPY packages/mcp ./packages/mcp
COPY packages/did ./packages/did
WORKDIR /opt/s2rb/apps/web
RUN npm run build
EXPOSE 3100
CMD ["npx", "next", "start", "-p", "3100"]
