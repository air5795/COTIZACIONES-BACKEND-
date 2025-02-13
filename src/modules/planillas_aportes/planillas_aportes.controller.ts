import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, Body, Param, Put, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PlanillasAportesService } from './planillas_aportes.service';
import { ApiTags } from '@nestjs/swagger';

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
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos Excel'), false);
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

    // Nuevo endpoint para obtener el historial de planillas de una empresa
    @Get('historial/:cod_patronal')
    async obtenerHistorial(@Param('cod_patronal') cod_patronal: string) {
      return this.planillasAportesService.obtenerHistorial(cod_patronal);
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




}
