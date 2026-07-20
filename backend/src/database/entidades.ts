import { Usuario } from '../auth/entidades/usuario.entity';
import { Caracteristica } from '../catalogo/entidades/caracteristica.entity';
import { Categoria } from '../catalogo/entidades/categoria.entity';
import { Municipio } from '../catalogo/entidades/municipio.entity';
import { Conversacion } from '../chat/entidades/conversacion.entity';
import { Mensaje } from '../chat/entidades/mensaje.entity';
import { Imagen } from '../propiedades/entidades/imagen.entity';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';
import { Resena } from '../resenas/entidades/resena.entity';
import { Reserva } from '../reservas/entidades/reserva.entity';

/** Registro único de entidades: lo usan el módulo de base de datos y el seed. */
export const entidades = [
  Usuario,
  Municipio,
  Categoria,
  Caracteristica,
  Propiedad,
  Imagen,
  Reserva,
  Resena,
  Conversacion,
  Mensaje,
];
