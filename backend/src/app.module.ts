import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Usuario } from './auth/entidades/usuario.entity';
import { CatalogoModule } from './catalogo/catalogo.module';
import { Caracteristica } from './catalogo/entidades/caracteristica.entity';
import { Categoria } from './catalogo/entidades/categoria.entity';
import { Departamento } from './catalogo/entidades/departamento.entity';
import { Municipio } from './catalogo/entidades/municipio.entity';
import { ChatModule } from './chat/chat.module';
import { SaludController } from './comun/salud.controller';
import { DatabaseModule } from './database/database.module';
import { SeedService } from './database/seed.service';
import { Propiedad } from './propiedades/entidades/propiedad.entity';
import { PropiedadesModule } from './propiedades/propiedades.module';
import { ResenasModule } from './resenas/resenas.module';
import { ReservasModule } from './reservas/reservas.module';
import { SpaModule } from './spa/spa.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CatalogoModule,
    PropiedadesModule,
    ReservasModule,
    ResenasModule,
    ChatModule,
    // Repositorios que necesita el seed.
    TypeOrmModule.forFeature([
      Usuario,
      Departamento,
      Municipio,
      Categoria,
      Caracteristica,
      Propiedad,
    ]),
    // El backend sirve el build de Angular: un solo proceso y un solo puerto. SIEMPRE el
    // último: su ruta comodín tiene que registrarse después de todas las de la API.
    SpaModule,
  ],
  // El healthcheck del proxy del servidor. Vive aquí y no en un módulo propio
  // porque no tiene dependencias: solo necesita el DataSource, que TypeOrmModule
  // ya publica de forma global.
  controllers: [SaludController],
  providers: [SeedService],
})
export class AppModule {}
