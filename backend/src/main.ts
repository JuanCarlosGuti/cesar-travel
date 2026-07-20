// Primero de todo: carga backend/.env (ignorado por git) antes de que cualquier módulo
// lea process.env. En producción las variables las inyecta la plataforma y no hay archivo.
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
        .setTitle('Cesar Travel API')
        .setDescription(
          'Alojamientos en el Cesar y La Guajira: catálogo, reservas, reseñas y chat.',
        )
        .setVersion('1.0.0')
        .addBearerAuth()
        .build(),
    ),
  );

  // PORT lo asigna la plataforma en producción (Render); en local cae al 3000.
  const puerto = Number(process.env.PORT) || 3000;
  await app.listen(puerto);
  console.log(`Cesar Travel escuchando en http://localhost:${puerto} (docs en /api/docs)`);
}

void bootstrap();
