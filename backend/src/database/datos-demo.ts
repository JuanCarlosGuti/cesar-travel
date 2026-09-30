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
  /**
   * Galería del alojamiento: la primera es la portada (tarjetas y vista previa al
   * compartir). Cinco porque la ficha muestra una grande y cuatro pequeñas.
   */
  fotos: string[];
}

export const PROPIEDADES: PropiedadDemo[] = [
  // La Guajira ---------------------------------------------------------------
  {
    titulo: 'Apartamento con vista al mar en el Malecón',
    fotos: [
      pexels(12053482),
      pexels(34271104),
      pexels(31817162),
      pexels(6980671),
      pexels(8146322),
    ],
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
    fotos: [
      pexels(7562736),
      pexels(8583599),
      pexels(37184167),
      pexels(7174391),
      pexels(7174408),
    ],
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
    fotos: [
      pexels(10236126),
      pexels(32859024),
      pexels(14011569),
      pexels(14011563),
      pexels(4577673),
    ],
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
    fotos: [
      pexels(32830121),
      pexels(33326668),
      pexels(14025910),
      pexels(14025911),
      pexels(4940786),
    ],
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
    fotos: [
      pexels(32643806),
      pexels(34277710),
      pexels(16436925),
      pexels(16436912),
      pexels(4916166),
    ],
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
    fotos: [
      pexels(18556916),
      pexels(11006326),
      pexels(7969008),
      pexels(6394574),
      pexels(6394571),
    ],
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
    fotos: [
      pexels(13209625),
      pexels(15842116),
      pexels(2058752),
      pexels(28352179),
      pexels(32536507),
    ],
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
    fotos: [
      pexels(2106191),
      pexels(18851993),
      pexels(5439495),
      pexels(7745992),
      pexels(34208351),
    ],
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
    fotos: [
      pexels(18395588),
      pexels(4119832),
      pexels(29304265),
      pexels(19899084),
      pexels(7587812),
    ],
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
    fotos: [
      pexels(33083961),
      pexels(8279960),
      pexels(8279958),
      pexels(8279959),
      pexels(7746620),
    ],
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
    fotos: [
      pexels(3660322),
      pexels(36758180),
      pexels(7163597),
      pexels(29136418),
      pexels(30767890),
    ],
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
    fotos: [
      pexels(16041200),
      pexels(24030589),
      pexels(9056664),
      pexels(14465275),
      pexels(17858506),
    ],
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
    fotos: [
      pexels(14024993),
      pexels(14024758),
      pexels(14024947),
      pexels(14024987),
      pexels(14024052),
    ],
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
    fotos: [
      pexels(32643805),
      pexels(34569487),
      pexels(34569486),
      pexels(6779229),
      pexels(28652353),
    ],
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
    fotos: [
      pexels(13004316),
      pexels(6585598),
      pexels(6585599),
      pexels(8089088),
      pexels(7214336),
    ],
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
    fotos: [
      pexels(12785285),
      pexels(36394965),
      pexels(10224313),
      pexels(271643),
      pexels(34946215),
    ],
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
    fotos: [
      pexels(12437961),
      pexels(28054875),
      pexels(7511695),
      pexels(7511693),
      pexels(6444971),
    ],
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
    fotos: [
      pexels(37843819),
      pexels(31329150),
      pexels(14399423),
      pexels(7487005),
      pexels(30413719),
    ],
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
    fotos: [
      pexels(13767145),
      pexels(29437170),
      pexels(23119651),
      pexels(3935353),
      pexels(12917082),
    ],
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
    fotos: [
      pexels(8093239),
      pexels(30070551),
      pexels(30070550),
      pexels(9890650),
      pexels(9890656),
    ],
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
    fotos: [
      pexels(35816500),
      pexels(38768996),
      pexels(7601101),
      pexels(7163599),
      pexels(14596477),
    ],
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
    fotos: [
      pexels(39530048),
      pexels(35999954),
      pexels(33625452),
      pexels(30708768),
      pexels(30708770),
    ],
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
    fotos: [
      pexels(15020185),
      pexels(4590896),
      pexels(38952769),
      pexels(38952766),
      pexels(7061664),
    ],
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
    fotos: [
      pexels(14541787),
      pexels(34134320),
      pexels(18884372),
      pexels(26743212),
      pexels(16436963),
    ],
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
    fotos: [
      pexels(12865680),
      pexels(29818566),
      pexels(38952727),
      pexels(17608951),
      pexels(15555023),
    ],
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
    fotos: [
      pexels(13834229),
      pexels(9056665),
      pexels(9056675),
      pexels(9056673),
      pexels(7746626),
    ],
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
    fotos: [
      pexels(16936166),
      pexels(39739770),
      pexels(19737829),
      pexels(16955580),
      pexels(16311150),
    ],
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
    fotos: [
      pexels(36860532),
      pexels(6416196),
      pexels(14495875),
      pexels(35023110),
      pexels(35023107),
    ],
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
