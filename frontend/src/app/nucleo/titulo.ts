import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const MARCA = 'Del Valle al Mar';
// Igual al <title> de index.html, que es el que ven los buscadores en la home.
const TITULO_HOME = `${MARCA} — Fincas, cabañas y casas del Cesar a La Guajira`;

/**
 * Título del navegador por página: "Mis reservas · Del Valle al Mar". Antes todas
 * las páginas decían lo mismo que la home, en pestañas, historial y marcadores. La
 * ficha de un alojamiento lo reemplaza con su nombre al cargarlo (detalle.ts). La
 * vista previa al compartir en WhatsApp la arma el servidor (spa.controller.ts),
 * porque esos robots no ejecutan JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class TituloConMarca extends TitleStrategy {
  private readonly titulo = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void {
    const pagina = this.buildTitle(estado);
    this.titulo.setTitle(pagina ? `${pagina} · ${MARCA}` : TITULO_HOME);
  }
}
