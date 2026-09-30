import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtGuard } from '../comun/jwt.guard';
import type { UsuarioAutenticado } from '../comun/jwt.guard';
import { UsuarioActual } from '../comun/usuario-actual.decorator';
import { aDetalle, aResumen, PropiedadDto } from './dto/propiedad.dto';
import { PropiedadesService, TAMANIO_MAXIMO_BYTES } from './propiedades.service';

@ApiTags('propiedades')
@Controller('api')
export class PropiedadesController {
  constructor(private readonly propiedades: PropiedadesService) {}

  /** Catálogo público, con filtros opcionales por categoría y municipio. */
  @Get('propiedades')
  async buscar(
    @Query('categoriaId') categoriaId?: string,
    @Query('municipioId') municipioId?: string,
  ) {
    const encontradas = await this.propiedades.buscar({
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
      municipioId: municipioId ? Number(municipioId) : undefined,
    });
    return encontradas.map(aResumen);
  }

  @Get('propiedades/:id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return aDetalle(await this.propiedades.buscarPorId(id));
  }

  /** Las propiedades publicadas por un usuario: solo el propio dueño (o un admin). */
  @Get('propiedades/duenio/:duenioId')
  @UseGuards(JwtGuard)
  async buscarPorDuenio(
    @Param('duenioId', ParseIntPipe) duenioId: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const encontradas = await this.propiedades.buscarPorDuenio(duenioId, usuario);
    return encontradas.map(aResumen);
  }

  @Post('propiedades')
  @UseGuards(JwtGuard)
  async crear(@Body() datos: PropiedadDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return aDetalle(await this.propiedades.crear(datos, usuario));
  }

  @Put('propiedades/:id')
  @UseGuards(JwtGuard)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: PropiedadDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return aDetalle(await this.propiedades.actualizar(id, datos, usuario));
  }

  @Delete('propiedades/:id')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  async eliminar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    await this.propiedades.eliminar(id, usuario);
  }

  /** Sube archivos reales (multipart) y los agrega a la galería. */
  @Post('propiedades/:id/imagenes')
  @UseGuards(JwtGuard)
  // Sin `limits`, Multer aceptaba archivos de cualquier tamaño en memoria antes de que
  // el servicio los validara: una sola petición podía agotar la RAM del servidor.
  @UseInterceptors(FilesInterceptor('archivos', 10, { limits: { fileSize: TAMANIO_MAXIMO_BYTES } }))
  async agregarImagenes(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() archivos: Express.Multer.File[],
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return aDetalle(await this.propiedades.agregarImagenes(id, archivos, usuario));
  }

  @Delete('propiedades/:id/imagenes/:imagenId')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  async eliminarImagen(
    @Param('id', ParseIntPipe) id: number,
    @Param('imagenId', ParseIntPipe) imagenId: number,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    await this.propiedades.eliminarImagen(id, imagenId, usuario);
  }

  /** Sirve una imagen subida. Público: las fotos del catálogo se ven sin sesión. */
  @Get('imagenes/:imagenId')
  async servirImagen(
    @Param('imagenId', ParseIntPipe) imagenId: number,
    @Res() respuesta: Response,
  ) {
    const { buffer, tipoMime } = await this.propiedades.archivoDeImagen(imagenId);
    respuesta.setHeader('Content-Type', tipoMime);
    respuesta.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    respuesta.send(buffer);
  }
}
