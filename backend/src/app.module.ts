import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { Usuario } from './auth/entidades/usuario.entity';
import { CatalogoModule } from './catalogo/catalogo.module';
import { Caracteristica } from './catalogo/entidades/caracteristica.entity';
import { Categoria } from './catalogo/entidades/categoria.entity';
import { Departamento } from './catalogo/entidades/departamento.entity';
import { Municipio } from './catalogo/entidades/municipio.entity';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from './database/database.module';
import { SeedService } from './database/seed.service';
import { Propiedad } from './propiedades/entidades/propiedad.entity';
import { PropiedadesModule } from './propiedades/propiedades.module';
import { ResenasModule } from './resenas/resenas.module';
import { ReservasModule } from './reservas/reservas.module';

@Module({
  imports: [
    DatabaseModule,
    // El backend sirve el build de Angular: un solo proceso y un solo puerto. Las rutas
    // de la SPA caen en index.html y las de /api/* las atienden los controladores.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/{*path}'],
    }),
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
  ],
  providers: [SeedService],
})
export class AppModule {}
