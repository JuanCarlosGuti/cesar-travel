import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Servicios del inmueble (wifi, piscina…). `icono` es la clave del ícono en el frontend. */
@Entity('caracteristicas')
export class Caracteristica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  icono: string;
}
