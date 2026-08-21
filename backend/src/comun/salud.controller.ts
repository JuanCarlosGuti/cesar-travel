import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Endpoint de salud para el proxy del servidor (kamal-proxy).
 *
 * Existe por dos razones concretas:
 *
 *  1. El healthcheck se consulta cada pocos segundos. La ruta que apuntaba
 *     render.yaml era `/api/municipios`, que devuelve los 1.122 municipios del
 *     país con su departamento en cada respuesta. Servía como comprobación,
 *     pero es mucho tráfico para lo que hace falta saber.
 *
 *  2. Un 200 aquí es lo que hace que kamal-proxy empiece a mandarle visitas al
 *     contenedor nuevo. Si la base no responde, la aplicación no sirve para
 *     nada aunque el proceso esté vivo, y ese despliegue TIENE que fallar en
 *     vez de reemplazar al contenedor anterior. Por eso se responde 503 y no
 *     un 200 con `db: "down"` dentro.
 */
@ApiTags('salud')
@Controller('api/salud')
export class SaludController {
  constructor(@InjectDataSource() private readonly fuente: DataSource) {}

  @Get()
  async estado(): Promise<{ status: string; db: string; uptimeSeconds: number }> {
    try {
      await this.fuente.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'down',
        uptimeSeconds: Math.floor(process.uptime()),
      });
    }

    return {
      status: 'ok',
      db: 'up',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
