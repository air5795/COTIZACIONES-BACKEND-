import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException, Get, Param, StreamableFile } from '@nestjs/common';
import { PagosAportesAdicionalesService } from './pagos-aportes-adicionales.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Pagos-aportes-adicionales')
@Controller('pagos-aportes-adicionales')
export class PagosAportesAdicionalesController {
  constructor(private readonly pagosAportesAdicionalesService: PagosAportesAdicionalesService) {}

    // 1.- CREAR EN BASE DE DATOS EL PAGO Y TAMBIEN LA IMAGEN DEL COMPROBANTE ------------------------------------------
    @Post('createAdicional')
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
      return await this.pagosAportesAdicionalesService.createPago(pagoData, file);
    }

      // 3.- LISTAR PAGOS PARA VISTA DE EMPLEADOR (ESTADO_ENVIO = 0 , ESTADO_ENVIO = 1)
      @Get('listar-pagos-empleador/:id')
      async findByIdPlanilla(@Param('id') id: number) {
        return await this.pagosAportesAdicionalesService.findByIdPlanilla(id);
      }

      // 4.- LISTAR PAGOS PARA VISTA ADMINISTRADOR (ESTADO_ENVIO = 1)
      @Get('listar-pagos-admin/:id')
      async findByIdPlanillAdmin(@Param('id') id: number) {
        return await this.pagosAportesAdicionalesService.findByIdPlanillAdmin(id);
      }

      // 5.-

      @Get('reporte-pago-adicional/:id_planilla_adicional')
  @ApiOperation({ summary: 'Generar reporte PDF de recibo de pago de aportes adicionales' })
  @ApiResponse({ status: 200, description: 'Reporte PDF generado exitosamente', type: StreamableFile })
  @ApiResponse({ status: 400, description: 'Error al generar el reporte' })
  async generarReportePagoAporteAdicional(
    @Param('id_planilla_adicional') id_planilla_adicional: number,
  ): Promise<StreamableFile> {
    try {
      const fileBuffer = await this.pagosAportesAdicionalesService.generarReportePagoAporteAdicional(id_planilla_adicional);

      if (!fileBuffer) {
        throw new Error('No se pudo generar el reporte de recibo de pago adicional.');
      }

      return fileBuffer;
    } catch (error) {
      throw new BadRequestException({
        message: 'Error al generar el reporte de recibo de pago adicional',
        details: error.message,
      });
    }
  }

}
