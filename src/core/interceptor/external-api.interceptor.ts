/*
 * Este interceptor se encarga de interceptar todas las solicitudes a la API externa.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';
import { ExternalApiService } from 'src/modules/api-client/service/external-api.service';

@Injectable()
export class ExternalApiInterceptor implements NestInterceptor {
  constructor(private externalApiService: ExternalApiService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    //const response = httpContext.getResponse();

    if (request.url.includes(process.env.EXTERNAL_API_URL)) {
      let token = this.externalApiService.getApiToken();

      if (!token) {
        // Si no hay token, inicia sesión y obtén uno.
        await this.externalApiService.loginToExternalApi();
        token = this.externalApiService.getApiToken();
      }

      // Agrega el token al encabezado.
      request.headers.authorization = `Bearer ${token}`;

      // Manejar el caso en el que el token puede haber expirado.
      return next.handle().pipe(
        catchError(async (error) => {
          // Detecta el error 401 y maneja la renovación del token.
          if (
            error.status === 401 &&
            request.url.includes(process.env.EXTERNAL_API_URL)
          ) {
            // Intenta iniciar sesión nuevamente.
            await this.externalApiService.loginToExternalApi();
            token = this.externalApiService.getApiToken();

            // Agrega el nuevo token al encabezado y reenvía la solicitud.
            request.headers.authorization = `Bearer ${token}`;
            return next.handle(); // Reintenta la petición.
          } else {
            // Si el error no es un 401, simplemente lánzalo de nuevo.
            throw error;
          }
        }),
      );
    }

    return next.handle();
  }
}
