import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportesMensualesService } from '../services/reportes-mensuales.service';
import { Response } from 'express';
@ApiTags('Reportes-Mensuales')
@Controller('reportes-mensuales')
export class ReportesMensualesController {
  constructor(private reportesMensualesService: ReportesMensualesService) {}

  @Get('reporte-mensual/:empNpatronal/:periodo/:gestion')
  @ApiOperation({
    summary: 'Generar o Crear el reporte mensual',
  })
  async cambiarEstadoPlanilla(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo') periodo: number,
    @Param('gestion') gestion: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const pdfBufferOrError =
        await this.reportesMensualesService.buscarReporte(
          empNpatronal,
          periodo,
          gestion,
        );

      // Si el resultado tiene un status de 'false', se maneja como un error
      if ('status' in pdfBufferOrError && !pdfBufferOrError.status) {
        res.status(400).send({
          status: false,
          data: null,
          message: pdfBufferOrError.message || 'Error al generar el reporte.',
        });
        return;
      }

      // Para el caso positivo, enviar directamente el buffer PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
      res.end(pdfBufferOrError); // Asumiendo que `pdfBufferOrError` es realmente un buffer cuando es positivo
    } catch (error) {
      // Manejo de errores generales
      res.status(500).send({
        status: false,
        data: null,
        message: 'Hubo un error al generar el reporte.',
      });
    }
  }
}
