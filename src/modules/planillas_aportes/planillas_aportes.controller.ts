import { Controller, Post, Get,StreamableFile, UseInterceptors, UploadedFile, BadRequestException, Body, Param, Put, HttpException, HttpStatus, Res, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PlanillasAportesService } from './planillas_aportes.service';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { query, Response } from 'express';



@ApiTags('Planillas Aportes')
@Controller('planillas_aportes')
export class PlanillasAportesController {
  constructor(
    private readonly planillasAportesService: PlanillasAportesService,
  ) {}

  // 1.-  Endpoint para subir un archivo Excel con la planilla de aportes ----------------------------------------------
  @Post('subir')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos Excel y CSV'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )

  // 2.-  Endpoint para subir un archivo Excel con la planilla de aportes---------------------------------------------------
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    const data = this.planillasAportesService.procesarExcel(file.path);
    return this.planillasAportesService.guardarPlanilla(
      data,
      body.cod_patronal,
      body.gestion,
      body.mes,
      body.empresa,
      body.tipo_empresa,
      body.nit,
      body.legal,
    );
  }

  // 3.- Endpoint para actualizar los detalles de una planilla de aportes-----------------------------------------------------

  @Put('detalles/:id_planilla')
  async actualizarDetallesPlanilla(
    @Param('id_planilla') id_planilla: number,
    @Body() body,
  ) {
    try {
      return await this.planillasAportesService.actualizarDetallesPlanilla(
        id_planilla,
        body.trabajadores,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 4.- OBTENER HISTORIAL DE TABLA PLANILLAS DE APORTES ------------------------------------------------------

  @Get('historial/:cod_patronal')
  async obtenerHistorial(
    @Param('cod_patronal') cod_patronal: string,
    @Query('pagina') pagina: number = 1,
    @Query('limite') limite: number = 10,
    @Query('busqueda') busqueda: string = '',
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    try {
      return await this.planillasAportesService.obtenerHistorial(
        cod_patronal,
        pagina,
        limite,
        busqueda,
        mes,
        anio,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

    // 4.1 - OBTENER HISTORIAL DE TABLA PLANILLAS DE APORTES ADMINISTRADOR ------------------------------------------------------

    @Get('historialAdmin')
    @ApiQuery({
      name: 'busqueda',
      required: false,
      type: String,
      description: 'Término de búsqueda (opcional)',
    })
    @ApiQuery({
      name: 'mes',
      required: false,
      type: String,
      description: 'Término de búsqueda (opcional)',
    })
    @ApiQuery({
      name: 'anio',
      required: false,
      type: String,
      description: 'Término de búsqueda (opcional)',
    })
    @ApiQuery({
      name: 'estado',
      required: false,
      type: Number,
      description: 'Término de búsqueda (opcional)',
    })
    async obtenerHistorialAdmin(
      @Query('pagina') pagina: number = 1,
      @Query('limite') limite: number = 10,
      @Query('busqueda') busqueda: string = '',
      @Query('mes') mes?: string,
      @Query('anio') anio?: string,
      @Query('estado') estado?: string,  // Recibe como string
    ) {
      try {
        const estadoNumber = estado !== undefined ? Number(estado) : undefined;  // Convierte a número
        return await this.planillasAportesService.obtenerHistorialAdmin(
          pagina,
          limite,
          busqueda,
          mes,
          anio,
          estadoNumber, 
        );
      } catch (error) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error al obtener el historial de planillas',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

  // 5.- OBTENER HISTORIAL DE TABLA PLANILLAS DE APORTES CUANDO ESTADO = 1 (presentadas) --------------------------------------------------------------

  @Get('historial')
  async obtenerTodoHistorial() {
    try {
      return await this.planillasAportesService.obtenerTodoHistorial();
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 6.- OBTENER HISTORIAL PLANILLA DE APORTES-------------------------------------------

  @Get('historial-completo')
  @ApiQuery({
    name: 'busqueda',
    required: false,
    type: String,
    description: 'Término de búsqueda (opcional)',
  })
  async obtenerTodo(
    @Query('pagina') pagina: number = 1,
    @Query('limite') limite: number = 10,
    @Query('busqueda') busqueda: string = '',
  ) {
    try {
      return await this.planillasAportesService.obtenerTodo(
        pagina,
        limite,
        busqueda,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error:
            'Error al obtener el historial de planillas completo sin estados',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 7 .- OBTENER PLANILLA DE APORTES (ASINCRONO SIN PAGINACION) -----------------------------------------------------
  @Get(':id_planilla')
  async obtenerPlanilla(@Param('id_planilla') id_planilla: number) {
    return this.planillasAportesService.obtenerPlanilla(id_planilla);
  }

  // 8.- OBTENER DETALLES DE PLANILLA DE APORTES POR ID DE PLANILLA (TIENE PAGINACION Y BUSQUEDA)-------------

  @Get('detalles/:id_planilla')
  @ApiQuery({
    name: 'busqueda',
    required: false,
    type: String,
    description: 'Término de búsqueda (opcional)',
  })
  async obtenerDetalles(
    @Param('id_planilla') id_planilla: number,
    @Query('pagina') pagina: number = 1,
    @Query('limite') limite: number = 10,
    @Query('busqueda') busqueda: string = '',
  ) {
    try {
      return await this.planillasAportesService.obtenerDetalles(
        id_planilla,
        pagina,
        limite,
        busqueda,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener los detalles de la planilla',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

// 9.- OBSERVAR DETALLES DE PLANILLA DE APORTES POR REGIONAL -------------------------------------------------------------------------------------------------------
  @Get('detalles/:id_planilla/:regional')
  async obtenerDetallesPorRegional(
    @Param('id_planilla') id_planilla: number,
    @Param('regional') regional: string,
  ) {
    return this.planillasAportesService.obtenerDetallesPorRegional(
      id_planilla,
      regional,
    );
  }

  // 10.- OBTENER PLANILLAS PENDIENTES O PRESENTADAS ESTADO = 1 -----------------------------------------------------
  @Get('pendientes')
  async obtenerPlanillasPendientes() {
    return this.planillasAportesService.obtenerPlanillasPendientes();
  }

  // 11 .- ACTUALIZAR EL ESTADO DE UNA PLANILLA A PRESENTADO O PENDIENTE = 1 -------------------------------------
  @Put('estado/pendiente/:id_planilla')
  async actualizarEstadoAPendiente(
    @Param('id_planilla') id_planilla: number,
    @Body('fecha_declarada') fecha_declarada?: string
  ) {
    return this.planillasAportesService.actualizarEstadoAPendiente(id_planilla, fecha_declarada);
  }

  // 12 .- ACTUALIZAR METODO PARA APROBAR U OBSERVAR LA PLANILLA (ESTADO 2 o 3) -------------------------------------
  @Put('estado/:id_planilla')
  async actualizarEstadoPlanilla(
    @Param('id_planilla') id_planilla: number,
    @Body() body,
  ) {
    return this.planillasAportesService.actualizarEstadoPlanilla(
      id_planilla,
      body.estado,
      body.observaciones,
    );
  }

  // 13.-  ELIMINAR DETALLES DE UNA PLANILLA DE APORTES -----------------------------------------------------
  @Delete('detalles/:id_planilla')
  async eliminarDetallesPlanilla(@Param('id_planilla') id_planilla: number) {
    try {
      return await this.planillasAportesService.eliminarDetallesPlanilla(
        id_planilla,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 14 .- OBTENER PLANILLAS DE APORTES OBSERVADAS (ESTADO = 3) -----------------------------------------------------
  @Get('observadas/:cod_patronal')
  async obtenerPlanillasObservadas(
    @Param('cod_patronal') cod_patronal: string,
  ) {
    return this.planillasAportesService.obtenerPlanillasObservadas(
      cod_patronal,
    );
  }

  // 15 .- MANDAR CORREGIDA PLANILLA DE APORTES OBSERVADA A ADMINSTRADOR CBES CUANDO (ESTADO = 3)- ---------------------
  @Put('corregir/:id_planilla')
  async corregirPlanilla(
    @Param('id_planilla') id_planilla: number,
    @Body() body,
  ) {
    return this.planillasAportesService.corregirPlanilla(id_planilla, body);
  }

  // Nuevo endpoint para hacer la comparacion para obtener altas y bajas

  @Get('comparar/:cod_patronal/:gestion/:mesAnterior/:mesActual')
  async compararPlanillas(
    @Param('cod_patronal') cod_patronal: string,
    @Param('gestion') gestion: string,
    @Param('mesAnterior') mesAnterior: string,
    @Param('mesActual') mesActual: string,
  ) {
    return await this.planillasAportesService.compararPlanillas(
      cod_patronal,
      mesAnterior,
      gestion,
      mesActual,
    );
  }

  // Nuevo endpoint para generar el reporte de bajas
  @Get('reporte-bajas/:id_planilla/:cod_patronal')
  async generarReporteBajas(
    @Param('id_planilla') id_planilla: number,
    @Param('cod_patronal') cod_patronal: string,
  ): Promise<StreamableFile> {
    try {
      // Llamar al servicio para generar el reporte de bajas
      const fileBuffer = await this.planillasAportesService.generarReporteBajas(
        id_planilla,
        cod_patronal,
      );

      // Verificar que el reporte se haya generado correctamente
      if (!fileBuffer) {
        throw new Error('No se pudo generar el reporte.');
      }

      return fileBuffer;
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al generar el reporte de bajas',
        details: error.message,
      });
    }
  }

  // Nuevo endpoint para generar el reporte en PDF usando Carbone
  @Get('reporte-planilla/:id_planilla')
  async generarReportePlanilla(
    @Param('id_planilla') id_planilla: number,
  ): Promise<StreamableFile> {
    try {
      // Llamamos al servicio que genera el PDF con los datos formateados
      const fileBuffer =
        await this.planillasAportesService.generarReportePlanillaPorRegional(
          id_planilla,
        );

      // Verificamos si se generó correctamente
      if (!fileBuffer) {
        throw new Error('No se pudo generar el reporte.');
      }

      // Retornamos el PDF como StreamableFile
      return fileBuffer;
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al generar el reporte de planilla por regional',
        details: error.message,
      });
    }
  }

  // 20.-  Nuevo endpoint para obtener los datos de la planilla por regional

  @Get('datos-planilla/:id_planilla')
  async obtenerDatosPlanilla(
    @Param('id_planilla') id_planilla: number,
  ): Promise<any> {
    try {
      const datos =
        await this.planillasAportesService.obtenerDatosPlanillaPorRegional(
          id_planilla,
        );

      if (!datos) {
        throw new Error('No se pudieron obtener los datos de la planilla.');
      }

      return {
        success: true,
        data: datos,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Error al obtener los datos de la planilla por regional',
        details: error.message,
      });
    }
  }

  // 22.-  Función para consultar la API del Banco Central y obtener el UFV de una fecha específica ---------------------
  @Get('ufv/:fecha')
  async getUfvForDate(@Param('fecha') fecha: string) {
    // Validar y convertir la fecha
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Fecha inválida. Use el formato YYYY-MM-DD (e.g., 2025-01-09)');
    }

    const ufv = await this.planillasAportesService.getUfvForDate(date);
    return {
      fecha: fecha,
      ufv: ufv,
      mensaje: '✅ UFV consultado con éxito',
    };
  }

 // Función para calcular los aportes mensuales
 @Post('calcular/:id')
 async calcularAportes(@Param('id') id: string) { 
   const planillaId = parseInt(id); 
   if (isNaN(planillaId)) {
     throw new BadRequestException('El ID de la planilla debe ser un número válido');
   }

   const planilla = await this.planillasAportesService.calcularAportes(planillaId);
   return {
     mensaje: '✅ Cálculo de aportes realizado con éxito',
     planilla,
   };
 }

 // calculo preliminar 

 @Post('calcular-preliminar')
 @ApiOperation({ summary: 'Calcular el total a cancelar preliminar para una planilla' })
 @ApiQuery({
   name: 'id',
   required: true,
   description: 'ID de la planilla de aportes',
   type: String,
 })
 @ApiBody({
   description: 'Cuerpo de la solicitud con la fecha de pago',
   schema: {
     type: 'object',
     properties: {
       fecha_pago: {
         type: 'string',
         format: 'date-time',
         description: 'Fecha de pago propuesta en formato ISO (ejemplo: 2024-12-25T17:03:00.000Z)',
         example: '2024-12-25T17:03:00.000Z',
       },
     },
     required: ['fecha_pago'],
   },
 })
 @ApiResponse({ status: 200, description: 'Total a cancelar calculado', type: Number })
 @ApiResponse({ status: 400, description: 'Solicitud inválida' })
 async calcularAportesPreliminar(
   @Query('id') id: string,
   @Body('fecha_pago') fechaPago: string,
 ): Promise<number> {
   console.log(`Solicitud recibida para calcular preliminar - ID: ${id}, Fecha Pago: ${fechaPago}`);

   // Validar que fecha_pago no sea undefined o vacío
   if (!fechaPago) {
     throw new BadRequestException('El campo fecha_pago es obligatorio');
   }

   const fechaPagoDate = new Date(fechaPago);
   if (isNaN(fechaPagoDate.getTime())) {
     throw new BadRequestException(`Fecha de pago inválida: ${fechaPago}`);
   }

   return this.planillasAportesService.calcularAportesPreliminar(parseInt(id), fechaPagoDate);
 }


 // reporte

 @Get('reporte-aportes/:id_planilla')
 async generarReporteAportes(
   @Param('id_planilla') id_planilla: number,
 ): Promise<StreamableFile> {
   try {
     // Llamamos al servicio que genera el PDF con los datos formateados
     const fileBuffer = await this.planillasAportesService.generarReporteAportes(
       id_planilla,
     );

     // Verificamos si se generó correctamente
     if (!fileBuffer) {
       throw new Error('No se pudo generar el reporte.');
     }

     // Retornamos el PDF como StreamableFile
     return fileBuffer;
   } catch (error) {
     throw new BadRequestException({
       message: 'Error al generar el reporte de aportes',
       details: error.message,
     });
   }
 }

 // 26 .- REPORTE DE DECLRACION DE APORTE Y MUESTRA REGIONALES 

 @Get('reporte-planilla-regional/:id_planilla')
@ApiOperation({ summary: 'Generar reporte PDF de planilla por regional' })
@ApiResponse({ status: 200, description: 'Reporte PDF generado exitosamente', type: StreamableFile })
@ApiResponse({ status: 400, description: 'Error al generar el reporte' })
async generarReportePlanillaPorRegional(
  @Param('id_planilla') id_planilla: number,
): Promise<StreamableFile> {
  try {
    // Llamamos al servicio que genera el PDF con los datos por regional
    const fileBuffer = await this.planillasAportesService.generarReportePlanillaPorRegional(
      id_planilla,
    );

    // Verificamos si se generó correctamente
    if (!fileBuffer) {
      throw new Error('No se pudo generar el reporte por regional.');
    }

    // Retornamos el PDF como StreamableFile
    return fileBuffer;
  } catch (error) {
    throw new BadRequestException({
      message: 'Error al generar el reporte de planilla por regional',
      details: error.message,
    });
  }
}

// 27 .- REPORTE

@Get('reporte-aportes-mes/:mes?/:gestion?')
  @ApiOperation({ summary: 'Generar reporte PDF del historial de planillas presentadas' })
  @ApiResponse({ status: 200, description: 'Reporte PDF generado exitosamente', type: StreamableFile })
  @ApiResponse({ status: 400, description: 'Error al generar el reporte' })
  async generarReporteHistorial(
    @Param('mes', new ParseIntPipe({ optional: true })) mes?: number,
    @Param('gestion', new ParseIntPipe({ optional: true })) gestion?: number,
  ): Promise<StreamableFile> {
    try {
      // Validar que el mes esté entre 1 y 12 si se proporciona
      if (mes && (mes < 1 || mes > 12)) {
        throw new HttpException(
          { status: HttpStatus.BAD_REQUEST, error: 'El mes debe estar entre 1 y 12' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const fileBuffer = await this.planillasAportesService.generarReporteHistorial(mes, gestion);

      if (!fileBuffer) {
        throw new Error('No se pudo generar el reporte de historial de planillas.');
      }

      return fileBuffer;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al generar el reporte de historial de planillas',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }




}
