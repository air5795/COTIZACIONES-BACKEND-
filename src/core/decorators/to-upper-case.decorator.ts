/*
 * Decorator funcion para convertir a mayusculas el valor de una propiedad
 */
export const ToUpperCaseDecorator: PropertyDecorator = (
  target: any,
  propertyKey: string,
) => {
  const key = `_${propertyKey}`;

  Object.defineProperty(target, key, {
    writable: true,
    enumerable: false,
    configurable: true,
  });

  const getter = function (this: any): any {
    return this[key];
  };

  const setter = function (this: any, value: string): void {
    if (typeof value === 'string') {
      this[key] = value.toUpperCase();
    } else {
      this[key] = value;
    }
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
};
