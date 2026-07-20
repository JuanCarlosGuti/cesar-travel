import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { CatalogoModule } from '../src/catalogo/catalogo.module';
import { Caracteristica } from '../src/catalogo/entidades/caracteristica.entity';
import { Categoria } from '../src/catalogo/entidades/categoria.entity';
import { Municipio } from '../src/catalogo/entidades/municipio.entity';
import { ChatModule } from '../src/chat/chat.module';
import { entidades } from '../src/database/entidades';
import { PropiedadesModule } from '../src/propiedades/propiedades.module';
import { ResenasModule } from '../src/resenas/resenas.module';
import { ReservasModule } from '../src/reservas/reservas.module';

/**
 * Verifica las reglas de negocio contra la API real con una base SQLite en memoria.
 * Son las reglas que más caro cuesta romper sin darse cuenta: solapamiento de reservas,
 * quién puede reseñar y quién puede ver la identidad de los huéspedes.
 */
describe('Reglas de negocio (e2e)', () => {
  let app: App;
  let servidor: request.Agent;
  let tokenHuesped: string;
  let tokenOtro: string;
  let propiedadId: number;

  const fecha = (diasDesdeHoy: number): string => {
    const dia = new Date();
    dia.setDate(dia.getDate() + diasDesdeHoy);
    return dia.toISOString().slice(0, 10);
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: entidades,
          synchronize: true,
          dropSchema: true,
        }),
        // El seed no corre acá: cada prueba crea exactamente los datos que necesita.
        AuthModule,
        CatalogoModule,
        PropiedadesModule,
        ReservasModule,
        ResenasModule,
        ChatModule,
      ],
    })
      // ServeStaticModule buscaría el build de Angular, que no existe en las pruebas.
      .overrideModule(ServeStaticModule)
      .useModule(class ModuloVacio {})
      .compile();

    const nest = modulo.createNestApplication();
    nest.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await nest.init();
    app = nest.getHttpServer() as App;
    servidor = request(app);

    const anfitrion = await servidor.post('/api/auth/registro').send({
      nombre: 'Ana',
      apellido: 'Anfitriona',
      email: 'ana@test.co',
      password: 'password123',
    });
    const huesped = await servidor.post('/api/auth/registro').send({
      nombre: 'Beto',
      apellido: 'Huésped',
      email: 'beto@test.co',
      password: 'password123',
    });
    const otro = await servidor.post('/api/auth/registro').send({
      nombre: 'Caro',
      apellido: 'Curiosa',
      email: 'caro@test.co',
      password: 'password123',
    });
    tokenHuesped = huesped.body.token;
    tokenOtro = otro.body.token;

    // Catálogo mínimo, creado a mano: el seed de demostración no participa de las pruebas.
    const municipios = nest.get<Repository<Municipio>>(getRepositoryToken(Municipio));
    const categorias = nest.get<Repository<Categoria>>(getRepositoryToken(Categoria));
    const caracteristicas = nest.get<Repository<Caracteristica>>(
      getRepositoryToken(Caracteristica),
    );
    const municipio = await municipios.save(
      municipios.create({ nombre: 'Palomino', departamento: 'La Guajira' }),
    );
    const categoria = await categorias.save(categorias.create({ titulo: 'Casas' }));
    const caracteristica = await caracteristicas.save(
      caracteristicas.create({ nombre: 'Wifi', icono: 'wifi' }),
    );

    const nuevaPropiedad = await servidor
      .post('/api/propiedades')
      .set('Authorization', `Bearer ${anfitrion.body.token}`)
      .send({
        titulo: 'Casa de prueba en Palomino',
        descripcion: 'Frente al mar',
        direccion: 'Playa',
        habitaciones: 2,
        banos: 1,
        categoriaId: categoria.id,
        municipioId: municipio.id,
        caracteristicaIds: [caracteristica.id],
      });
    propiedadId = nuevaPropiedad.body.id;
  });

  it('rechaza una reserva que se solapa con otra', async () => {
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, entrada: fecha(10), salida: fecha(15) })
      .expect(201);

    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send({ propiedadId, entrada: fecha(12), salida: fecha(18) })
      .expect(409);
  });

  it('permite entrar el mismo día que otro huésped se va', async () => {
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send({ propiedadId, entrada: fecha(15), salida: fecha(20) })
      .expect(201);
  });

  it('no deja reseñar una propiedad donde la estadía todavía no terminó', async () => {
    await servidor
      .post('/api/resenas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, puntaje: 5, comentario: 'Excelente' })
      .expect(403);
  });

  it('solo el dueño ve la identidad de quienes reservaron', async () => {
    await servidor
      .get(`/api/reservas/propiedad/${propiedadId}`)
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .expect(403);
  });

  it('la disponibilidad es pública pero no expone al huésped', async () => {
    const respuesta = await servidor
      .get(`/api/reservas/disponibilidad/${propiedadId}`)
      .expect(200);

    expect(respuesta.body.length).toBeGreaterThan(0);
    expect(JSON.stringify(respuesta.body)).not.toContain('Beto');
  });
});
