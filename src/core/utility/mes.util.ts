export const MESES = [
  { value: 1, name: 'Enero' },
  { value: 2, name: 'Febrero' },
  { value: 3, name: 'Marzo' },
  { value: 4, name: 'Abril' },
  { value: 5, name: 'Mayo' },
  { value: 6, name: 'Junio' },
  { value: 7, name: 'Julio' },
  { value: 8, name: 'Agosto' },
  { value: 9, name: 'Septiembe' },
  { value: 10, name: 'Octubre' },
  { value: 11, name: 'Noviembre' },
  { value: 12, name: 'Diciembre' },
];

export const obtenerNombreMes = (mes: number): string => {
  const mesObj = MESES.find((m) => m.value === mes);
  return mesObj ? mesObj.name : '';
};
export const obtenerMesActual = (): number => {
  return new Date().getMonth() + 1; // +1 porque getMonth() devuelve valores de 0 a 11
};
export const obtenerRangoDeAnos = (inicio: number, fin: number): number[] => {
  const anos: number[] = [];
  for (let i = inicio; i <= fin; i++) {
    anos.push(i);
  }
  return anos;
};
