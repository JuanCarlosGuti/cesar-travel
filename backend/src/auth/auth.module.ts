import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtGuard, JwtOpcionalGuard } from '../comun/jwt.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Usuario } from './entidades/usuario.entity';

/**
 * Global: los guards de JWT los usan casi todos los módulos, así que se exporta
 * JwtModule una sola vez en vez de importarlo en cada uno.
 *
 * En producción JWT_SECRET es obligatorio; en desarrollo cae a un valor fijo para que
 * `npm start` funcione sin configurar nada (nunca debe usarse fuera de local).
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secreto-solo-para-desarrollo-local',
      // El tipo de expiresIn es una plantilla literal ("8h", "30m"…) que una variable de
      // entorno no puede satisfacer estáticamente; el valor se valida al firmar.
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRACION ?? '8h') as `${number}h`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, JwtOpcionalGuard],
  exports: [JwtModule, JwtGuard, JwtOpcionalGuard],
})
export class AuthModule {}
