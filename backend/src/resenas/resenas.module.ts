import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { PropiedadesModule } from '../propiedades/propiedades.module';
import { ReservasModule } from '../reservas/reservas.module';
import { Resena } from './entidades/resena.entity';
import { ResenasController } from './resenas.controller';
import { ResenasService } from './resenas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resena, Usuario]),
    PropiedadesModule,
    ReservasModule,
  ],
  controllers: [ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}
