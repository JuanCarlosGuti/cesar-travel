import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { AdminModule } from '../src/admin/admin.module';
import { AuthModule } from '../src/auth/auth.module';
import { Usuario } from '../src/auth/entidades/usuario.entity';
import { CatalogoModule } from '../src/catalogo/catalogo.module';
import { Caracteristica } from '../src/catalogo/entidades/caracteristica.entity';
import { Categoria } from '../src/catalogo/entidades/categoria.entity';
import { Departamento } from '../src/catalogo/entidades/departamento.entity';
import { Municipio } from '../src/catalogo/entidades/municipio.entity';
import { ChatModule } from '../src/chat/chat.module';
import { entidades } from '../src/database/entidades';
import { PropiedadesModule } from '../src/propiedades/propiedades.module';
import { ResenasModule } from '../src/resenas/resenas.module';
import { Reserva } from '../src/reservas/entidades/reserva.entity';
import { ReservasModule } from '../src/reservas/reservas.module';

/**
 * Verifica las reglas de negocio contra la API real con una base SQLite en memoria.
 * Son las reglas que más caro cuesta romper sin darse cuenta: solapamiento de reservas,
 * quién puede reseñar, quién puede ver la identidad de los huéspedes y los límites que
 * impiden bloquear calendarios o fabricar reseñas.
 */
describe('Reglas de negocio (e2e)', () => {
  let app: App;
  let servidor: request.Agent;
  let tokenAnfitrion: string;
  let tokenHuesped: string;
  let tokenOtro: string;
  let propiedadId: number;
  let reservas: Repository<Reserva>;
  let usuarios: Repository<Usuario>;

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
        AdminModule,
      ],
    }).compile();

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
    tokenAnfitrion = anfitrion.body.token;
    tokenHuesped = huesped.body.token;
    tokenOtro = otro.body.token;
    reservas = nest.get<Repository<Reserva>>(getRepositoryToken(Reserva));
    usuarios = nest.get<Repository<Usuario>>(getRepositoryToken(Usuario));

    // Catálogo mínimo, creado a mano: el seed de demostración no participa de las pruebas.
    const departamentos = nest.get<Repository<Departamento>>(
      getRepositoryToken(Departamento),
    );
    const municipios = nest.get<Repository<Municipio>>(getRepositoryToken(Municipio));
    const categorias = nest.get<Repository<Categoria>>(getRepositoryToken(Categoria));
    const caracteristicas = nest.get<Repository<Caracteristica>>(
      getRepositoryToken(Caracteristica),
    );
    const departamento = await departamentos.save(
      departamentos.create({ codigoDane: '44', nombre: 'La Guajira' }),
    );
    const municipio = await municipios.save(
      municipios.create({ nombre: 'Palomino', tipo: 'Destino', departamento }),
    );
    const categoria = await categorias.save(categorias.create({ titulo: 'Casas' }));
    const caracteristica = await caracteristicas.save(
      caracteristicas.create({ nombre: 'Wifi', icono: 'wifi' }),
    );

    const nuevaPropiedad = await servidor
      .post('/api/propiedades')
      .set('Authorization', `Bearer ${tokenAnfitrion}`)
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
/**
   * Reservas que la API ya no deja crear (fechas pasadas): se insertan directo en la
   * base para probar lo que pasa con estadías empezadas o terminadas.
   */
  async function reservaDirecta(email: string, entrada: string, salida: string) {
    return reservas.save(
      reservas.create({
        propiedad: { id: propiedadId },
        huesped: await usuarios.findOneByOrFail({ email }),
        entrada,
        salida,
      }),
    );
  }

  it('rechaza reservas con entrada en el pasado', async () => {
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, entrada: fecha(-3), salida: fecha(-1) })
      .expect(400);
  });

  it('rechaza estadías de más de 30 noches', async () => {
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, entrada: fecha(100), salida: fecha(131) })
      .expect(400);
  });

  it('rechaza reservas con más de un año de anticipación', async () => {
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, entrada: fecha(400), salida: fecha(402) })
      .expect(400);
  });

  it('el dueño no puede reservar su propia propiedad', async () => {
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenAnfitrion}`)
      .send({ propiedadId, entrada: fecha(60), salida: fecha(62) })
      .expect(403);
  });

  it('limita a dos las reservas por venir de un huésped en la misma propiedad', async () => {
    // Beto ya tiene una (días 10 a 15).
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, entrada: fecha(40), salida: fecha(42) })
      .expect(201);
    await servidor
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .send({ propiedadId, entrada: fecha(50), salida: fecha(52) })
      .expect(409);
  });

  it('no deja cancelar una estadía que ya empezó', async () => {
    const empezada = await reservaDirecta('beto@test.co', fecha(-2), fecha(1));
    await servidor
      .delete(`/api/reservas/${empezada.id}`)
      .set('Authorization', `Bearer ${tokenHuesped}`)
      .expect(409);
  });

  it('deja reseñar a quien terminó su estadía, una sola vez', async () => {
    await reservaDirecta('caro@test.co', fecha(-6), fecha(-2));
    await servidor
      .post('/api/resenas')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send({ propiedadId, puntaje: 5, comentario: 'Excelente' })
      .expect(201);
    await servidor
      .post('/api/resenas')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send({ propiedadId, puntaje: 4, comentario: 'Otra vez' })
      .expect(409);
  });

  it('no expone datos de otros usuarios por id', async () => {
    await servidor
      .get('/api/auth/usuarios/1')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .expect(404);
  });

  describe('panel de administración', () => {
    let tokenAdmin: string;

    beforeAll(async () => {
      // Ana pasa a ADMIN directo en la base: JwtGuard lee el rol de ahí, así que su
      // token de siempre ya vale como ADMIN sin volver a iniciar sesión.
      await usuarios.update({ email: 'ana@test.co' }, { rol: 'ADMIN' });
      tokenAdmin = tokenAnfitrion;
    });

    it('rechaza a quien no es ADMIN', async () => {
      await servidor
        .get('/api/admin/usuarios')
        .set('Authorization', `Bearer ${tokenHuesped}`)
        .expect(403);
    });

    it('le muestra al ADMIN el resumen y los usuarios, sin contraseñas', async () => {
      const resumen = await servidor
        .get('/api/admin/resumen')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(resumen.body.usuarios).toBe(3);

      const lista = await servidor
        .get('/api/admin/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(lista.body).toHaveLength(3);
      expect(JSON.stringify(lista.body)).not.toContain('password');
    });

    it('no deja que el ADMIN se quite el rol ni se bloquee', async () => {
      const ana = await usuarios.findOneByOrFail({ email: 'ana@test.co' });
      await servidor
        .patch(`/api/admin/usuarios/${ana.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ bloqueado: true })
        .expect(409);
    });

    it('bloquear corta la sesión abierta y el login', async () => {
      const caro = await usuarios.findOneByOrFail({ email: 'caro@test.co' });
      await servidor
        .patch(`/api/admin/usuarios/${caro.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ bloqueado: true })
        .expect(200);

      await servidor.get('/api/auth/yo').set('Authorization', `Bearer ${tokenOtro}`).expect(401);
      await servidor
        .post('/api/auth/login')
        .send({ email: 'caro@test.co', password: 'password123' })
        .expect(403);
    });

    it('deja al ADMIN borrar una reseña ajena', async () => {
      const lista = await servidor
        .get('/api/admin/resenas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(lista.body.length).toBeGreaterThan(0);

      await servidor
        .delete(`/api/admin/resenas/${lista.body[0].id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);
    });
  });

  // La última: agota el cupo de intentos de login desde esta IP. Las pruebas de arriba
  // ya gastaron alguno en el mismo minuto, así que se cuenta hasta el primer 429.
  it('limita los intentos de login', async () => {
    let rechazosPorClave = 0;
    let estado = 401;
    while (estado === 401 && rechazosPorClave <= 10) {
      const respuesta = await servidor
        .post('/api/auth/login')
        .send({ email: 'ana@test.co', password: 'incorrecta' });
      estado = respuesta.status;
      if (estado === 401) {
        rechazosPorClave++;
      }
    }
    expect(estado).toBe(429);
    expect(rechazosPorClave).toBeLessThanOrEqual(10);
  });
});
