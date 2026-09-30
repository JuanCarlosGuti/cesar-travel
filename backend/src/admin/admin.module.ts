import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';
import { Resena } from '../resenas/entidades/resena.entity';
import { Reserva } from '../reservas/entidades/reserva.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Propiedad, Reserva, Resena])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
