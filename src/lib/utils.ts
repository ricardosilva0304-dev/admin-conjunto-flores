/** Retorna un Date con la hora actual en zona Colombia (UTC-5) */
export function hoyCol(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
}

/** Retorna "YYYY-MM-DD" en hora colombiana */
export function fechaColStr(): string {
  const d = hoyCol();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Retorna "YYYY-MM" en hora colombiana */
export function mesColStr(): string {
  return fechaColStr().slice(0, 7);
}

export function numeroALetras(num: number): string {
  const unidades = (n: number) => ['CERO', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'][n];
  const decenas = (n: number) => {
    if (n <= 20) return ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'][n - 10];
    const prefijos = ['', '', 'VEINTI', 'TREINTA Y ', 'CUARENTA Y ', 'CINCUENTA Y ', 'SESENTA Y ', 'SETENTA Y ', 'OCHENTA Y ', 'NOVENTA Y '];
    return prefijos[Math.floor(n / 10)] + (n % 10 > 0 ? unidades(n % 10) : '');
  };
  const centenas = (n: number) => n === 100 ? 'CIEN' : ['CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'][Math.floor(n / 100) - 1] + (n % 100 > 0 ? ' ' + decenas(n % 100) : '');

  const convertirSeccion = (n: number) => {
    if (n < 10) return unidades(n);
    if (n < 100) return decenas(n);
    return centenas(n);
  };

  let resultado = '';
  let absoluto = Math.abs(num);

  if (absoluto >= 1000000) {
    const millones = Math.floor(absoluto / 1000000);
    resultado += (millones === 1 ? 'UN MILLÓN ' : convertirSeccion(millones) + ' MILLONES ');
    absoluto %= 1000000;
  }
  if (absoluto >= 1000) {
    const miles = Math.floor(absoluto / 1000);
    resultado += (miles === 1 ? 'MIL ' : convertirSeccion(miles) + ' MIL ');
    absoluto %= 1000;
  }
  if (absoluto > 0) resultado += convertirSeccion(absoluto);

  return (resultado || 'CERO') + ' PESOS M/CTE';
}

/**
 * LÓGICA DE CÁLCULO DE PRECIOS
 *
 * Tramos vigentes 2025 en adelante:
 *   Día  1 – 10  →  precio_m1  (tarifa puntual)
 *   Día 11 – 31  →  precio_m2  (tarifa tardía)
 *   Mes vencido  →  precio_m2  (siempre tarifa tardía si el mes ya pasó)
 *
 * Modos manuales desde Causación:
 *   M1   → fuerza tarifa puntual
 *   M2   → fuerza tarifa tardía
 *   M3   → reservado / mismo valor que M2 (compatibilidad con datos anteriores)
 *   AUTO → aplica la lógica automática por fecha
 */
export function calcularValorDeudaHoy(deuda: any) {
  if (Number(deuda.saldo_pendiente) <= 0) {
    return Number(deuda.saldo_pendiente) || 0;
  }

  // Cargo manual sin causación → devuelve el saldo directo
  if (!deuda.causaciones_globales) return Number(deuda.saldo_pendiente) || 0;

  const m1 = Number(deuda.precio_m1 || deuda.monto_original || 0);
  const m2 = Number(deuda.precio_m2 || m1);
  // m3 se mantiene por compatibilidad pero apunta a m2 en la nueva lógica
  const m3 = Number(deuda.precio_m3 || m2);

  const pagadoYa = m1 - (Number(deuda.saldo_pendiente) || 0);
  const modo = deuda.causaciones_globales.tipo_cobro || 'NORMAL';

  let precioTarifa = m1;

  if (modo === 'M1') {
    precioTarifa = m1;
  } else if (modo === 'M2') {
    precioTarifa = m2;
  } else if (modo === 'M3') {
    // Compatibilidad con causaciones antiguas — usa m3 si existe, si no m2
    precioTarifa = m3;
  } else {
    // AUTOMÁTICO: día 1-10 → m1, día 11 en adelante → m2
    const hoy = hoyCol();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = deuda.causaciones_globales.mes_causado.split("-").map(Number);

    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      // Mes ya vencido → tarifa tardía
      precioTarifa = m2;
    } else {
      // Mes en curso
      precioTarifa = dia <= 10 ? m1 : m2;
    }
  }

  return precioTarifa - pagadoYa;
}

/**
 * Formatea el periodo de la deuda (Ej: FEBRERO 2026)
 */
export function formatPeriodo(deuda: any) {
  const fechaStr = deuda.causaciones_globales?.mes_causado || deuda.fecha_vencimiento?.substring(0, 7);
  if (!fechaStr) return "CARGO EXTRA";

  const [year, month] = fechaStr.split("-");
  const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const mesIndex = parseInt(month) - 1;

  return isNaN(mesIndex) ? "CARGO EXTRA" : `${meses[mesIndex]} ${year}`;
}