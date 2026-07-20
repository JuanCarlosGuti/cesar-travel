import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/** Identidad del usuario tal como viaja en el token (no toca la base en cada request). */
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

function aUsuario(payload: Record<string, unknown>): UsuarioAutenticado {
  return {
    id: Number(payload.id),
    email: String(payload.sub),
    nombre: String(payload.nombre ?? ''),
    apellido: String(payload.apellido ?? ''),
    rol: payload.rol === 'ADMIN' ? 'ADMIN' : 'USER',
  };
}

/** Exige sesión: 401 si falta el token o es inválido. */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const request = contexto.switchToHttp().getRequest<RequestConUsuario>();
    const token = leerToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }
    try {
      request.usuario = aUsuario(this.jwt.verify(token));
      return true;
    } catch {
      throw new UnauthorizedException('El token es inválido o expiró');
    }
  }
}

/**
 * Sesión opcional: si hay token válido lo adjunta, si no deja pasar igual.
 * Lo usan endpoints públicos que muestran algo extra al usuario identificado.
 */
@Injectable()
export class JwtOpcionalGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const request = contexto.switchToHttp().getRequest<RequestConUsuario>();
    const token = leerToken(request);
    if (token) {
      try {
        request.usuario = aUsuario(this.jwt.verify(token));
      } catch {
        // Token inválido en una ruta pública: se ignora, se responde como anónimo.
      }
    }
    return true;
  }
}
