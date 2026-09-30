import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Propiedad } from '../propiedades/entidades/propiedad.entity';

/** El build de Angular (`npm run build` lo deja en backend/public). */
export const CARPETA_PUBLICA = join(__dirname, '..', '..', 'public');

const MARCA = 'Del Valle al Mar';

/*
 * Rutas que existen en la SPA (frontend/src/app/app.routes.ts; si se agrega una allá,
 * va también aquí). Cualquier otra responde 404 de verdad: antes todo respondía 200 con
 * la home, y para Google eso son miles de páginas duplicadas ("soft 404").
 */
const RUTAS_SPA = [
  /^\/$/,
  /^\/buscar$/,
  /^\/login$/,
  /^\/registro$/,
  /^\/propiedades\/\d+\/reservar$/,
  /^\/mis-reservas$/,
  /^\/mis-propiedades$/,
  /^\/publicar(\/\d+)?$/,
  /^\/mensajes(\/\d+)?$/,
];
const RUTA_DETALLE = /^\/propiedades\/(\d+)$/;

interface Metadatos {
  titulo: string;
  descripcion?: string;
  imagen?: string | null;
}

/**
 * Sirve la SPA desde el servidor en vez de ServeStaticModule, que devolvía index.html
 * con 200 para cualquier ruta. Hacerlo aquí permite tres cosas que una SPA sola no puede:
 * responder 404 cuando la ruta no existe, dar robots.txt y sitemap.xml reales, y poner
 * título, descripción e imagen de cada alojamiento en el HTML inicial. Esto último es lo
 * que leen WhatsApp, Facebook y compañía al armar la vista previa de un enlace, porque
 * no ejecutan JavaScript: sin esto, toda ficha compartida se veía igual que la home.
 *
 * Los archivos estáticos (JS, CSS, íconos) los sirve `useStaticAssets` en main.ts antes
 * de llegar aquí. Este módulo tiene que importarse el último en AppModule: su ruta
 * comodín se registra después de las de la API y no les hace sombra.
 */
@ApiExcludeController()
@Controller()
export class SpaController {
  private plantilla: string | null = null;

  constructor(
    @InjectRepository(Propiedad) private readonly propiedades: Repository<Propiedad>,
  ) {}

  @Get('robots.txt')
  robots(@Req() req: Request, @Res() res: Response): void {
    const origen = origenDe(req);
    res.type('text/plain').send(
      [
        'User-agent: *',
        // Las fotos subidas se sirven desde /api: sin esta excepción, las vistas previas
        // y Google Imágenes no podrían leerlas.
        'Allow: /api/imagenes/',
        'Disallow: /api/',
        'Disallow: /login',
        'Disallow: /registro',
        'Disallow: /mis-reservas',
        'Disallow: /mis-propiedades',
        'Disallow: /publicar',
        'Disallow: /mensajes',
        '',
        `Sitemap: ${origen}/sitemap.xml`,
        '',
      ].join('\n'),
    );
  }

  @Get('sitemap.xml')
  async sitemap(@Req() req: Request, @Res() res: Response): Promise<void> {
    const origen = origenDe(req);
    const propiedades = await this.propiedades.find({
      select: { id: true },
      order: { id: 'ASC' },
    });
    const urls = ['/', '/buscar', ...propiedades.map((p) => `/propiedades/${p.id}`)];
    res
      .type('application/xml')
      .send(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          urls.map((ruta) => `  <url><loc>${escapar(origen + ruta)}</loc></url>`).join('\n') +
          '\n</urlset>\n',
      );
  }

  @Get('{*ruta}')
  async pagina(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Una ruta de la API que ningún controlador atendió es un 404 de API (JSON), no
    // una página.
    if (req.path.startsWith('/api/') || req.path === '/api') {
      throw new NotFoundException(`No existe ${req.method} ${req.path}`);
    }

    const detalle = RUTA_DETALLE.exec(req.path);
    if (detalle) {
      const propiedad = await this.propiedades.findOneBy({ id: Number(detalle[1]) });
      if (propiedad) {
        this.enviar(req, res, 200, {
          titulo: `${propiedad.titulo} · ${MARCA}`,
          descripcion: resumir(propiedad.descripcion),
          imagen: propiedad.imagenes?.[0]?.url ?? propiedad.categoria?.imagenUrl ?? null,
        });
        return;
      }
      this.enviar(req, res, 404);
      return;
    }

    this.enviar(req, res, RUTAS_SPA.some((ruta) => ruta.test(req.path)) ? 200 : 404);
  }

  private enviar(req: Request, res: Response, estado: number, meta?: Metadatos): void {
    const plantilla = this.leerPlantilla();
    if (!plantilla) {
      res.status(503).type('text/plain').send('El frontend no está compilado: `npm run build`.');
      return;
    }
    // index.html no se cachea: es la puerta a los archivos con hash de cada despliegue.
    res.setHeader('Cache-Control', 'no-cache');
    res.status(estado).type('html').send(conMetadatos(plantilla, origenDe(req), req.path, meta));
  }

  private leerPlantilla(): string | null {
    if (this.plantilla === null) {
      const archivo = join(CARPETA_PUBLICA, 'index.html');
      if (!existsSync(archivo)) {
        return null;
      }
      this.plantilla = readFileSync(archivo, 'utf8');
    }
    return this.plantilla;
  }
}

/** https://<dominio> — con `trust proxy`, protocolo y host son los del visitante. */
function origenDe(req: Request): string {
  return `${req.protocol}://${req.get('host') ?? req.hostname}`;
}

function conMetadatos(html: string, origen: string, ruta: string, meta?: Metadatos): string {
  let salida = html;
  if (meta) {
    salida = salida.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapar(meta.titulo)}</title>`);
    if (meta.descripcion) {
      salida = salida.replace(
        /<meta\s+name="description"[\s\S]*?>/,
        `<meta name="description" content="${escapar(meta.descripcion)}">`,
      );
    }
  }
  const titulo = meta?.titulo ?? /<title>([\s\S]*?)<\/title>/.exec(html)?.[1]?.trim() ?? MARCA;
  const descripcion =
    meta?.descripcion ?? /<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1] ?? '';
  const url = origen + ruta;
  const imagen = meta?.imagen ? absoluta(meta.imagen, origen) : null;

  const etiquetas = [
    `<link rel="canonical" href="${escapar(url)}">`,
    `<meta property="og:site_name" content="${MARCA}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="es_CO">`,
    `<meta property="og:url" content="${escapar(url)}">`,
    `<meta property="og:title" content="${escapar(titulo)}">`,
    `<meta property="og:description" content="${escapar(descripcion)}">`,
    ...(imagen
      ? [
          `<meta property="og:image" content="${escapar(imagen)}">`,
          `<meta name="twitter:card" content="summary_large_image">`,
        ]
      : [`<meta name="twitter:card" content="summary">`]),
  ];
  return salida.replace('</head>', `  ${etiquetas.join('\n  ')}\n</head>`);
}

function absoluta(url: string, origen: string): string {
  return /^https?:\/\//.test(url) ? url : origen + url;
}

/** Las vistas previas muestran unos 150 caracteres: se corta en una palabra completa. */
function resumir(texto: string, largo = 155): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= largo) {
    return limpio;
  }
  return limpio.slice(0, limpio.lastIndexOf(' ', largo)).replace(/[,.;:—-]+$/, '') + '…';
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
