import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class RegistroDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @IsEmail({}, { message: 'Ingresa un email válido' })
  email: string;

  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  /** Opcional: sin @IsNotEmpty, y @Matches no valida cuando el valor es nulo. */
  @IsOptional()
  @Matches(/^3\d{9}$/, {
    message: 'El celular debe ser colombiano: 10 dígitos empezando por 3',
  })
  telefono?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Ingresa un email válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}

/** Vista pública de un usuario: nunca incluye la contraseña. */
export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

export interface SesionResponse extends UsuarioResponse {
  token: string;
}
