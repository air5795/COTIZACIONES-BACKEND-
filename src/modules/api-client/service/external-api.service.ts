import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ResponseUtil } from 'src/core/utility/response-util';

@Injectable()
export class ExternalApiService {
  private baseUrl = process.env.EXTERNAL_API_URL;
  private userName = process.env.API_USERNAME;
  private password = process.env.API_PASSWORD;
  private apiToken: string | null = null;

  constructor(private readonly httpService: HttpService) {}

  async loginToExternalApi() {
    const data = new URLSearchParams();
    data.append('user', this.userName);
    data.append('password', this.password);

    try {
        const response = await firstValueFrom(
            this.httpService.post(
                `${this.baseUrl}/security/login`,
                data.toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                },
            ),
        );

        this.apiToken = response.data.token;

    } catch (error) {
        return {
            status: false,
            data: null,
            message: `Error al iniciar sesión en la API externa`,
        };
    }
}


  getApiToken(): string | null {
    return this.apiToken;
  }

  async getEmpresaByNroPatronal(npatronal: string): Promise<any> {
    console.log("Llamando a getEmpresaByNroPatronal con nroPatronal:", npatronal);
    
    if (!this.apiToken) {
      console.error('Token no disponible en getEmpresaByNroPatronal');
      throw new Error('Token no disponible');
    }

    const url = `${this.baseUrl}/modelo/getEmpresaByNroPatronal/${npatronal}`;


    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        }),
      );
     

      return response.data.empresas;
    } catch (error) {
      console.error("Error al obtener empresa por número patronal:", error);
      throw new Error(`Error al obtener empresa por número patronal: ${error}`);
    }
}

async getAllEmpresas(): Promise<any> {
  console.log("Llamando a getAllEmpresas con nroPatronal:");
  
  if (!this.apiToken) {
    console.error('Token no disponible en getAllEmpresas');
    throw new Error('Token no disponible');
  }

  const url = `${this.baseUrl}/modelo/getAllEmpresas`;
  console.log("URL de consulta:", url);

  try {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      }),
    );
    

    return response.data.empresas;
  } catch (error) {
    console.error("Error al obtener empresa por número patronal:", error);
    throw new Error(`Error al obtener empresa por número patronal: ${error}`);
  }
}


  async getAseguradosByNroPatronal(npatronal: string): Promise<any> {
    if (!this.apiToken) {
      throw new Error('Token no disponible');
    }
    const url = `${this.baseUrl}/modelo/getAllAseguradosByNroPatronal/${npatronal}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        }),
      );
      return response.data.datosAsegurado;
    } catch (error) {
      throw new Error(
        `Error al obtener asegurados por número patronal: ${error}`,
      );
    }
  }

  async getAseguradoByCi(ci: string): Promise<any> {
    const ruta = `${this.baseUrl}/modelo/getDatosAseguradoByAseCi/`;
    if (!this.apiToken) {
      throw new Error('Token no disponible');
    }

    const url = `${this.baseUrl}/modelo/getDatosAseguradoByAseCi/${ci}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        }),
      );
      const data = response.data.datosAsegurado;
      if (data) {
        return ResponseUtil.success(data, 'Datos de Empleado encontrados.');
      } else {
        return ResponseUtil.error('No hay información del carnet solicitado.');
      }
    } catch (error) {
      throw new Error(`Error al obtener datos asegurado: ${error}`);
    }
  }

  async getAseguradoByMatricula(matricula: string): Promise<any> {
    const ruta = `${this.baseUrl}/modelo/getDatosAseguradoByAseMat/`;
    if (!this.apiToken) {
      throw new Error('Token no disponible');
    }
    const url = `${this.baseUrl}/modelo/getDatosAseguradoByAseMat/${matricula}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        }),
      );
      const data = [response.data.datosAsegurado];
      if (data && data.length > 0) {
        return ResponseUtil.success(data, 'Datos de Empleado encontrados.');
      } else {
        return ResponseUtil.error(
          'No hay información de la matricula solicitada.',
        );
      }
    } catch (error) {
      throw new Error(
        `Error al obtener asegurados por número patronal: ${error}`,
      );
    }
  }
}
