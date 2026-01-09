export function numeroALetras(num: number): string {
  const unidades = (n: number) => ['CERO', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'][n];
  const decenas = (n: number) => ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'][n - 10] || 
                                 ['', '', 'VEINTI', 'TREINTA Y ', 'CUARENTA Y ', 'CINCUENTA Y ', 'SESENTA Y ', 'SETENTA Y ', 'OCHENTA Y ', 'NOVENTA Y '][Math.floor(n/10)] + (n%10 > 0 ? unidades(n%10) : '');
  const centenas = (n: number) => n === 100 ? 'CIEN' : ['CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'][Math.floor(n/100)-1] + (n%100 > 0 ? ' ' + decenas(n%100) : '');

  const convertirSeccion = (n: number) => {
    if (n < 10) return unidades(n);
    if (n < 100) return decenas(n);
    return centenas(n);
  };

  let resultado = '';
  if (num >= 1000000) {
    const millones = Math.floor(num / 1000000);
    resultado += (millones === 1 ? 'UN MILLÓN ' : convertirSeccion(millones) + ' MILLONES ');
    num %= 1000000;
  }
  if (num >= 1000) {
    const miles = Math.floor(num / 1000);
    resultado += (miles === 1 ? 'MIL ' : convertirSeccion(miles) + ' MIL ');
    num %= 1000;
  }
  if (num > 0) resultado += convertirSeccion(num);

  return (resultado || 'CERO') + ' PESOS M/CTE';
}