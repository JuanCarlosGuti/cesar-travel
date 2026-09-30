import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard, JwtGuard } from '../comun/jwt.guard';
import type { UsuarioAutenticado } from '../comun/jwt.guard';
import { UsuarioActual } from '../comun/usuario-actual.decorator';
import { AdminService } from './admin.service';
import { CambioUsuarioDto } from './dto/admin.dto';

/**
 * Panel de administración: todo exige sesión y rol ADMIN. Borrar un alojamiento o
 * cancelar una reserva no está aquí: el panel usa DELETE /api/propiedades/:id y
 * DELETE /api/reservas/:id, que ya dejan pasar a un ADMIN.
 */
@ApiTags('admin')
@Controller('api/admin')
@UseGuards(JwtGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('resumen')
  resumen() {
    return this.admin.resumen();
  }

  @Get('usuarios')
  usuarios() {
    return this.admin.listarUsuarios();
  }

  @Patch('usuarios/:id')
  cambiarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() cambio: CambioUsuarioDto,
    @UsuarioActual() solicitante: UsuarioAutenticado,
  ) {
    return this.admin.cambiarUsuario(id, cambio, solicitante);
  }

  @Get('propiedades')
  propiedades() {
    return this.admin.listarPropiedades();
  }

  @Get('reservas')
  reservas() {
    return this.admin.listarReservas();
  }

  @Get('resenas')
  resenas() {
    return this.admin.listarResenas();
  }

  @Delete('resenas/:id')
  @HttpCode(204)
  async eliminarResena(@Param('id', ParseIntPipe) id: number) {
    await this.admin.eliminarResena(id);
  }
}
