import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entidades } from './entidades';

/**
 * Una sola configuración para dos motores:
 *  - DATABASE_URL definida  → Postgres (producción: Neon/Render/etc.).
 *  - sin DATABASE_URL       → SQLite en disco (desarrollo local, cero instalación).
 *
 * synchronize: true crea/actualiza el esquema desde las entidades. Es una decisión
 * deliberada para una app de demostración (evita el ciclo de migraciones); si esto
 * pasara a producción real con datos de verdad, hay que apagarlo y usar migraciones.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            // Los Postgres administrados (Neon, Render, Supabase) exigen TLS y usan
            // certificados que Node no valida contra su almacén por defecto.
            ssl: { rejectUnauthorized: false },
            entities: entidades,
            synchronize: true,
          }
        : {
            type: 'better-sqlite3',
            database: process.env.SQLITE_FILE ?? 'cesar-travel.db',
            entities: entidades,
            synchronize: true,
          },
    ),
  ],
})
export class DatabaseModule {}
