import { camelCase } from 'lodash';
const transformaCamelCaseArrayObjeto = (respuesta) =>
  respuesta.map((item: any) => {
    const transformedItem = {};
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const value = item[key];
        if (Array.isArray(value)) {
          // Si el valor es un array, aplicar la transformación de camelCase a cada objeto dentro del array
          transformedItem[camelCase(key)] = value.map((nestedItem: any) => {
            const transformedNestedItem = {};
            for (const nestedKey in nestedItem) {
              if (Object.prototype.hasOwnProperty.call(nestedItem, nestedKey)) {
                transformedNestedItem[camelCase(nestedKey)] =
                  nestedItem[nestedKey];
              }
            }
            return transformedNestedItem;
          });
        } else {
          // Si el valor no es un array, aplicar la transformación de camelCase normalmente
          transformedItem[camelCase(key)] = value;
        }
      }
    }
    return transformedItem;
  });

export { transformaCamelCaseArrayObjeto };
