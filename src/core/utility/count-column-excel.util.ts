/*
Creado: Nilo Soruco 
Metodo para contar el numero de filas de una columna en excel
*/
import * as ExcelJS from 'exceljs';
const getRowCountForColumn = (
  worksheet: ExcelJS.Worksheet,
  col: string,
): number => {
  let rowCount = 0;

  worksheet.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(col).value;
    if (cellValue !== null && cellValue !== '') {
      rowCount = rowNumber;
    }
  });

  return rowCount;
};

export { getRowCountForColumn };
