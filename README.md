# Cesar Travel

Plataforma de alojamientos del **Cesar y La Guajira**: catálogo por municipio, búsqueda por
fechas disponibles, reservas, reseñas de huéspedes y chat interno entre viajero y anfitrión.

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

Abrir **http://localhost:3000** — documentación de la API en `/api/docs` (Swagger).

La primera vez, la base se crea sola y se siembra con el catálogo de demostración:
12 municipios, 4 categorías, 28 propiedades y una cuenta de anfitrión
(`anfitrion@cesartravel.co`) dueña de todas ellas.

Su contraseña sale de `SEED_ADMIN_PASSWORD` (copiá `backend/.env.example` a
`backend/.env` y definila). En producción, si no se define, el seed **genera una
aleatoria y la muestra una sola vez en los logs del arranque**: esa cuenta es ADMIN
—puede editar cualquier propiedad y ver la identidad de los huéspedes— así que nunca
debe tener una contraseña escrita en el repositorio.

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

## Despliegue (Render + Neon, plan gratuito)

1. **Base de datos**: crear un proyecto en [Neon](https://neon.tech) (Postgres gratuito y
   permanente) y copiar su cadena de conexión.
2. **Servicio**: en [Render](https://render.com) → **New → Blueprint** → elegir este repo.
   Render lee [`render.yaml`](render.yaml) y pide dos valores:
   - `DATABASE_URL`: la cadena de Neon.
   - `JWT_SECRET`: generar con `openssl rand -base64 32`.
3. **Apply**. El primer build tarda unos minutos; al terminar queda la URL pública. El
   catálogo se siembra solo la primera vez que arranca contra la base vacía.

Cada `git push` a `main` redespliega automáticamente.

Limitación del plan gratuito: el servicio se duerme tras ~15 minutos sin visitas y la
siguiente petición tarda ~50 segundos en despertarlo.

## Funcionalidades

- **Catálogo** por municipio y categoría, con paginación de a 8 y promedio de reseñas.
- **Búsqueda por fechas**: excluye las propiedades con reservas solapadas en el rango.
- **Detalle**: galería con visor, servicios, políticas, mapa del municipio (OpenStreetMap),
  reseñas y — para el anfitrión — la lista de quién reservó y cuándo.
- **Reservas** con validación de solapamiento (rango semiabierto: se puede entrar el mismo
  día que otro huésped se va) y cancelación.
- **Reseñas**: solo quien se hospedó y ya terminó su estadía, una por propiedad.
- **Chat interno** huésped↔anfitrión por propiedad, con no leídos y actualización por sondeo.
  Reemplaza al contacto por WhatsApp: no se expone ningún dato de contacto personal.
- **Publicar y administrar** propiedades, con carga real de imágenes (se guardan en la base
  para sobrevivir a los despliegues en plataformas de filesystem efímero).

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
