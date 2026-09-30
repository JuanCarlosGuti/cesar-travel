// Primero de todo: carga backend/.env (ignorado por git) antes de que cualquier módulo
// lea process.env. En producción las variables las inyecta la plataforma y no hay archivo.
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CARPETA_PUBLICA } from './spa/spa.controller';

const produccion = process.env.NODE_ENV === 'production';

/*
 * Política de contenido: qué puede cargar la página. Cada origen externo está porque
 * algo lo usa, y si se agrega uno nuevo (otro CDN de fotos, un script de analítica)
 * hay que sumarlo aquí o el navegador lo bloquea en producción.
 */
const CSP = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  // El build de Angular carga el CSS con onload="this.media='all'" (inlineCritical).
  // Se permite ese atributo exacto por su hash y ningún otro manejador en línea.
  scriptSrcAttr: ["'unsafe-hashes'", "'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='"],
  // Angular inyecta los estilos de cada componente como <style>: sin 'unsafe-inline'
  // la app se vería sin estilos.
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  // Las fotos del catálogo de demostración vienen de CDNs externos; blob: es la vista
  // previa de las fotos elegidas antes de subirlas.
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  connectSrc: ["'self'"],
  frameSrc: ['https://www.openstreetmap.org'],
  frameAncestors: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En producción la app está detrás de kamal-proxy, que termina el TLS y escribe él
  // mismo X-Forwarded-For (la IP real del visitante) y X-Forwarded-Proto (https),
  // descartando los que mande el cliente (`forward_headers: false` en deploy.yml).
  // Se confía solo en saltos desde redes privadas —la red de Docker del proxy—: así
  // req.ip y req.protocol son los reales y nadie de afuera puede falsearlos.
  app.set('trust proxy', 'loopback, uniquelocal');

  // www → dominio raíz. deploy.yml declara los dos nombres para que haya certificado
  // para ambos, pero la sesión vive en localStorage, que es por origen: sin esto, quien
  // entra por www y después por el dominio raíz tiene que volver a iniciar sesión, y los
  // enlaces compartidos salen con dos URL distintas. Se mira solo el prefijo "www." y
  // no "cualquier host distinto del oficial" porque el healthcheck de kamal-proxy llega
  // con el id del contenedor como Host, y un 301 lo daría por caído.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.hostname.startsWith('www.')) {
      return res.redirect(301, `${req.protocol}://${req.hostname.slice(4)}${req.originalUrl}`);
    }
    next();
  });

  // Cabeceras de seguridad (antes no había ninguna) y fuera "x-powered-by: Express".
  // La CSP y HSTS solo en producción: en local no hay HTTPS, y Swagger —que solo existe
  // fuera de producción— usa scripts en línea que la CSP bloquearía.
  app.use(
    helmet({
      contentSecurityPolicy: produccion ? { useDefaults: false, directives: CSP } : false,
      strictTransportSecurity: produccion,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Los archivos del build de Angular. index.html NO se sirve desde aquí (index: false):
  // lo arma SpaController para poder responder 404 y metadatos por página. Los archivos
  // con hash en el nombre no cambian nunca, así que se cachean un año.
  app.useStaticAssets(CARPETA_PUBLICA, {
    index: false,
    redirect: false,
    setHeaders: (res, ruta) => {
      if (/-[A-Z0-9]{8}\.(js|css)$/.test(ruta)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Rechaza campos no declarados en el DTO en vez de ignorarlos en silencio:
      // así un error de nombre en el cliente se nota enseguida.
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // En producción la SPA se sirve desde este mismo origen, así que CORS no hace falta.
  // En desarrollo, `ng serve` corre en otro puerto y usa el proxy de Angular.
  if (process.env.CORS_ORIGENES) {
    app.enableCors({ origin: process.env.CORS_ORIGENES.split(',') });
  }

  // Swagger solo fuera de producción: publicado, le entrega a cualquiera el mapa
  // completo de la API.
  if (!produccion) {
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('Del Valle al Mar API')
          .setDescription(
            'Alojamientos en el Cesar y La Guajira: catálogo, reservas, reseñas y chat.',
          )
          .setVersion('1.0.0')
          .addBearerAuth()
          .build(),
      ),
    );
  }

  // PORT lo fija config/deploy.yml en producción; en local cae al 3000.
  const puerto = Number(process.env.PORT) || 3000;
  await app.listen(puerto);
  console.log(
    `Del Valle al Mar escuchando en http://localhost:${puerto}` +
      (produccion ? '' : ' (docs en /api/docs)'),
  );
}

void bootstrap();
