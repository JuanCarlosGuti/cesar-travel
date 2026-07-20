import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caracteristica } from './entidades/caracteristica.entity';
import { Categoria } from './entidades/categoria.entity';
import { Departamento } from './entidades/departamento.entity';
import { Municipio } from './entidades/municipio.entity';

/** Catálogos de referencia: públicos y de solo lectura (alimentan buscador y formularios). */
@ApiTags('catálogo')
@Controller('api')
export class CatalogoController {
  constructor(
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    @InjectRepository(Departamento)
    private readonly departamentos: Repository<Departamento>,
    @InjectRepository(Municipio) private readonly municipios: Repository<Municipio>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicas: Repository<Caracteristica>,
  ) {}

  @Get('categorias')
  listarCategorias() {
    return this.categorias.find({ order: { titulo: 'ASC' } });
  }

  @Get('departamentos')
  listarDepartamentos() {
    return this.departamentos.find({ order: { nombre: 'ASC' } });
  }

  /**
   * Municipios y destinos. Dos usos distintos y por eso dos filtros:
   *  - `departamentoId`: al publicar, la lista completa del departamento elegido.
   *  - `conPropiedades`: en el buscador, solo los lugares donde realmente hay
   *    alojamientos — ofrecer los 1.122 municipios del país en un buscador sería
   *    inútil, porque en la enorme mayoría no habría nada que mostrar.
   */
  @Get('municipios')
  async listarMunicipios(
    @Query('departamentoId') departamentoId?: string,
    @Query('conPropiedades') conPropiedades?: string,
  ) {
    const consulta = this.municipios
      .createQueryBuilder('municipio')
      .innerJoinAndSelect('municipio.departamento', 'departamento')
      .orderBy('municipio.nombre', 'ASC');

    if (departamentoId) {
      consulta.where('departamento.id = :departamentoId', {
        departamentoId: Number(departamentoId),
      });
    }

    if (conPropiedades === 'true') {
      consulta.andWhere(
        'EXISTS (SELECT 1 FROM propiedades p WHERE p."municipioId" = municipio.id)',
      );
    }

    const encontrados = await consulta.getMany();
    return encontrados.map((municipio) => ({
      id: municipio.id,
      nombre: municipio.nombre,
      // Se devuelve el nombre del departamento y no el objeto: es lo único que muestran
      // las vistas, y así el resto de la aplicación no cambia.
      departamento: municipio.departamento.nombre,
      departamentoId: municipio.departamento.id,
      tipo: municipio.tipo,
      latitud: municipio.latitud,
      longitud: municipio.longitud,
    }));
  }

  @Get('caracteristicas')
  listarCaracteristicas() {
    return this.caracteristicas.find({ order: { nombre: 'ASC' } });
  }
}
