# 387 Cinematic Weddings — production image.
# Single stage: install all deps (the Vite build needs devDeps like tailwindcss),
# build the SPA into dist/, then prune devDeps. Runtime is `tsx server.ts`.
FROM node:22-slim

WORKDIR /app

# libvips ships prebuilt inside sharp for linux-x64 glibc (this base is glibc),
# so no apt install is needed for image processing.

COPY package.json package-lock.json ./
RUN npm ci

# Bring in the whole project (server, src, uploads seed, sql backup, config).
COPY . .

# Build the frontend into dist/, then drop devDeps to slim the runtime.
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

# server.ts serves the built dist/ and the API; it self-inits the DB schema.
CMD ["npm", "start"]
