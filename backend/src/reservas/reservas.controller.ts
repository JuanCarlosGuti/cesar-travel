import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import {
  aOcupanteResponse,
  aReservaResponse,
  ReservaDto,
} from './dto/reserva.dto';
import { ReservasService } from './reservas.service';

@ApiTags('reservas')
@Controller('api/reservas')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Post()
  @UseGuards(JwtGuard)
  async crear(@Body() datos: ReservaDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return aReservaResponse(await this.reservas.crear(datos, usuario));
  }

  @Get('mias')
  @UseGuards(JwtGuard)
  async mias(@UsuarioActual() usuario: UsuarioAutenticado) {
    const reservas = await this.reservas.misReservas(usuario);
    return reservas.map(aReservaResponse);
  }

  /** Ocupantes de un inmueble — con identidad del huésped, solo para su dueño. */
  @Get('propiedad/:propiedadId')
  @UseGuards(JwtGuard)
  async porPropiedad(
    @Param('propiedadId', ParseIntPipe) propiedadId: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const reservas = await this.reservas.porPropiedad(propiedadId, usuario);
    return reservas.map(aOcupanteResponse);
  }

  /** Fechas ocupadas (sin identidad) — pública: alimenta el calendario del detalle. */
  @Get('disponibilidad/:propiedadId')
  disponibilidad(@Param('propiedadId', ParseIntPipe) propiedadId: number) {
    return this.reservas.disponibilidad(propiedadId);
  }

  /** Ids ocupados en un rango — pública: el buscador excluye estos inmuebles. */
  @Get('ocupadas')
  ocupadas(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.reservas.ocupadasEntre(desde, hasta);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    await this.reservas.cancelar(id, usuario);
  }
}
