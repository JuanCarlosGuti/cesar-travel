# Cañaguate Travel — contexto para sesiones de IA

Plataforma de alojamientos del Cesar y La Guajira. Monolito **NestJS + Angular** en un
monorepo con npm workspaces. Usuario: desarrollador con experiencia en TypeScript/Angular.

**Marca visible: "Cañaguate Travel"** (con ñ; el dominio, `canaguatetravel.com`, sin ella).
Se llamó "Cesar Travel" hasta el 30/09/2026. El repo, los paquetes, el servicio de Kamal, la
imagen, la base y las rutas siguen llamándose `cesar-travel` a propósito: se renombró solo lo
que ve el usuario. No "completar" el renombre en los identificadores.

## Por qué existe esta versión

Es la reescritura como monolito de un proyecto que también existe **en microservicios**
(Java 25 / Spring Boot 4: 6 servicios + MySQL + React, repo `digital_booking`). Aquella
versión se conserva intacta como pieza de arquitectura para un despliegue con infraestructura
propia; esta se hizo para poder publicarla en hosting gratuito (Render), donde 6 servicios
Java + MySQL no entran. **Misma funcionalidad, mismo catálogo, misma identidad visual.**
Hoy ya no corre en Render sino en un servidor propio (ver "Despliegue").

## Stack y decisiones

- Backend NestJS 11 + TypeORM. **Una configuración, dos motores**: `DATABASE_URL` definida →
  Postgres (producción); sin ella → SQLite en archivo (desarrollo sin instalar nada).
- `synchronize: true` a propósito (app de demostración, sin migraciones). Con datos reales:
  apagarlo y migrar.
- **Las imágenes subidas se guardan en la base como base64**, no en disco: el filesystem de
  los planes gratuitos es efímero y se perderían en cada despliegue. Texto base64 y no
  binario porque `bytea` (Postgres) y `blob` (SQLite) no son intercambiables.
- **Se optimizan antes de guardarlas** (`optimizar()` en `propiedades.service.ts`, con
  sharp): máximo 1600 px de ancho y conversión a WebP con calidad 82. Medido: una foto de
  4032×3024 y 7,9 MB queda en 0,58 MB — 14× menos. Importa porque el Postgres gratuito da
  0,5 GB y porque la página carga más rápido. `rotate()` sin argumentos aplica la
  orientación EXIF (sin eso, las fotos verticales de celular se guardan acostadas).
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

## Ubicaciones

- Las ubicaciones seleccionables son **los 1.122 municipios de Colombia** (DIVIPOLA del
  DANE, en `backend/src/database/datos/divipola.json`, 112 KB) **más destinos turísticos
  que no son municipios**: Palomino y Cabo de la Vela son corregimientos de Dibulla y
  Uribia, pero son los nombres por los que se busca alojamiento en La Guajira. Un buscador
  de hospedaje se organiza por destino, no por división política — de ahí el campo `tipo`
  ('Municipio', 'Isla', 'Área no municipalizada', 'Destino').
- **El dataset vive en el repositorio, no se consulta una API externa en tiempo real**: son
  datos que cambian cada varios años, y depender de un servicio ajeno significaría que
  nadie puede publicar si ese servicio está caído. (Se evaluó api-colombia.com: funciona
  pero no trae coordenadas, que el mapa necesita.)
- El seed de ubicaciones es **independiente** del de propiedades y ambos son idempotentes:
  se puede agregar un destino nuevo sin tocar las propiedades ya publicadas.
- La API **aplana** el municipio en las respuestas (`departamento` como texto, no objeto
  anidado) para que las vistas no cambien. `GET /api/municipios` acepta `departamentoId`
  (cascada al publicar) y `conPropiedades=true` (buscador: ofrecer los 1.122 municipios
  cuando en casi todos no hay nada sería inútil).

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

Servidor propio (159.195.235.225) con **Kamal 2** según `config/deploy.yml`. **Cada push a
`main` despliega** desde CI (pruebas → imagen → `kamal deploy`), así que un commit a `main` ya
es un despliegue a producción.

- Dominio **https://canaguatetravel.com**, más `www`, que la app redirige con 301 al raíz
  (`main.ts`; `--canonical-host` no es clave de deploy.yml). kamal-proxy emite el
  certificado de Let's Encrypt.
- DNS en Cloudflare con la nube **gris** (solo DNS): con la naranja el certificado no se
  emite. Un nombre nuevo en `hosts:` se despliega solo después de que resuelva a la IP.
- `forward_headers: false` va siempre explícito (su valor por omisión cambia con `ssl`), y
  la app confía solo en proxies de red privada (`trust proxy` en `main.ts`).
- El servidor es de **producción compartida** con otras apps: no reiniciar kamal-proxy ni
  tocar la configuración de las demás.
- Secretos en GitHub: `SSH_PRIVATE_KEY`, `DATABASE_URL`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`.

`render.yaml` es de la etapa anterior (Render + Neon). Build y start siempre desde la raíz del
monorepo (workspaces: instalar por subcarpeta rompe la resolución de módulos). Node >= 24.15.0
(la CLI de Angular rechaza versiones menores).
