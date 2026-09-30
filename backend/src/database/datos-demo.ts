/**
 * Catálogo de demostración — Cesar y La Guajira.
 *
 * Las ubicaciones seleccionables en toda la aplicación son los 1.122 municipios de
 * Colombia (DIVIPOLA del DANE, en datos/divipola.json) más los destinos turísticos de
 * abajo; este archivo solo define las propiedades de ejemplo con las que arranca la app.
 *
 * Las fotos son de Pexels, con licencia libre. No usar fotos de anuncios reales (Airbnb,
 * Booking…): las de antes lo eran, y además de pudrirse cuando el anuncio desaparece,
 * tienen derechos de autor. Las imágenes que suben los usuarios no dependen de esto:
 * viajan en la base (ver Imagen).
 */

/**
 * Destinos turísticos que NO son municipios: en DIVIPOLA no existen porque son
 * corregimientos, pero son los nombres por los que la gente busca alojamiento.
 * Se agregan a la lista de ubicaciones junto a los municipios oficiales.
 */
export const DESTINOS_TURISTICOS = [
  {
    nombre: 'Palomino',
    departamento: 'La Guajira',
    latitud: 11.2461,
    longitud: -73.5663,
  },
  {
    nombre: 'Cabo de la Vela',
    departamento: 'La Guajira',
    latitud: 12.2019,
    longitud: -72.1585,
  },
];

/**
 * Fotos de Pexels (licencia libre: uso comercial permitido y sin atribución
 * obligatoria). Reemplazaron a las de anuncios de Airbnb, que tenían derechos de autor.
 */
function pexels(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
}

export const CATEGORIAS = [
  {
    titulo: 'Apartamentos',
    descripcion: 'Apartamentos',
    imagenUrl: pexels(8660084),
  },
  {
    titulo: 'Casas',
    descripcion: 'Casas',
    imagenUrl: pexels(1292469),
  },
  {
    titulo: 'Cabañas',
    descripcion: 'Cabañas',
    imagenUrl: pexels(2598683),
  },
  {
    titulo: 'Fincas',
    descripcion: 'Fincas',
    imagenUrl: pexels(4212054),
  },
];

export const CARACTERISTICAS = [
  { nombre: 'Wifi', icono: 'wifi' },
  { nombre: 'Cocina', icono: 'cocina' },
  { nombre: 'Lavadora', icono: 'lavadora' },
  { nombre: 'Televisor', icono: 'televisor' },
  { nombre: 'Piscina', icono: 'piscina' },
  { nombre: 'Jacuzzi', icono: 'jacuzzi' },
  { nombre: 'Estacionamiento', icono: 'estacionamiento' },
  { nombre: 'Gimnasio', icono: 'gimnasio' },
  { nombre: 'Detector de humo', icono: 'detector' },
  { nombre: 'Aire acondicionado', icono: 'aire' },
];

/** Servicios típicos por categoría (misma lógica que el catálogo original). */
const SERVICIOS: Record<string, string[]> = {
  Apartamentos: ['Wifi', 'Cocina', 'Televisor', 'Gimnasio', 'Aire acondicionado'],
  Casas: ['Wifi', 'Cocina', 'Lavadora', 'Estacionamiento', 'Piscina'],
  Cabañas: ['Wifi', 'Cocina', 'Estacionamiento', 'Detector de humo', 'Televisor'],
  Fincas: ['Wifi', 'Cocina', 'Piscina', 'Jacuzzi', 'Estacionamiento'],
};

export function serviciosDe(categoria: string): string[] {
  return SERVICIOS[categoria] ?? ['Wifi', 'Cocina'];
}

export const NORMAS_POR_DEFECTO = {
  normas: 'No se permite fumar dentro del alojamiento. Se aceptan mascotas avisando con anticipación.',
  saludYSeguridad:
    'Detector de humo y botiquín disponibles. Limpieza profunda entre huéspedes.',
  politicaCancelacion:
    'Cancelación gratuita hasta 5 días antes de la fecha de entrada.',
};

export interface PropiedadDemo {
  titulo: string;
  descripcion: string;
  direccion: string;
  habitaciones: number;
  banos: number;
  categoria: string;
  /** Nombre del municipio o destino; el seed lo resuelve dentro de su departamento. */
  municipio: string;
  departamento: string;
  /** Foto del alojamiento (se empareja por título, no por posición en la lista). */
  foto: string;
}

export const PROPIEDADES: PropiedadDemo[] = [
  // La Guajira ---------------------------------------------------------------
  {
    titulo: 'Apartamento con vista al mar en el Malecón',
    foto: pexels(12053482),
    descripcion:
      'Apartamento fresco con balcón sobre el mar Caribe, a pasos del Malecón de Riohacha y del muelle turístico. Ideal como base para conocer el Santuario de los Flamencos y el Cabo de la Vela.',
    direccion: 'Malecón, Riohacha',
    habitaciones: 2,
    banos: 1,
    categoria: 'Apartamentos',
    municipio: 'Riohacha',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa fresca a cuadras de la playa',
    foto: pexels(7562736),
    descripcion:
      'Casa amplia de un piso con patio sombreado y hamacas, a pocas cuadras de la playa de Riohacha y del mercado nuevo. Perfecta para familias.',
    direccion: 'Barrio El Centro, Riohacha',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Riohacha',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Cabaña ecológica en la vía a Camarones',
    foto: pexels(10236126),
    descripcion:
      'Cabaña rodeada de trupillos en la vía al Santuario de Fauna y Flora Los Flamencos. Amaneceres con flamencos rosados a 10 minutos.',
    direccion: 'Vía a Camarones, Riohacha',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Riohacha',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Cabaña frente al mar en Palomino',
    foto: pexels(32830121),
    descripcion:
      'Cabaña de madera y palma a pasos de la playa de Palomino, donde la Sierra Nevada se encuentra con el Caribe. Atardeceres inolvidables desde la hamaca.',
    direccion: 'Playa de Palomino',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Palomino',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa entre el río y el mar',
    foto: pexels(32643806),
    descripcion:
      'Casa tropical a mitad de camino entre el río Palomino y la playa — puedes hacer tubing en el río por la mañana y ver el atardecer en el mar.',
    direccion: 'Km 1 vía al río, Palomino',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Palomino',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa con jardín tropical y hamacas',
    foto: pexels(18556916),
    descripcion:
      'Casa estilo hostal con jardín lleno de palmas, zona de hamacas y cocina abierta. El plan perfecto para desconectarse en Palomino.',
    direccion: 'Calle principal, Palomino',
    habitaciones: 4,
    banos: 3,
    categoria: 'Casas',
    municipio: 'Palomino',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Ranchería wayuu con vista al mar',
    foto: pexels(13209625),
    descripcion:
      'Alojamiento tradicional wayuu con chinchorros y comida típica, frente al mar turquesa del Cabo de la Vela. Una experiencia auténtica de la Alta Guajira.',
    direccion: 'Cabo de la Vela',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Cabo de la Vela',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Cabaña frente al Pilón de Azúcar',
    foto: pexels(2106191),
    descripcion:
      'Cabaña sencilla con vista directa al Pilón de Azúcar y al mar. Kitesurf, playa ojo de agua y cielos estrellados sin contaminación lumínica.',
    direccion: 'Vía al Pilón, Cabo de la Vela',
    habitaciones: 1,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Cabo de la Vela',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa de sal frente a las salinas',
    foto: pexels(18395588),
    descripcion:
      'Casa fresca frente a las salinas de Manaure, con sus montañas de sal blanca y charcas rosadas. Un paisaje único en Colombia.',
    direccion: 'Frente a las salinas, Manaure',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Manaure',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Cabaña wayuu cerca a las charcas rosadas',
    foto: pexels(16041157),
    descripcion:
      'Cabaña tradicional con chinchorros, atendida por una familia wayuu, a minutos de las charcas rosadas de las salinas de Manaure.',
    direccion: 'Vereda Shiruria, Manaure',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Manaure',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa del desierto, base para Punta Gallinas',
    foto: pexels(3660322),
    descripcion:
      'Casa de material en el casco urbano de Uribia, la capital indígena de Colombia — el punto de partida ideal para expediciones a Punta Gallinas y Bahía Hondita.',
    direccion: 'Centro, Uribia',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Uribia',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Ranchería tradicional en la Alta Guajira',
    foto: pexels(13837427),
    descripcion:
      'Ranchería con enramada y chinchorros en pleno desierto guajiro. Noches de historias wayuu alrededor del fogón.',
    direccion: 'Vía a Punta Gallinas, Uribia',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Uribia',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa de playa en Dibulla',
    foto: pexels(14024993),
    descripcion:
      'Casa frente al mar en Dibulla, con vista a la Sierra Nevada nevada al amanecer. Playas solas, pescado fresco y tranquilidad total.',
    direccion: 'Playa de Dibulla',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Dibulla',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Finca entre el mar y la Sierra Nevada',
    foto: pexels(32643805),
    descripcion:
      'Finca productiva con frutales tropicales entre la playa y las estribaciones de la Sierra Nevada de Santa Marta. Río propio y cacao de la región.',
    direccion: 'Vereda Mingueo, Dibulla',
    habitaciones: 4,
    banos: 3,
    categoria: 'Fincas',
    municipio: 'Dibulla',
    departamento: 'La Guajira',
  },
  // Cesar --------------------------------------------------------------------
  {
    titulo: 'Apartamento moderno cerca a la Plaza Alfonso López',
    foto: pexels(13004316),
    descripcion:
      'Apartamento nuevo a cuadras de la Plaza Alfonso López, el corazón del vallenato. A pasos de restaurantes, la catedral y la casa de los Maestre.',
    direccion: 'Centro, Valledupar',
    habitaciones: 2,
    banos: 1,
    categoria: 'Apartamentos',
    municipio: 'Valledupar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa vallenata cerca al río Guatapurí',
    foto: pexels(12785285),
    descripcion:
      'Casa amplia de un piso, típica del Valle de Upar, a pocas cuadras del balneario Hurtado y la sirena del río Guatapurí. Patio con palo de mango.',
    direccion: 'Barrio Novalito, Valledupar',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Valledupar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Apartamento con piscina en el norte',
    foto: pexels(12437961),
    descripcion:
      'Apartamento en conjunto cerrado con piscina y gimnasio, en la zona norte de Valledupar. Aire acondicionado en todas las habitaciones.',
    direccion: 'Sabanas del Valle, Valledupar',
    habitaciones: 2,
    banos: 2,
    categoria: 'Apartamentos',
    municipio: 'Valledupar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Finca ganadera con jagüey natural',
    foto: pexels(14766316),
    descripcion:
      'Finca tradicional del Cesar con potreros, arboleda nativa y un jagüey acondicionado como piscina natural. Cabalgatas y ordeño al amanecer.',
    direccion: 'Vía a Codazzi, Valledupar',
    habitaciones: 4,
    banos: 3,
    categoria: 'Fincas',
    municipio: 'Valledupar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa del barrio Cañaguate',
    foto: pexels(13767145),
    descripcion:
      'Casa familiar en el barrio que le da nombre al árbol insignia de la ciudad — en enero florece amarillo entero. Cerca al parque de la Leyenda Vallenata.',
    direccion: 'Barrio Cañaguate, Valledupar',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Valledupar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Cabaña de montaña en Pueblo Bello',
    foto: pexels(8093239),
    descripcion:
      'Cabaña con chimenea en el clima frío de Pueblo Bello, la puerta de entrada a la Sierra Nevada. Neblina, café y silencio.',
    direccion: 'Vía a Nabusímake, Pueblo Bello',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Pueblo Bello',
    departamento: 'Cesar',
  },
  {
    titulo: 'Finca cafetera con vista a la Sierra',
    foto: pexels(35816500),
    descripcion:
      'Finca cafetera en las faldas de la Sierra Nevada, con recorridos por los cultivos y café tostado en casa. Comunidad arhuaca vecina.',
    direccion: 'Vereda Las Mercedes, Pueblo Bello',
    habitaciones: 3,
    banos: 2,
    categoria: 'Fincas',
    municipio: 'Pueblo Bello',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa campestre a la entrada de la Sierra',
    foto: pexels(39530048),
    descripcion:
      'Casa campestre con jardín de heliconias y vista a las montañas. El punto de partida para caminatas a Nabusímake, capital espiritual arhuaca.',
    direccion: 'Casco urbano, Pueblo Bello',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Pueblo Bello',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa tradicional en La Paz',
    foto: pexels(15020185),
    descripcion:
      'Casa de pueblo con techos altos y mecedoras en el corredor, en La Paz — tierra de acordeoneros, a 20 minutos de Valledupar.',
    direccion: 'Centro, La Paz',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'La Paz',
    departamento: 'Cesar',
  },
  {
    titulo: 'Finca con frutales en San Diego',
    foto: pexels(14541787),
    descripcion:
      'Finca con cultivos de mango, guanábana y cítricos en el valle de San Diego. Piscina, kiosco con hamacas y noches de cielo despejado.',
    direccion: 'Vía Media Luna, San Diego',
    habitaciones: 4,
    banos: 2,
    categoria: 'Fincas',
    municipio: 'San Diego',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa de descanso en San Diego',
    foto: pexels(12865680),
    descripcion:
      'Casa tranquila con patio grande y árboles frutales en el pueblo de San Diego, famoso por sus parrandas vallenatas de diciembre.',
    direccion: 'Centro, San Diego',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'San Diego',
    departamento: 'Cesar',
  },
  {
    titulo: 'Cabaña con clima de montaña',
    foto: pexels(13834229),
    descripcion:
      'Cabaña en Manaure Balcón del Cesar, el pueblo con el mejor clima del departamento — 1.300 msnm de frescura en plena serranía del Perijá.',
    direccion: 'Vía al mirador, Manaure Balcón del Cesar',
    habitaciones: 2,
    banos: 1,
    categoria: 'Cabañas',
    municipio: 'Manaure Balcón del Cesar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa mirador del Balcón del Cesar',
    foto: pexels(16936166),
    descripcion:
      'Casa con terraza-mirador sobre el valle del Cesar. Al amanecer se ve el valle entero y al fondo la Sierra Nevada.',
    direccion: 'Alto de la Virgen, Manaure Balcón del Cesar',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Manaure Balcón del Cesar',
    departamento: 'Cesar',
  },
  {
    titulo: 'Casa frente a la Ciénaga de Zapatosa',
    foto: pexels(36860532),
    descripcion:
      'Casa a la orilla de la ciénaga más grande de Colombia. Paseos en canoa, pesca artesanal y atardeceres sobre el agua en Chimichagua.',
    direccion: 'Malecón, Chimichagua',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Chimichagua',
    departamento: 'Cesar',
  },
];

/**
 * Cuenta de demostración: dueña de todo el catálogo sembrado.
 *
 * La contraseña NO vive acá a propósito — este archivo está en un repositorio público y
 * una credencial de un usuario ADMIN (puede editar y borrar cualquier propiedad y ver la
 * identidad de los huéspedes) no puede quedar escrita en el código. La resuelve
 * SeedService a partir de SEED_ADMIN_PASSWORD, y si no está definida en producción,
 * genera una aleatoria y la muestra una única vez en los logs del arranque.
 */
export const ANFITRION_DEMO = {
  nombre: 'Anfitrión',
  apellido: 'Del Valle al Mar',
  email: 'anfitrion@delvallealmar.com',
  telefono: '3001234567',
  rol: 'ADMIN' as const,
};
