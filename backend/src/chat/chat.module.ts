import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../auth/entidades/usuario.entity';
import { PropiedadesModule } from '../propiedades/propiedades.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversacion } from './entidades/conversacion.entity';
import { Mensaje } from './entidades/mensaje.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversacion, Mensaje, Usuario]),
    PropiedadesModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
