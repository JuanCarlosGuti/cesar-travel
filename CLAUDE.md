# Cesar Travel — contexto para sesiones de IA

Plataforma de alojamientos del Cesar y La Guajira. Monolito **NestJS + Angular** en un
monorepo con npm workspaces. Usuario: desarrollador con experiencia en TypeScript/Angular.

## Por qué existe esta versión

Es la reescritura como monolito de un proyecto que también existe **en microservicios**
(Java 25 / Spring Boot 4: 6 servicios + MySQL + React, repo `digital_booking`). Aquella
versión se conserva intacta como pieza de arquitectura para un despliegue con infraestructura
propia; esta se hizo para poder publicarla en hosting gratuito (Render), donde 6 servicios
Java + MySQL no entran. **Misma funcionalidad, mismo catálogo, misma identidad visual.**

## Stack y decisiones

- Backend NestJS 11 + TypeORM. **Una configuración, dos motores**: `DATABASE_URL` definida →
  Postgres (producción); sin ella → SQLite en archivo (desarrollo sin instalar nada).
- `synchronize: true` a propósito (app de demostración, sin migraciones). Con datos reales:
  apagarlo y migrar.
- **Las imágenes subidas se guardan en la base como base64**, no en disco: el filesystem de
  los planes gratuitos es efímero y se perderían en cada despliegue. Texto base64 y no
  binario porque `bytea` (Postgres) y `blob` (SQLite) no son intercambiables.
- El seed corre al arrancar **solo si la base está vacía** (`SeedService`), así que es seguro
  en cada despliegue. Los datos de demo viven en `src/database/datos-demo.ts`.
- Frontend Angular 20 **standalone + signals**, rutas con `loadComponent` (lazy), `@if`/`@for`
  (nunca `*ngIf`/`*ngFor`), `input()`/`output()` como funciones, OnPush.
- El backend sirve el build de Angular con `ServeStaticModule` (un proceso, un puerto). En
  desarrollo, `ng serve` usa `frontend/proxy.conf.json` para llegar al backend.
- Estilos: variables de marca en `frontend/src/styles/_tokens.scss`, se importan con
  `@use 'tokens' as *;` (hay `stylePreprocessorOptions.includePaths` configurado, así que
  funciona desde cualquier profundidad). Nunca `@import` de Sass (deprecado).

## Identidad visual (aprobada, no rediseñar)

Paleta Cesar/Guajira: Cañaguate `#f0a600` (dorado, primario), Caribe `#0e7b78` (teal),
Guajira `#c1502e` (terracota, acentos), Noche `#16283f` (navbar/footer/texto), Arena
`#fbf2de` (fondo), Sierra `#2e6b4f`. Tipografía: Poppins para interfaz, stack serif
(`$fontSerif`) para el nombre de la marca y los títulos. Logo: árbol de cañaguate
(`comun/canaguate-mark`).

## Reglas de negocio (portadas de la versión original)

- **Reservas**: rango semiabierto `[entrada, salida)` — dos reservas se solapan si cada una
  empieza antes de que termine la otra; se puede entrar el mismo día que otro se va. Solapar
  responde 409. La validación no es a prueba de concurrencia (aceptable a este volumen).
- **Reseñas**: solo quien tuvo una reserva con `salida <= hoy` en esa propiedad (403 si no), y
  una sola por usuario y propiedad (409). El promedio de las tarjetas se pide en lote
  (`/api/resenas/resumen?propiedadIds=1,2,3`) para no hacer N+1.
- **Ocupantes** (`/api/reservas/propiedad/:id`): identifica a los huéspedes, así que es solo
  para el dueño de la propiedad o un admin (403 al resto). La disponibilidad
  (`/api/reservas/disponibilidad/:id`) es pública pero solo devuelve fechas, sin identidad.
- **Propiedades**: el dueño sale siempre del JWT, nunca del body. Editar una propiedad **no**
  toca su galería (las imágenes tienen sus propios endpoints).
- **Chat**: una conversación por (propiedad, huésped); el dueño se resuelve desde la
  propiedad. Todos los endpoints validan participación (403 a terceros). El frontend
  actualiza por sondeo (hilo ~4 s, contador del header ~20 s), no WebSocket.

## Secretos

Nada de credenciales en el código: el repositorio es público y GitGuardian ya avisó una
vez por la contraseña del anfitrión de demostración, que estaba escrita en
`datos-demo.ts` (se corrigió y se rotó la de la base). Reglas:

- En desarrollo, `backend/.env` (ignorado por git; hay un `.env.example` versionado con
  los nombres y valores de ejemplo). Lo carga `import 'dotenv/config'` como primera línea
  de `main.ts`, antes de que cualquier módulo lea `process.env`.
- En producción las inyecta la plataforma: `DATABASE_URL`, `JWT_SECRET` y opcionalmente
  `SEED_ADMIN_PASSWORD` (si falta, el seed genera una aleatoria y la loguea una vez).
- La cuenta sembrada `anfitrion@cesartravel.co` es **ADMIN**: puede editar y borrar
  cualquier propiedad y ver la identidad de los huéspedes. Su contraseña nunca puede
  quedar en el repositorio ni ser adivinable.

## Convenciones

- Código y comentarios en español; comentar el porqué, no el qué.
- Nombres de archivo sin sufijo `.component`; clases con sufijo `Component`.
- Validación de entrada con class-validator en DTOs; el `ValidationPipe` global rechaza
  campos no declarados (`forbidNonWhitelisted`), así que el cliente no debe mandar extras.

## Despliegue

`render.yaml` (blueprint de Render, plan gratuito) + Postgres en Neon. Build y start desde la
raíz del monorepo (workspaces: instalar por subcarpeta rompe la resolución de módulos).
`NODE_VERSION` debe ser >= 24.15.0 (la CLI de Angular rechaza versiones menores). Secretos
que se cargan en el dashboard: `DATABASE_URL` y `JWT_SECRET`.
