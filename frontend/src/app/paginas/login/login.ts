import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../nucleo/api';
import { SesionService } from '../../nucleo/sesion';
import { CanaguateMarkComponent } from '../../comun/canaguate-mark/canaguate-mark';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CanaguateMarkComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.formulario.controls.email;
  }

  get password() {
    return this.formulario.controls.password;
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const { email, password } = this.formulario.getRawValue();

    this.api.iniciarSesion(email, password).subscribe({
      next: (sesion) => {
        this.sesion.iniciar(sesion);
        // El guard manda acá con ?volverA=... para devolver al usuario a donde iba.
        const volverA = this.ruta.snapshot.queryParamMap.get('volverA');
        this.router.navigateByUrl(volverA ?? '/');
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }
}

/**
 * El backend (NestJS) devuelve `message` como string o como array de strings
 * (class-validator). Hay que contemplar los dos casos.
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
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
