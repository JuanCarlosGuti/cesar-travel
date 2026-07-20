import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, MaxLength } from 'class-validator';
import { JwtGuard } from '../comun/jwt.guard';
import type { UsuarioAutenticado } from '../comun/jwt.guard';
import { UsuarioActual } from '../comun/usuario-actual.decorator';
import { ChatService } from './chat.service';

class AbrirChatDto {
  @Type(() => Number)
  @IsInt()
  propiedadId: number;
}

class MensajeDto {
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(1000)
  cuerpo: string;
}

/** Todo el chat exige sesión y valida participación en cada operación. */
@ApiTags('chat')
@Controller('api/chats')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  async abrir(@Body() datos: AbrirChatDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    const conversacion = await this.chat.abrir(datos.propiedadId, usuario);
    return {
      id: conversacion.id,
      propiedadId: conversacion.propiedad.id,
      propiedadTitulo: conversacion.propiedad.titulo,
      otroUsuario: `${conversacion.duenio.nombre} ${conversacion.duenio.apellido}`.trim(),
    };
  }

  @Get()
  bandeja(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.chat.bandeja(usuario);
  }

  @Get('sin-leer')
  sinLeer(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.chat.sinLeer(usuario);
  }

  @Get(':id/mensajes')
  mensajes(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.chat.mensajesDe(id, usuario);
  }

  @Post(':id/mensajes')
  enviar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: MensajeDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.chat.enviar(id, datos.cuerpo, usuario);
  }

  @Post(':id/leido')
  @HttpCode(204)
  async marcarLeidos(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    await this.chat.marcarLeidos(id, usuario);
  }
}
