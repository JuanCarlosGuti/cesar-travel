import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caracteristica } from './entidades/caracteristica.entity';
import { Categoria } from './entidades/categoria.entity';
import { Municipio } from './entidades/municipio.entity';

/** Catálogos de referencia: públicos y de solo lectura (alimentan buscador y formularios). */
@ApiTags('catálogo')
@Controller('api')
export class CatalogoController {
  constructor(
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    @InjectRepository(Municipio) private readonly municipios: Repository<Municipio>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicas: Repository<Caracteristica>,
  ) {}

  @Get('categorias')
  listarCategorias() {
    return this.categorias.find({ order: { titulo: 'ASC' } });
  }

  @Get('municipios')
  listarMunicipios() {
    return this.municipios.find({ order: { departamento: 'ASC', nombre: 'ASC' } });
  }

  @Get('caracteristicas')
  listarCaracteristicas() {
    return this.caracteristicas.find({ order: { nombre: 'ASC' } });
  }
}
