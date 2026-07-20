import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../comun/jwt.guard';
import type { UsuarioAutenticado } from '../comun/jwt.guard';
import { UsuarioActual } from '../comun/usuario-actual.decorator';
import { aResenaResponse, ResenaDto } from './dto/resena.dto';
import { ResenasService } from './resenas.service';

@ApiTags('reseñas')
@Controller('api/resenas')
export class ResenasController {
  constructor(private readonly resenas: ResenasService) {}

  @Post()
  @UseGuards(JwtGuard)
  async crear(@Body() datos: ResenaDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return aResenaResponse(await this.resenas.crear(datos, usuario));
  }

  /** Reseñas de una propiedad — públicas, como el catálogo. */
  @Get('propiedad/:propiedadId')
  async porPropiedad(@Param('propiedadId', ParseIntPipe) propiedadId: number) {
    const resenas = await this.resenas.porPropiedad(propiedadId);
    return resenas.map(aResenaResponse);
  }

  /** Promedios en lote (?propiedadIds=1,2,3) para las estrellas de las tarjetas. */
  @Get('resumen')
  resumen(@Query('propiedadIds') propiedadIds?: string) {
    const ids = (propiedadIds ?? '')
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
    return this.resenas.resumir(ids);
  }

  @Get('mias')
  @UseGuards(JwtGuard)
  mias(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.resenas.misPropiedadesResenadas(usuario);
  }
}
