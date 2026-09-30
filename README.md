# Del Valle al Mar

Plataforma de alojamientos del **Cesar y La Guajira**: catálogo por municipio, búsqueda por
fechas disponibles, reservas, reseñas de huéspedes y chat interno entre viajero y anfitrión.

En producción: **https://delvallealmar.com**. El repositorio, los paquetes y la base
conservan el nombre original del proyecto, `cesar-travel`; la marca visible es Del Valle
al Mar. El árbol de cañaguate del logo se quedó como símbolo regional.

Monolito en **NestJS + Angular** (monorepo con npm workspaces): un solo proceso sirve la API
y el frontend compilado, así que se despliega en cualquier plataforma que corra Node.

> Existe una **versión en microservicios** de esta misma aplicación (Java 25 / Spring Boot 4,
> 6 servicios + MySQL + React), pensada para un despliegue con infraestructura propia:
> [digital_booking](https://github.com/JuanCarlosGuti/digital_booking). Esta versión monolito
> es la pensada para hosting gratuito y para tener un solo repositorio fácil de ejecutar.

## Puesta en marcha

Requisitos: Node.js 22 o superior (probado con 24).

```bash
npm install     # instala backend y frontend (workspaces)
npm run build   # compila Angular hacia backend/public y luego el backend
npm start       # backend en modo desarrollo, sirve también la web
```

Abrir **http://localhost:3000** — documentación de la API en `/api/docs` (Swagger; solo
fuera de producción).

La primera vez, la base se crea sola y se siembra con el catálogo de demostración:
12 municipios, 4 categorías, 28 propiedades y una cuenta de anfitrión
(`anfitrion@delvallealmar.com`) dueña de todas ellas.

Su contraseña sale de `SEED_ADMIN_PASSWORD` (copia `backend/.env.example` a
`backend/.env` y defínela). En producción es **obligatoria**: si falta, el seed falla en
vez de inventar una. Esa cuenta es ADMIN —puede editar cualquier propiedad y ver la
identidad de los huéspedes— así que nunca debe tener una contraseña escrita en el
repositorio ni aparecer en los logs.

El sitio es una **demostración**: los alojamientos del catálogo son ficticios y un aviso
visible en todas las páginas lo dice.

Para desarrollar el frontend con recarga automática: `npm run front`
(Angular en http://localhost:4200, con proxy hacia el backend en :3000).

## Base de datos

Una sola configuración sirve dos motores (ver `backend/src/database/database.module.ts`):

| Entorno | Motor | Cómo |
|---|---|---|
| Desarrollo | SQLite (archivo `backend/cesar-travel.db`) | Por defecto, sin instalar nada |
| Producción | PostgreSQL | Definiendo `DATABASE_URL` |

El esquema se sincroniza desde las entidades (`synchronize: true`) — decisión deliberada para
una aplicación de demostración; con datos reales habría que apagarlo y usar migraciones.

Para empezar de cero en local: borrar `backend/cesar-travel.db` y arrancar de nuevo.

## Variables de entorno

| Variable | Para qué | Por defecto |
|---|---|---|
| `DATABASE_URL` | Postgres de producción | sin definir → SQLite local |
| `JWT_SECRET` | Firma de los tokens | valor fijo de desarrollo (**cambiar en producción**) |
| `JWT_EXPIRACION` | Vigencia del token | `8h` |
| `PORT` | Puerto del servidor | `3000` |
| `CORS_ORIGENES` | Orígenes permitidos, separados por coma | sin CORS (mismo origen) |
| `DATABASE_SSL` | `false` para conectar a Postgres sin TLS | con TLS |

## Despliegue

Producción vive en **https://delvallealmar.com**, en un servidor propio compartido con
otros proyectos, y se despliega con [Kamal 2](https://kamal-deploy.org) según
[`config/deploy.yml`](config/deploy.yml).

- **Cada push a `main` despliega.** El workflow de CI corre las pruebas de reglas de
  negocio, el build de Angular y el de la imagen ([`Dockerfile`](Dockerfile)); si todo
  pasa, `kamal deploy` sube la imagen a GHCR y reemplaza el contenedor.
- **kamal-proxy** enruta por dominio, emite el certificado de Let's Encrypt y redirige
  http → https. `www.delvallealmar.com` responde con un 301 al dominio raíz; eso lo
  hace la app (`backend/src/main.ts`), no el proxy.
- **DNS** en Cloudflare: registros A hacia el servidor, **solo DNS (nube gris)**. Con el
  proxy de Cloudflare activado, el desafío de Let's Encrypt no llega y el certificado no
  se emite.
- **Postgres** es el del servidor, con rol y base propios (`cesartravel`). No sale de la
  red interna de Docker, por eso `DATABASE_SSL=false`.
- **Secretos** del repositorio en GitHub: `SSH_PRIVATE_KEY`, `DATABASE_URL`, `JWT_SECRET`
  y `SEED_ADMIN_PASSWORD`. `.kamal/secrets` se versiona porque solo tiene referencias.

`render.yaml` quedó de la etapa en Render + Neon (plan gratuito) y ya no es el despliegue
de producción.

## Funcionalidades

- **Catálogo** por municipio y categoría, con paginación de a 8 y promedio de reseñas.
- **Ubicaciones de todo el país**: al publicar se elige departamento y luego municipio
  (los 1.122 de Colombia según el DANE), más destinos turísticos que no son municipios
  —Palomino, Cabo de la Vela— porque son los nombres por los que la gente busca. El
  buscador, en cambio, solo ofrece los lugares donde ya hay alojamientos publicados.
- **Búsqueda por fechas**: excluye las propiedades con reservas solapadas en el rango.
- **Detalle**: galería con visor, servicios, políticas, mapa del municipio (OpenStreetMap),
  reseñas y — para el anfitrión — la lista de quién reservó y cuándo.
- **Reservas** con validación de solapamiento (rango semiabierto: se puede entrar el mismo
  día que otro huésped se va), límites contra el abuso (desde hoy, hasta un año adelante,
  máximo 30 noches, el dueño no reserva lo suyo) y cancelación antes de la entrada.
- **Reseñas**: solo quien se hospedó y ya terminó su estadía, una por propiedad.
- **Chat interno** huésped↔anfitrión por propiedad, con no leídos y actualización por sondeo.
  Reemplaza al contacto por WhatsApp: no se expone ningún dato de contacto personal.
- **Publicar y administrar** propiedades, con carga real de imágenes: se optimizan al subirlas
  (máximo 1600 px de ancho, convertidas a WebP — una foto de celular de 8 MB queda en ~0,6 MB)
  y se guardan en la base para sobrevivir a los despliegues en plataformas de filesystem
  efímero.

## Estructura

```
backend/    NestJS 11 — API REST + sirve el build de Angular
  src/auth         registro, login, JWT
  src/catalogo     municipios, categorías, características
  src/propiedades  CRUD, imágenes
  src/reservas     reservas, disponibilidad
  src/resenas      reseñas y promedios
  src/chat         conversaciones y mensajes
  src/database     configuración, seed y datos de demostración
frontend/   Angular 20 standalone + signals
```
