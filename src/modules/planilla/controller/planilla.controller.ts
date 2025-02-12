import {
  BadRequestException,
  Controller,
  Body,
  Put,
  Param,
  Get,
  Query,
  Post,
  ParseIntPipe,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { PlanillaService } from '../services/planilla.service';
import { ApiBody, ApiOperation, ApiQuery, ApiTags, ApiConsumes, } from '@nestjs/swagger';
import {
  CreatePlanillaDto,
  UpdatePlanillaMasivaDto,
} from '../dto/planilla.dto';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { ApiResponse } from 'src/core/utility/response-util';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiTags('Planilla')
@Controller('planilla')
export class PlanillaController {
  constructor(private readonly planillaService: PlanillaService) {}

  @Post('migrar-planillas')
  @ApiOperation({ summary: 'Insercion Masiva de Planillas' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos para inserción masiva',
    schema: {
      type: 'object',
      properties: {
        mes: {
          type: 'number',
          description: 'Mes del cargado de la planilla',
        },
        gestion: {
          type: 'number',
          description: 'Gestión del cargado de la planilla',
        },
        empPatronal: {
          type: 'string',
          description: 'Número patronal',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir',
        },
        
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFilePlanillas(@UploadedFile() file, @Body() body: any) {
    const mes = body.mes;
    const gestion = body.gestion;
    const empPatronal = body.empPatronal;
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }
    return this.planillaService.migrarPlanillas(mes, gestion, empPatronal, file);
  }

  @Put()
  @ApiOperation({
    summary: 'Modificación masiva de planillas de sueldos de forma masiva',
  })
  @ApiBody({ type: [UpdatePlanillaMasivaDto] })
  async updateMasivo(@Body() updatePlanillaDto: UpdatePlanillaMasivaDto[]) {
    return await this.planillaService.updateMasivo(updatePlanillaDto);
  }

  @Put('valida-afiliaciones')
  @ApiOperation({
    summary: 'Validación de la información migrada de planillas con el Sistema de Afilicaciones de forma masiva',
  })
  @ApiBody({
    description: 'Datos para la validacion masiva con el Sistema de Afiliaciones',
    schema: {
      type: 'object',
      properties: {
        mes: {
          type: 'number',
          description: 'Mes del cargado de la planilla',
        },
        gestion: {
          type: 'number',
          description: 'Gestión del cargado de la planilla',
        },
        empPatronal: {
          type: 'string',
          description: 'Número patronal',
        },
      },
    },
  })
  async validaAfiliaciones(@Body() body: any) {
    const mes = body.mes;
    const gestion = body.gestion;
    const empPatronal = body.empPatronal;
    return this.planillaService.validaAfiliaciones(mes, gestion, empPatronal);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'modificar planilla de sueldos',
  })
  async update(
    @Param('id') id: number,
    @Body() updatePlanillaDto: CreatePlanillaDto,
  ) {
    return await this.planillaService.update(id, updatePlanillaDto);
  }

  @Post('generarPlanillas/:empNpatronal/:periodo/:gestion')
  @ApiOperation({
    summary: 'Genero planillas de manera dinamica',
  })
  async generadorDePlanilla(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo', ParseIntPipe) periodo: number,
    @Param('gestion', ParseIntPipe) gestion: number,
  ) {
    return await this.planillaService.generadorDePlanilla(
      empNpatronal,
      periodo,
      gestion,
    );
  }

  @Get('generarPlanillas/excel-carbone/:empNpatronal/:periodo/:gestion')
  @ApiOperation({
    summary: 'Genero planillas de manera dinamica',
  })
  async generadorDePlanillaExcelCarbone(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo', ParseIntPipe) periodo: number,
    @Param('gestion', ParseIntPipe) gestion: number,
    @Res() response: Response,
  ) {
    try {
      const excelBuffer =
        await this.planillaService.generarPlanillaExcelCarbone(
          empNpatronal,
          periodo,
          gestion,
        );

      // Configurar las cabeceras de la respuesta para indicar que es un archivo descargable
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=planilla.xlsx',
      );
      response.type(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.send(excelBuffer);
    } catch (error) {
      // Manejar errores, por ejemplo, enviar una respuesta con un mensaje de error
      response.status(500).send('Hubo un error al generar el reporte.');
    }
  }

  @Get('lista-empleados-planilla/:empNpatronal/:periodo/:gestion')
  @ApiOperation({
    summary: 'Listar las planillas por numero patronal, mes y gestión',
  })
  async findAllPlanilaEmpleadosByEmpNpatronal(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo', ParseIntPipe) periodo: number,
    @Param('gestion', ParseIntPipe) gestion: number,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.planillaService.findAllPlanilaEmpleadosByEmpNpatronal(
      empNpatronal,
      periodo,
      gestion,
      paginationQuery,
    );
  }

  @Get('genera-excel-masiva/:empNpatronal/:periodo/:gestion')
  @ApiOperation({
    summary: 'Generar con exceljs el cargado masivo de planilla de sueldos',
  })
  async generarExcelMasiva(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo', ParseIntPipe) periodo: number,
    @Param('gestion', ParseIntPipe) gestion: number,
    @Res() response: Response,
  ): Promise<ApiResponse<Buffer> | void> {
    try {
      const excelBuffer = await this.planillaService.generarExcelMasiva(
        empNpatronal,
        periodo,
        gestion,
      );

      if ('status' in excelBuffer && !excelBuffer.status) {
        response.status(400).send(excelBuffer.message);
        return;
      }
      // Configurar las cabeceras de la respuesta para indicar que es un archivo descargable
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=reporte.xlsx',
      );
      response.type(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.send(excelBuffer);
    } catch (error) {
      // Manejar errores, por ejemplo, enviar una respuesta con un mensaje de error
      response.status(500).send('Hubo un error al generar el reporte.');
    }
  }

  //Buscador de empleados por CI o Matricula
  @Get('search-like-empleado-planilla/:empNpatronal/:periodo/:gestion')
  @ApiOperation({
    summary: 'Lista los empleados por CI o Matricula por ilike',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Cantidad de ítems por página',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'searchTerm',
    description: 'CI o Matricula para búsqueda',
    type: String,
    required: true, // Cambia a false si es opcional
  })
  @ApiQuery({
    name: 'isCITit',
    description: 'Determina si se busca por CI (true) o Matricula (false)',
    type: Boolean,
    required: true, // Cambia a false si es opcional
  })
  async findEmpleadosByCITitOrMatTitAndEmpNpatronal(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo') periodo: number,
    @Param('gestion') gestion: number,
    @Query() pagination: PaginationQueryDto,
    @Query('searchTerm') searchTerm: string, // CI o Matricula
    @Query('isCITit') isCITit: boolean, // true: CI, false: Matricula
  ) {
    return this.planillaService.findAllPlanilaEmpleadosByCIorMatTitAndEmpNpatronal(
      empNpatronal,
      periodo,
      gestion,
      pagination,
      searchTerm,
      isCITit,
    );
  }

  @Put('cambio-de-estado-planilla/:empNpatronal/:periodo/:gestion/:estado')
  @ApiOperation({
    summary:
      'Cambio de estado de la planilla, se manejan 4 estados, inicializado, enviado, cancelado, aprobado',
  })
  cambiarEstadoPlanilla(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo') periodo: number,
    @Param('gestion') gestion: number,
    @Param('estado') estado: string,
  ) {
    return this.planillaService.cambiarEstadoPlanilla(
      empNpatronal,
      periodo,
      gestion,
      estado,
    );
  }

  @Get('obtener-estado-planilla/:empNpatronal/:periodo/:gestion/')
  @ApiOperation({
    summary:
      'Obtener de estado de la planilla, se manejan 4 estados, inicializado, enviado, cancelado, aprobado',
  })
  obtenerEstadoDeUnaPlanilla(
    @Param('empNpatronal') empNpatronal: string,
    @Param('periodo') periodo: number,
    @Param('gestion') gestion: number,
  ) {
    return this.planillaService.obtenerEstadoDeUnaPlanilla(
      empNpatronal,
      periodo,
      gestion,
    );
  }
}
