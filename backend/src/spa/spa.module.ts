import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';
import { SpaController } from './spa.controller';

/** Tiene que ser el último import de AppModule: ver SpaController. */
@Module({
  imports: [TypeOrmModule.forFeature([Propiedad])],
  controllers: [SpaController],
})
export class SpaModule {}
