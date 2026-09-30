import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './entidades/usuario.entity';
import {
  LoginDto,
  RegistroDto,
  SesionResponse,
  UsuarioResponse,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto): Promise<SesionResponse> {
    const email = datos.email.trim().toLowerCase();
    if (await this.usuarios.findOneBy({ email })) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const usuario = await this.usuarios.save(
      this.usuarios.create({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        email,
        password: await bcrypt.hash(datos.password, 10),
        // Vacío se guarda como null: "sin teléfono" tiene una sola representación.
        telefono: datos.telefono?.trim() || null,
        rol: 'USER',
      }),
    );

    return this.aSesion(usuario);
  }

  async iniciarSesion(datos: LoginDto): Promise<SesionResponse> {
    const usuario = await this.usuarios.findOneBy({
      email: datos.email.trim().toLowerCase(),
    });
    // Mismo mensaje para email inexistente y contraseña incorrecta: no se le confirma
    // a un atacante qué emails están registrados.
    if (!usuario || !(await bcrypt.compare(datos.password, usuario.password))) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    return this.aSesion(usuario);
  }

  private aSesion(usuario: Usuario): SesionResponse {
    const token = this.jwt.sign({
      sub: usuario.email,
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
    });
    return { ...this.aVistaPublica(usuario), token };
  }

  private aVistaPublica(usuario: Usuario): UsuarioResponse {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
    };
  }
}
