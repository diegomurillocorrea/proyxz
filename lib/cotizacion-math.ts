import type { Cotizacion } from "./types";

export function subtotalCotizacion(c: Cotizacion): number {
  return c.partidas.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);
}

export function montosCotizacion(c: Cotizacion): {
  subtotal: number;
  montoIva: number;
  total: number;
} {
  const subtotal = subtotalCotizacion(c);
  const montoIva = Math.round(subtotal * c.tasaIva * 100) / 100;
  const total = Math.round((subtotal + montoIva) * 100) / 100;
  return { subtotal, montoIva, total };
}
