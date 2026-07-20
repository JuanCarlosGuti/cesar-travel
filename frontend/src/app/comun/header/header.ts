import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ApiService } from '../../nucleo/api';
import { SesionService } from '../../nucleo/sesion';
import { CanaguateMarkComponent } from '../canaguate-mark/canaguate-mark';

/** Cada cuánto se vuelve a pedir el contador de mensajes sin leer. */
const REFRESCO_MS = 20_000;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CanaguateMarkComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);

  readonly menuAbierto = signal(false);
  readonly sinLeer = signal(0);

  /** Iniciales para el avatar; si falta el apellido alcanza con la del nombre. */
  readonly iniciales = computed(() => {
    const usuario = this.sesion.usuario();
    if (!usuario) {
      return '';
    }
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
  });

  private temporizador?: ReturnType<typeof setInterval>;
  private navegacion?: Subscription;

  ngOnInit(): void {
    this.refrescarSinLeer();
    this.temporizador = setInterval(() => this.refrescarSinLeer(), REFRESCO_MS);

    // Al navegar se cierra el menú móvil y se re-pide el contador: salir de
    // /mensajes debe actualizar el badge sin esperar los 20 s del intervalo.
    this.navegacion = this.router.events
      .pipe(filter((evento) => evento instanceof NavigationEnd))
      .subscribe(() => {
        this.menuAbierto.set(false);
        this.refrescarSinLeer();
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizador);
    this.navegacion?.unsubscribe();
  }

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarSesion(): void {
    this.sesion.cerrar();
    this.sinLeer.set(0);
    this.menuAbierto.set(false);
    this.router.navigateByUrl('/');
  }

  private refrescarSinLeer(): void {
    if (!this.sesion.autenticado()) {
      this.sinLeer.set(0);
      return;
    }
    // Un fallo acá no debe molestar al usuario: el badge simplemente no cambia.
    this.api.mensajesSinLeer().subscribe({
      next: ({ sinLeer }) => this.sinLeer.set(sinLeer),
      error: () => undefined,
    });
  }
}
