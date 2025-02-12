import { QueryFailedError } from 'typeorm';

export const CatchErrors = (): MethodDecorator => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        //console.log('Capturado en el decorador CatchErrors:', error);
        if (error instanceof QueryFailedError) {
          //console.log('Error de consulta de TypeORM capturado');
          return {
            status: false,
            data: null,
            message: `: ${error.message}`,
          };
        }
        return {
          status: false,
          data: null,
          message: `Ha ocurrido un error al procesar la solicitud, contacte con soporte: ${error.message}`,
        };
      }
    };

    return descriptor;
  };
};
