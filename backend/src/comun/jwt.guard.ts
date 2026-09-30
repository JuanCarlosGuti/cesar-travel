import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';

/** Identidad del usuario que hace la petición, leída de la base (ver JwtGuard). */
export interface UsuarioAutenticado {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'USER' | 'ADMIN';
}

export interface RequestConUsuario extends Request {
  usuario?: UsuarioAutenticado;
}

function leerToken(request: Request): string | null {
  const encabezado = request.headers.authorization;
  if (!encabezado?.startsWith('Bearer ')) {
    return null;
  }
  return encabezado.slice('Bearer '.length);
}

/**
 * Verifica el token y trae al usuario de la base. Antes se confiaba en lo que decía el
 * token, pero así un bloqueo o un cambio de rol hecho desde el panel de administración
 * no surtía efecto hasta que el token venciera (8 h). Una consulta por petición es barata
 * a este volumen. Devuelve null si el token no vale o la cuenta ya no existe.
 */
async function identificar(
  jwt: JwtService,
  usuarios: Repository<Usuario>,
  token: string,
): Promise<Usuario | null> {
  let payload: Record<string, unknown>;
  try {
    payload = jwt.verify(token);
  } catch {
    return null;
  }
  const id = Number(payload.id);
  return Number.isInteger(id) ? usuarios.findOneBy({ id }) : null;
}

function aAutenticado(usuario: Usuario): UsuarioAutenticado {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol === 'ADMIN' ? 'ADMIN' : 'USER',
  };
}

/** Exige sesión: 401 si falta el token, no vale o la cuenta está bloqueada. */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request = contexto.switchToHttp().getRequest<RequestConUsuario>();
    const token = leerToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }
    const usuario = await identificar(this.jwt, this.usuarios, token);
    if (!usuario || usuario.bloqueado) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }
    request.usuario = aAutenticado(usuario);
    return true;
  }
}

/**
 * Sesión opcional: si hay token válido lo adjunta, si no deja pasar igual.
 * Lo usan endpoints públicos que muestran algo extra al usuario identificado.
 */
@Injectable()
export class JwtOpcionalGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request = contexto.switchToHttp().getRequest<RequestConUsuario>();
    const token = leerToken(request);
    if (token) {
      const usuario = await identificar(this.jwt, this.usuarios, token);
      // Token inválido o cuenta bloqueada en una ruta pública: se responde como anónimo.
      if (usuario && !usuario.bloqueado) {
        request.usuario = aAutenticado(usuario);
      }
    }
    return true;
  }
}

/** Solo ADMIN. Va después de JwtGuard, que es el que identifica al usuario. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const usuario = contexto.switchToHttp().getRequest<RequestConUsuario>().usuario;
    if (usuario?.rol !== 'ADMIN') {
      throw new ForbiddenException('Solo para administradores');
    }
    return true;
  }
}
