import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from '../comun/jwt.guard';
import { UsuarioActual } from '../comun/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../comun/jwt.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegistroDto } from './dto/auth.dto';

const MINUTO = 60_000;

/**
 * Login y registro llevan límite de intentos por IP: sin él, la contraseña de cualquier
 * cuenta —incluida la ADMIN— queda expuesta a fuerza bruta. La IP es la real del
 * visitante porque main.ts confía en kamal-proxy (`trust proxy`).
 *
 * No hay endpoint para consultar otros usuarios: `GET /api/auth/usuarios/:id` existía,
 * no lo usaba el frontend y con ids secuenciales permitía listar el correo de todos.
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 * MINUTO } })
  registrar(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: MINUTO } })
  iniciarSesion(@Body() datos: LoginDto) {
    return this.auth.iniciarSesion(datos);
  }

  /** La sesión actual, para que el frontend valide el token guardado al arrancar. */
  @Get('yo')
  @UseGuards(JwtGuard)
  yo(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
