import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException, Get, Param, StreamableFile } from '@nestjs/common';
import { PagosAportesService } from './pagos-aportes.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Pagos-aportes')
@Controller('pagos-aportes')
export class PagosAportesController {
  constructor(private readonly pagosAportesService: PagosAportesService) {}

  // 1.- CREAR EN BASE DE DATOS EL PAGO Y TAMBIEN LA IMAGEN DEL COMPROBANTE ------------------------------------------
  @Post('create')
  @UseInterceptors(FileInterceptor('foto_comprobante'))
  async createPago(
    @Body() pagoData: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      console.error('No se recibió ningún archivo');
      throw new BadRequestException('No se subió ningún archivo');
    }
    console.log('Archivo procesado:', file.filename);
    return await this.pagosAportesService.createPago(pagoData, file);
  }

  // 2.- LISTAR TODOS LOS PAGOS
  @Get()
  async findAll() {
    return await this.pagosAportesService.findAll();
  }

  // 3.- LISTAR PAGOS PARA VISTA DE EMPLEADOR (ESTADO_ENVIO = 0 , ESTADO_ENVIO = 1)
  @Get('by-id/:id')
  async findByIdPlanilla(@Param('id') id: number) {
    return await this.pagosAportesService.findByIdPlanilla(id);
  }

  // 4.- LISTAR PAGOS PARA VISTA ADMINISTRADOR (ESTADO_ENVIO = 1)
  @Get('by-idAdmin/:id')
  async findByIdPlanillAdmin(@Param('id') id: number) {
    return await this.pagosAportesService.findByIdPlanillAdmin(id);
  }

  //5.-

  @Get('reporte-pago/:id_planilla_aportes')
  @ApiOperation({ summary: 'Generar reporte PDF de recibo de pago de aportes' })
  @ApiResponse({ status: 200, description: 'Reporte PDF generado exitosamente', type: StreamableFile })
  @ApiResponse({ status: 400, description: 'Error al generar el reporte' })
  async generarReportePagoAporte(
    @Param('id_planilla_aportes') id_planilla_aportes: number,
  ): Promise<StreamableFile> {
    try {
      const fileBuffer = await this.pagosAportesService.generarReportePagoAporte(id_planilla_aportes);

      if (!fileBuffer) {
        throw new Error('No se pudo generar el reporte de recibo de pago.');
      }

      return fileBuffer;
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al generar el reporte de recibo de pago',
        details: error.message,
      });
    }
  }

  // 6.- 

  @Get('lista-pagos')
  @ApiOperation({ summary: 'Listar todos los pagos con detalles de empresa y fecha_planilla' })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos con éxito' })
  @ApiResponse({ status: 400, description: 'Error al listar los pagos' })
  async findAllWithDetails() {
    try {
      return await this.pagosAportesService.findAllWithDetails();
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al listar los pagos con detalles',
        details: error.message,
      });
    }
  }



}
