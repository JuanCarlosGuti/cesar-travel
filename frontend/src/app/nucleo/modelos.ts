// Tipos que devuelve la API (ver los dto de backend/src).

export interface Municipio {
  id: number;
  nombre: string;
  departamento: string;
  latitud: number | null;
  longitud: number | null;
}

export interface Categoria {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
}

export interface Caracteristica {
  id: number;
  nombre: string;
  icono: string;
}

export interface Imagen {
  id: number;
  titulo: string | null;
  url: string;
}

export interface PropiedadResumen {
  id: number;
  titulo: string;
  direccion: string;
  habitaciones: number;
  banos: number;
  categoria: Categoria;
  municipio: Municipio;
  imagenPortada: string | null;
  duenioId: number | null;
}

export interface PropiedadDetalle extends PropiedadResumen {
  descripcion: string;
  normas: string | null;
  saludYSeguridad: string | null;
  politicaCancelacion: string | null;
  imagenes: Imagen[];
  caracteristicas: Caracteristica[];
  duenio: { id: number; nombre: string; apellido: string } | null;
}

export interface Sesion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'USER' | 'ADMIN';
  token: string;
}

export interface Reserva {
  id: number;
  entrada: string;
  salida: string;
  horaLlegada: string | null;
  propiedad: {
    id: number;
    titulo: string;
    direccion: string;
    categoria: string;
    municipio: Municipio;
    imagenPortada: string | null;
  };
}

export interface Ocupante {
  id: number;
  entrada: string;
  salida: string;
  huesped: { id: number; nombre: string; apellido: string };
}

export interface Resena {
  id: number;
  puntaje: number;
  comentario: string | null;
  autor: string;
  creadaEn: string;
}

export interface ResumenResenas {
  propiedadId: number;
  promedio: number;
  cantidad: number;
}

export interface Conversacion {
  id: number;
  propiedadId: number;
  propiedadTitulo: string;
  otroUsuario: string;
  ultimoMensaje?: string | null;
  sinLeer?: number;
}

export interface Mensaje {
  id: number;
  autorId: number;
  cuerpo: string;
  creadoEn: string;
}

export interface RangoOcupado {
  entrada: string;
  salida: string;
}
