import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entidades } from './entidades';

/**
 * Una sola configuración para dos motores:
 *  - DATABASE_URL definida  → Postgres (producción).
 *  - sin DATABASE_URL       → SQLite en disco (desarrollo local, cero instalación).
 *
 * synchronize: true crea/actualiza el esquema desde las entidades. Es una decisión
 * deliberada para una app de demostración (evita el ciclo de migraciones); si esto
 * pasara a producción real con datos de verdad, hay que apagarlo y usar migraciones.
 */

/**
 * TLS hacia Postgres: encendido salvo que se apague explícitamente.
 *
 * Los Postgres administrados (Neon, Render, Supabase) exigen TLS y usan
 * certificados que Node no valida contra su almacén por defecto — de ahí el
 * `rejectUnauthorized: false`. Ese era el único caso cuando se escribió esto.
 *
 * En el servidor propio el Postgres es un contenedor que NO habla TLS y que no
 * está publicado al host: solo se alcanza desde dentro de las redes de Docker.
 * Si se le pide TLS, `pg` manda SSLRequest, el servidor responde que no, y la
 * conexión muere con "The server does not support SSL connections" — un fallo
 * de arranque que no dice de dónde viene.
 *
 * El valor por omisión es "sí, con TLS" a propósito: así ningún despliegue
 * existente cambia de comportamiento por este cambio, y quien se conecta sin
 * cifrar tiene que decirlo a mano.
 */
const usarTls = process.env.DATABASE_SSL !== 'false';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: usarTls ? { rejectUnauthorized: false } : false,
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
