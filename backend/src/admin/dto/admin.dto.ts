import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class CambioUsuarioDto {
  @IsOptional()
  @IsIn(['USER', 'ADMIN'], { message: 'El rol debe ser USER o ADMIN' })
  rol?: 'USER' | 'ADMIN';

  @IsOptional()
  @IsBoolean()
  bloqueado?: boolean;
}
