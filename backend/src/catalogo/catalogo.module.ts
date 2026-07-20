import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoController } from './catalogo.controller';
import { Caracteristica } from './entidades/caracteristica.entity';
import { Categoria } from './entidades/categoria.entity';
import { Departamento } from './entidades/departamento.entity';
import { Municipio } from './entidades/municipio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categoria, Departamento, Municipio, Caracteristica]),
  ],
  controllers: [CatalogoController],
  exports: [TypeOrmModule],
})
export class CatalogoModule {}
