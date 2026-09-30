import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGuard, JwtGuard, JwtOpcionalGuard } from '../comun/jwt.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Usuario } from './entidades/usuario.entity';

/**
 * En producción JWT_SECRET es obligatorio y su ausencia detiene el arranque: caer al
 * valor de desarrollo, que está escrito en este repositorio público, permitiría a
 * cualquiera firmar un token de ADMIN. En desarrollo sí cae a ese valor, para que
 * `npm start` funcione sin configurar nada.
 */
function secretoJwt(): string {
  const secreto = process.env.JWT_SECRET?.trim();
  if (secreto) {
    return secreto;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET no está definida. En producción no se arranca con el secreto de desarrollo.',
    );
  }
  return 'secreto-solo-para-desarrollo-local';
}

/**
 * Global: los guards de JWT los usan casi todos los módulos, así que se exporta
 * JwtModule una sola vez en vez de importarlo en cada uno.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.registerAsync({
      // Factory y no objeto literal: así el error de secreto faltante sale durante el
      // arranque de Nest, con su mensaje, y no al importar el archivo.
      useFactory: () => ({
        secret: secretoJwt(),
        // El tipo de expiresIn es una plantilla literal ("8h", "30m"…) que una variable
        // de entorno no puede satisfacer estáticamente; el valor se valida al firmar.
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRACION ?? '8h') as `${number}h`,
        },
      }),
    }),
    // Los límites concretos los fija cada endpoint con @Throttle (auth.controller.ts).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, JwtOpcionalGuard, AdminGuard],
  // TypeOrmModule: los guards consultan la tabla de usuarios desde cualquier módulo.
  exports: [JwtModule, TypeOrmModule, JwtGuard, JwtOpcionalGuard, AdminGuard],
})
export class AuthModule {}
