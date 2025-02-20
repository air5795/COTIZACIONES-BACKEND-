import { Controller, Post, Get,StreamableFile, UseInterceptors, UploadedFile, BadRequestException, Body, Param, Put, HttpException, HttpStatus, Res, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PlanillasAportesService } from './planillas_aportes.service';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';



@ApiTags('Planillas Aportes')
@Controller('planillas_aportes')
export class PlanillasAportesController {
  constructor(private readonly planillasAportesService: PlanillasAportesService) {}

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
          return cb(new BadRequestException('Solo se permiten archivos Excel y CSV'), false);
        }
        cb(null, true);
      },
    }),
  )


    // Nuevo endpoint para subir un archivo Excel con la planilla de aportes
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) {
      if (!file) throw new BadRequestException('No se recibió ningún archivo');

      const data = this.planillasAportesService.procesarExcel(file.path);
      return this.planillasAportesService.guardarPlanilla(data, body.cod_patronal, body.gestion, body.mes, body.empresa,);
    }

    @Put('detalles/:id_planilla')
    async actualizarDetallesPlanilla(
        @Param('id_planilla') id_planilla: number,
        @Body() body
    ) {
        try {
            return await this.planillasAportesService.actualizarDetallesPlanilla(id_planilla, body.trabajadores);
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: error.message,
            }, HttpStatus.BAD_REQUEST);
        }
    }


    // Nuevo endpoint para obtener el historial de planillas de una empresa
    @Get('historial/:cod_patronal')
    async obtenerHistorial(@Param('cod_patronal') cod_patronal: string) {
      return this.planillasAportesService.obtenerHistorial(cod_patronal);
    }

    // Nuevo endpoint para obtener todo el historial de planillas de aportes completo sin estados
    @Get('historial-completo')
    async obtenerTodo(
      @Query('pagina') pagina: number = 1,
      @Query('limite') limite: number = 10,
      @Query('busqueda') busqueda: string = ''
    ) {
      try {
        return await this.planillasAportesService.obtenerTodo(pagina, limite, busqueda);
      } catch (error) {
        throw new HttpException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas completo sin estados',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    // Nuevo endpoint para obtener todo el historial de planillas
    @Get('historial')
    async obtenerTodoHistorial() {
      try {
        return await this.planillasAportesService.obtenerTodoHistorial();
      } catch (error) {
        throw new HttpException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al obtener el historial de planillas',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    // obtener planilla por id
    @Get(':id_planilla')
    async obtenerPlanilla(@Param('id_planilla') id_planilla: number) {
      return this.planillasAportesService.obtenerPlanilla(id_planilla);
    }

    // Nuevo endpoint para obtener los detalles de una planilla específica
    @Get('detalles/:id_planilla')
    async obtenerDetalles(@Param('id_planilla') id_planilla: number) {
      return this.planillasAportesService.obtenerDetalles(id_planilla);
    }

    // Nuevo endpoint para obtener los detalles de una planilla específica y por regional
    @Get('detalles/:id_planilla/:regional')
    async obtenerDetallesPorRegional(@Param('id_planilla') id_planilla: number, @Param('regional') regional: string) {
      return this.planillasAportesService.obtenerDetallesPorRegional(id_planilla, regional);
    }

    // Nuevo endpoint para obtener planillas pendientes
    @Get('pendientes')
    async obtenerPlanillasPendientes() {
      return this.planillasAportesService.obtenerPlanillasPendientes();
    }

    // Nuevo endpoint para actualizar el estado de una planilla
    @Put('estado/:id_planilla')
    async actualizarEstadoPlanilla(
      @Param('id_planilla') id_planilla: number,
      @Body() body
    ) {
      return this.planillasAportesService.actualizarEstadoPlanilla(id_planilla, body.estado, body.observaciones);
    }

    // Nuevo endpoint para eliminar detalles de una planilla
    @Delete('detalles/:id_planilla')
    async eliminarDetallesPlanilla(@Param('id_planilla') id_planilla: number) {
        try {
            return await this.planillasAportesService.eliminarDetallesPlanilla(id_planilla);
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: error.message,
            }, HttpStatus.BAD_REQUEST);
        }
    }
    
    

    // Nuevo endpoint para obtener planillas observadas por la entidad CBES
    @Get('observadas/:cod_patronal')
    async obtenerPlanillasObservadas(@Param('cod_patronal') cod_patronal: string) {
      return this.planillasAportesService.obtenerPlanillasObservadas(cod_patronal);
    }


    // Nuevo endpoint para corregir y reenviar una planilla observada a la entidad CBES
    @Put('corregir/:id_planilla')
    async corregirPlanilla(
      @Param('id_planilla') id_planilla: number,
      @Body() body
    ) {
      return this.planillasAportesService.corregirPlanilla(id_planilla, body);
    }

    // Nuevo endpoint para hacer la comparacion para obtener altas y bajas

    @Get('comparar/:cod_patronal/:gestion/:mesAnterior/:mesActual')
    async compararPlanillas(
      @Param('cod_patronal') cod_patronal: string,
      @Param('gestion') gestion: string,
      @Param('mesAnterior') mesAnterior: string,
      @Param('mesActual') mesActual: string
    ) {
      return await this.planillasAportesService.compararPlanillas(
        cod_patronal,
        mesAnterior,
        gestion,
        mesActual
      );
    }

    // Nuevo endpoint para generar el reporte de bajas
    @Get('reporte-bajas/:id_planilla/:cod_patronal/:mesAnterior/:mesActual/:gestion')
    async generarReporteBajas(
      @Param('id_planilla') id_planilla: number,
      @Param('cod_patronal') cod_patronal: string,
      @Param('mesAnterior') mesAnterior: string,
      @Param('mesActual') mesActual: string,
      @Param('gestion') gestion: string,
    ): Promise<StreamableFile> {
      try {
        // Llamar al servicio para generar el reporte de bajas
        const fileBuffer = await this.planillasAportesService.generarReporteBajas(
          id_planilla,
          cod_patronal,
          mesAnterior,
          mesActual,
          gestion,
        );
    
        // Verificar que el reporte se haya generado correctamente
        if (!fileBuffer) {
          throw new Error('No se pudo generar el reporte.');
        }
    
        // Devolver el archivo como un StreamableFile
        return fileBuffer;
      } catch (error) {
        // Manejar el error y devolver un mensaje apropiado
        throw new BadRequestException({
          message: 'Error al generar el reporte de bajas',
          details: error.message, // Incluir detalles del error
        });
      }
    }

// Nuevo endpoint para generar el reporte en PDF usando Carbone
@Get('reporte-planilla/:id_planilla')
  async generarReportePlanilla(
    @Param('id_planilla') id_planilla: number
  ): Promise<StreamableFile> {
    try {
      // Llamamos al servicio que genera el PDF con los datos formateados
      const fileBuffer = await this.planillasAportesService.generarReportePlanillaPorRegional(id_planilla);

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



}
