// Primero de todo: carga backend/.env (ignorado por git) antes de que cualquier módulo
// lea process.env. En producción las variables las inyecta la plataforma y no hay archivo.
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

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

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Cañaguate Travel API')
        .setDescription(
          'Alojamientos en el Cesar y La Guajira: catálogo, reservas, reseñas y chat.',
        )
        .setVersion('1.0.0')
        .addBearerAuth()
        .build(),
    ),
  );

  // PORT lo fija config/deploy.yml en producción; en local cae al 3000.
  const puerto = Number(process.env.PORT) || 3000;
  await app.listen(puerto);
  console.log(`Cañaguate Travel escuchando en http://localhost:${puerto} (docs en /api/docs)`);
}

void bootstrap();
