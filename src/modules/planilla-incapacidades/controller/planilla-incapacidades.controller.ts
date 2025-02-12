import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlanillaIncapacidadesService } from '../services/planilla-incapacidades.service';
import { CreatePlanillaIncapacidadDto } from '../dto/planilla-incapacidad.dto';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { Response } from 'express'; // Importa Response

@ApiTags('Planilla Incapacidades')
@Controller('planilla-incapacidades')
export class PlanillaIncapacidadesController {
  constructor(
    private planillaIncapacidadesService: PlanillaIncapacidadesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una planilla de incapacidades para un empleado',
  })
  createPlanillaIncacidades(@Body() planillaDto: CreatePlanillaIncapacidadDto) {
    return this.planillaIncapacidadesService.createPlanillaIncapacidades(
      planillaDto,
    );
  }

  @Get(':numPatronal/:idIncapacidad/:fechaInicio/:fechaFin')
  @ApiOperation({
    summary: 'Listar los empleados por tipo de planilla de discapacidad',
  })
  async findEmpleadoByEmpNpatronal(
    @Param('numPatronal') numPatronal: string,
    @Param('idIncapacidad') idIncapacidad: number,
    @Param('fechaInicio') fechaInicio: Date,
    @Param('fechaFin') fechaFin: Date,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.planillaIncapacidadesService.findAllPlanillaIncapacidadesByEmpNpatronal(
      numPatronal,
      idIncapacidad,
      fechaInicio,
      fechaFin,
      paginationQuery,
    );
  }

  @Get('pdf/:numPatronal/:idIncapacidad/:fechaInicio/:fechaFin')
  @ApiOperation({
    summary: 'Generar PDF de la planilla de incapacidades desde ODT',
  })
  async generatePlanillaIncapacidadesPdfFromOdt(
    @Param('numPatronal') numPatronal: string,
    @Param('idIncapacidad') idIncapacidad: number,
    @Param('fechaInicio') fechaInicio: Date,
    @Param('fechaFin') fechaFin: Date,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer =
        await this.planillaIncapacidadesService.generatePdfFromOdtPlanillaIncapacidades(
          numPatronal,
          idIncapacidad,
          fechaInicio,
          fechaFin,
        );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=planilla-incapacidades.pdf',
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF from ODT:', error);
      res.status(500).send('Error generating PDF from ODT');
    }
  }
}
