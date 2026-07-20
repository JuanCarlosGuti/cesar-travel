import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../comun/jwt.guard';
import { UsuarioActual } from '../comun/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../comun/jwt.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegistroDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro')
  registrar(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  @Post('login')
  iniciarSesion(@Body() datos: LoginDto) {
    return this.auth.iniciarSesion(datos);
  }

  /** Datos públicos de un usuario (nombre para mostrar). Requiere sesión. */
  @Get('usuarios/:id')
  @UseGuards(JwtGuard)
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.auth.buscarPorId(id);
  }

  /** La sesión actual, para que el frontend valide el token guardado al arrancar. */
  @Get('yo')
  @UseGuards(JwtGuard)
  yo(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
