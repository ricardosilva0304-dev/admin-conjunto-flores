/**
 * Convierte números a letras para documentos legales
 */
export function numeroALetras(num: number): string {
  const unidades = (n: number) => ['CERO', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'][n];
  const decenas = (n: number) => ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'TREINTA Y ', 'CUARENTA Y ', 'CINCUENTA Y ', 'SESENTA Y ', 'SETENTA Y ', 'OCHENTA Y ', 'NOVENTA Y '][n - 10] || 
                                 ['', '', 'VEINTI', 'TREINTA Y ', 'CUARENTA Y ', 'CINCUENTA Y ', 'SESENTA Y ', 'SETENTA Y ', 'OCHENTA Y ', 'NOVENTA Y '][Math.floor(n/10)] + (n%10 > 0 ? unidades(n%10) : '');
  const centenas = (n: number) => n === 100 ? 'CIEN' : ['CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'][Math.floor(n/100)-1] + (n%100 > 0 ? ' ' + decenas(n%100) : '');

  const convertirSeccion = (n: number) => {
    if (n < 10) return unidades(n);
    if (n < 100) return decenas(n);
    return centenas(n);
  };

  let resultado = '';
  let absoluto = Math.abs(num); // Manejamos el valor absoluto para el texto

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
 * LÓGICA ÚNICA DE CÁLCULO DE PRECIOS (M1, M2, M3)
 * Centralizamos esto aquí para que todos los componentes calculen lo mismo.
 */
export function calcularValorDeudaHoy(deuda: any) {
  // Si es un cargo manual sin causación programada, devolvemos el saldo directo
  if (!deuda.causaciones_globales) return Number(deuda.saldo_pendiente) || 0;

  const m1 = Number(deuda.precio_m1 || deuda.monto_original || 0);
  const m2 = Number(deuda.precio_m2 || m1);
  const m3 = Number(deuda.precio_m3 || m1);
  const pagadoYa = m1 - (Number(deuda.saldo_pendiente) || 0);

  const modo = deuda.causaciones_globales.tipo_cobro || 'NORMAL';
  let precioTarifa = m1;

  if (modo === 'M1') {
    precioTarifa = m1;
  } else if (modo === 'M2') {
    precioTarifa = m2;
  } else if (modo === 'M3') {
    precioTarifa = m3;
  } else {
    // LÓGICA AUTOMÁTICA POR FECHA
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = deuda.causaciones_globales.mes_causado.split("-").map(Number);

    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioTarifa = m3; // Si el mes ya pasó, aplica tarifa máxima
    } else {
      if (dia > 10 && dia <= 20) precioTarifa = m2;
      else if (dia > 20) precioTarifa = m3;
      else precioTarifa = m1;
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