import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type RolUsuario = 'USER' | 'ADMIN';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ unique: true })
  email: string;

  /** Hash bcrypt — nunca se expone en las respuestas (ver UsuarioResponse). */
  @Column()
  password: string;

  /** Celular colombiano (3XXXXXXXXX), opcional. Solo lo ve el propio usuario:
   * el contacto con el dueño de un inmueble va por el chat interno. */
  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ default: 'USER' })
  rol: RolUsuario;

  /**
   * Una cuenta bloqueada no puede iniciar sesión, y las sesiones que ya tenía dejan de
   * valer en la siguiente petición (JwtGuard lee la base, no solo el token). Se bloquea
   * en vez de borrar: borrar se llevaría sus reservas y reseñas, y dejaría sin dueño sus
   * alojamientos.
   */
  @Column({ default: false })
  bloqueado: boolean;

  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`.trim();
  }
}
