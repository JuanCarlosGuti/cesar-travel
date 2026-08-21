# syntax=docker/dockerfile:1
#
# cesar-travel es un monorepo con workspaces de npm y UN SOLO package-lock en la
# raíz. Por eso todo se instala y se construye desde la raíz: instalar por
# subcarpeta deja node_modules donde el runtime no los encuentra. Es la misma
# razón que ya estaba escrita en render.yaml, y sigue valiendo aquí.
#
# El resultado es UNA sola imagen: NestJS sirve el build de Angular desde
# backend/public (ServeStaticModule), así que no hay dos contenedores ni dos
# dominios ni CORS. Es el proyecto más simple de los cuatro del servidor.

FROM node:24-bookworm-slim AS build
WORKDIR /app

# better-sqlite3 y sharp son módulos nativos. sharp trae binarios precompilados
# para linux-x64, pero better-sqlite3 puede no tenerlos para Node 24 y cae a
# compilar con node-gyp, que necesita estas tres cosas. Si algún día
# better-sqlite3 pasa a devDependencies (solo se usa en desarrollo local), esta
# capa se puede borrar entera.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Los manifiestos primero, y el código después: así la capa de `npm ci` se
# reaprovecha en cada despliegue que no toque las dependencias.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci

COPY . .

# `npm run build` = Angular (→ backend/public) + nest build (→ backend/dist).
# El prune va ANTES del rm: npm necesita ver los workspaces para podarlos.
RUN npm run build \
 && npm prune --omit=dev \
 && rm -rf frontend backend/src backend/test .angular .git

FROM node:24-bookworm-slim AS runtime

# NODE_ENV solo aquí, nunca en la etapa de build: con NODE_ENV=production,
# `npm ci` se salta las devDependencies y no habría con qué construir.
ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
COPY --from=build --chown=node:node /app ./

# La app no escribe nada en disco — las imágenes subidas van a la base en
# base64, a propósito (ver imagen.entity.ts) — así que puede correr sin root.
USER node

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main"]
