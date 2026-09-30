/**
 * Fechas de calendario (yyyy-MM-dd) en la hora de Colombia.
 *
 * `new Date().toISOString()` da la fecha en UTC, que desde las 7 p. m. de Colombia ya es
 * el día siguiente: con eso, una reserva para hoy hecha en la noche se rechazaría como
 * "en el pasado". Las reservas son de alojamientos en Colombia, así que "hoy" es el de
 * Colombia sin importar la zona del servidor. 'en-CA' se usa porque formatea como
 * yyyy-MM-dd, que es lo que guardan las columnas y lo que compara el código.
 */
const formatoColombia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function hoyEnColombia(): string {
  return formatoColombia.format(new Date());
}

/** Días entre dos fechas yyyy-MM-dd (las dos se leen a medianoche UTC: la resta es exacta). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000);
}
