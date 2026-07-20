import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { Caracteristica } from '../catalogo/entidades/caracteristica.entity';
import { Categoria } from '../catalogo/entidades/categoria.entity';
import { Municipio } from '../catalogo/entidades/municipio.entity';
import { Imagen } from './entidades/imagen.entity';
import { Propiedad } from './entidades/propiedad.entity';
import { PropiedadesController } from './propiedades.controller';
import { PropiedadesService } from './propiedades.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Propiedad,
      Imagen,
      Categoria,
      Municipio,
      Caracteristica,
      Usuario,
    ]),
  ],
  controllers: [PropiedadesController],
  providers: [PropiedadesService],
  exports: [PropiedadesService, TypeOrmModule],
})
export class PropiedadesModule {}
