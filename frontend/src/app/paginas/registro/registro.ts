import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../nucleo/api';
import { SesionService } from '../../nucleo/sesion';
import { CanaguateMarkComponent } from '../../comun/canaguate-mark/canaguate-mark';

/**
 * El backend (NestJS) devuelve `message` como string o como array de strings
 * (class-validator). Copiado deliberadamente en cada página de auth para que los
 * chunks lazy no se importen entre sí por una función de tres líneas.
 */
function mensajeDeError(respuesta: HttpErrorResponse): string {
  const mensaje = respuesta?.error?.message;
  if (Array.isArray(mensaje)) {
    return mensaje.join('. ');
  }
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje;
  }
  if (respuesta?.status === 0) {
    return 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

/** Celular colombiano: 10 dígitos que empiezan en 3. Vacío es válido (es opcional). */
function celularOpcional(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value ?? '').trim();
  if (valor === '') {
    return null;
  }
  return /^3\d{9}$/.test(valor) ? null : { celular: true };
}

/** Validador a nivel de grupo: las dos contraseñas tienen que coincidir. */
function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmacion = grupo.get('confirmacion')?.value;
  if (!confirmacion) {
    return null;
  }
  return password === confirmacion ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, CanaguateMarkComponent],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [celularOpcional]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: contrasenasCoinciden },
  );

  get nombre() {
    return this.formulario.controls.nombre;
  }

  get apellido() {
    return this.formulario.controls.apellido;
  }

  get email() {
    return this.formulario.controls.email;
  }

  get telefono() {
    return this.formulario.controls.telefono;
  }

  get password() {
    return this.formulario.controls.password;
  }

  get confirmacion() {
    return this.formulario.controls.confirmacion;
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const { nombre, apellido, email, telefono, password } = this.formulario.getRawValue();

    this.api
      .registrar({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        password,
        // El campo es opcional: si va vacío no se manda la clave.
        ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
      })
      .subscribe({
        next: (sesion) => {
          // El registro ya devuelve token: se entra directo, sin pasar por el login.
          this.sesion.iniciar(sesion);
          this.router.navigateByUrl('/');
        },
        error: (respuesta: HttpErrorResponse) => {
          this.enviando.set(false);
          this.error.set(mensajeDeError(respuesta));
        },
      });
  }
}
