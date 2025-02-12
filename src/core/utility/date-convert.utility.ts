import * as moment from 'moment';
const convertirFechaExcelAFechaISO8601 = (fechaExcel: string): string => {
  const partesFecha = fechaExcel.split('/');
  if (partesFecha.length === 3) {
    const dia = partesFecha[0].trim();
    const mes = partesFecha[1].trim();
    const anio = partesFecha[2].trim();
    if (dia && mes && anio) {
      const fechaISO8601 = moment(
        `${anio}-${mes}-${dia}`,
        'YYYY-MM-DD',
      ).toISOString();
      return fechaISO8601;
    }
  }
  return ''; // Retorna una cadena vacía si la fecha no se puede convertir
};

const formatearFecha = (fechaString) => {
  if (!fechaString) return ''; // Si la fecha es nula o undefined, devuelve un string vacío
  const fecha = new Date(fechaString);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Los meses en JS son 0-indexados
  const ano = fecha.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

export { convertirFechaExcelAFechaISO8601, formatearFecha };
