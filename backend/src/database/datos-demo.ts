/**
 * Catálogo de demostración — Cesar y La Guajira.
 *
 * Las ubicaciones seleccionables en toda la aplicación son los 1.122 municipios de
 * Colombia (DIVIPOLA del DANE, en datos/divipola.json) más los destinos turísticos de
 * abajo; este archivo solo define las propiedades de ejemplo con las que arranca la app.
 *
 * Las URLs de imagen son externas y verificadas; las de a0.muscache.com se pudren cuando
 * el anuncio original desaparece (ya pasó una vez), así que si alguna deja de cargar se
 * reemplaza por una de Pexels. Las imágenes que suben los usuarios no dependen de esto:
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

export const CATEGORIAS = [
  {
    titulo: 'Apartamentos',
    descripcion: 'Apartamentos',
    imagenUrl:
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    titulo: 'Casas',
    descripcion: 'Casas',
    imagenUrl:
      'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    titulo: 'Cabañas',
    descripcion: 'Cabañas',
    imagenUrl:
      'https://images.pexels.com/photos/128303/pexels-photo-128303.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    titulo: 'Fincas',
    descripcion: 'Fincas',
    imagenUrl:
      'https://images.pexels.com/photos/2225442/pexels-photo-2225442.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
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

/** 8 juegos de 5 fotos, asignados cíclicamente a las propiedades. */
const GALERIAS: string[][] = [
  [
    'https://a0.muscache.com/im/pictures/7c788516-9a54-41ca-99a1-d9006719677e.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/d29ba3bb-17e6-47fc-834d-f6436d8c5e87.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/8c59ea81-54b5-401e-ac86-e7a9c15483c6.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/85b9a885-aa32-49f2-a28f-77850171c276.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/a08c77e2-401e-470c-ab07-49c96cf3a44a.jpg?im_w=1200',
  ],
  [
    'https://a0.muscache.com/im/pictures/7de34810-5412-41f5-978c-bb100ec58d11.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-33186477/original/ac13d934-a49c-4653-8833-be8e19ab7180.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/29a51b1b-6a8e-4788-984e-ad7a756cc8c8.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/ba694acb-41ba-4064-bc48-b3ef76791615.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-33186477/original/6a74fccd-af3e-4379-b1a4-69839f912c41.jpeg?im_w=1200',
  ],
  [
    'https://a0.muscache.com/im/pictures/miso/Hosting-751447725472870615/original/deb29194-49cc-4164-91dc-d53d7dec2326.jpeg?im_w=960',
    'https://a0.muscache.com/im/pictures/miso/Hosting-751447725472870615/original/6fe2390e-e1a9-4403-8316-7308d49f9ad7.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-751447725472870615/original/b8c7cf19-f4bf-42c5-9e15-943b6d669bcc.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-751447725472870615/original/e9129155-6475-4e7f-bade-37d6f8b8cf4e.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-751447725472870615/original/687791b0-700e-4ec5-b117-1a13147dcf24.jpeg?im_w=1200',
  ],
  [
    'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://a0.muscache.com/im/pictures/miso/Hosting-751447725472870615/original/e9a1c57a-4881-4380-acc1-b4a9ac3b6060.jpeg?im_w=1200',
  ],
  [
    'https://a0.muscache.com/im/pictures/miso/Hosting-750539402664925220/original/cb42a45b-4a28-4a7e-91c6-dcd188942fe4.jpeg?im_w=960',
    'https://a0.muscache.com/im/pictures/miso/Hosting-750539402664925220/original/1541ad38-9c53-431e-833a-dc4d125df7c3.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-750539402664925220/original/2252d65a-8eaa-4bca-a473-7edd7ff14878.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-750539402664925220/original/2554beab-8f75-4e2b-8b28-8be338f193bf.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-750539402664925220/original/4d77cf01-007f-41e7-9cf2-30bb4881c1d9.jpeg?im_w=1200',
  ],
  [
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/358636/pexels-photo-358636.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ],
  [
    'https://a0.muscache.com/im/pictures/1694460b-0d5c-4ed5-92fb-a16fec73e261.jpg?im_w=960',
    'https://a0.muscache.com/im/pictures/94e85af9-6f3c-425b-8790-b73ce68c5962.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/bd195e77-08cc-4a35-ad37-bfa2fee77368.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/7ecac6e8-d773-4a7c-a3cf-1024cf0dc47d.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/28a554a1-c315-45f7-a22f-d41e88ea9c3c.jpg?im_w=1200',
  ],
  [
    'https://a0.muscache.com/im/pictures/miso/Hosting-38129047/original/894bbb3b-7286-4131-9a7b-edd3c2971723.jpeg?im_w=960',
    'https://a0.muscache.com/im/pictures/miso/Hosting-38129047/original/e029f158-93d1-4e6b-bd51-b284a77f7d49.jpeg?im_w=1200',
    'https://a0.muscache.com/im/pictures/miso/Hosting-38129047/original/931fc299-5e96-4b72-9166-eee0ea8882b2.png?im_w=1200',
    'https://a0.muscache.com/im/pictures/eed4cb33-2592-4ae5-812a-b5c8d9fb67dd.jpg?im_w=1200',
    'https://a0.muscache.com/im/pictures/068c7bfd-e1c2-41f4-bb62-87fd067c257a.jpg?im_w=1200',
  ],
];

export function galeriaDe(indice: number): string[] {
  return GALERIAS[indice % GALERIAS.length];
}

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
}

export const PROPIEDADES: PropiedadDemo[] = [
  // La Guajira ---------------------------------------------------------------
  {
    titulo: 'Apartamento con vista al mar en el Malecón',
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
    descripcion:
      'Casa tropical a mitad de camino entre el río Palomino y la playa — podés hacer tubing en el río por la mañana y ver el atardecer en el mar.',
    direccion: 'Km 1 vía al río, Palomino',
    habitaciones: 3,
    banos: 2,
    categoria: 'Casas',
    municipio: 'Palomino',
    departamento: 'La Guajira',
  },
  {
    titulo: 'Casa con jardín tropical y hamacas',
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
  apellido: 'Cañaguate Travel',
  email: 'anfitrion@cesartravel.co',
  telefono: '3001234567',
  rol: 'ADMIN' as const,
};
