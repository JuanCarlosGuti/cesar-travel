import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestConUsuario, UsuarioAutenticado } from './jwt.guard';

/** Inyecta la identidad del token en el controlador: `@UsuarioActual() usuario`. */
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): UsuarioAutenticado | undefined =>
    contexto.switchToHttp().getRequest<RequestConUsuario>().usuario,
);
