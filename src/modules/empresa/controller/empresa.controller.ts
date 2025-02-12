import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { EmpresaService } from '../services/empresa.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';

@ApiTags('Empresa')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar Empresas' })
  findAll() {
    return this.empresaService.findAll();
  }

  @Get('empresas-nombre')
  @ApiOperation({
    summary: 'Listar Nombre de las empresas Empresas sin repeticiones',
  })
  findAllNombreEmpresas() {
    return this.empresaService.findAllNombreEmpresa();
  }

  @Post('empresa/:nroPatronal')
  @ApiOperation({
    summary: 'Insertar empresa por numero patronal - coneccion api externa ',
  })
  findEmpresaByNroPatronal(@Param('nroPatronal') nroPatronal: string) {
    return this.empresaService.findEmpresaByNroPatronal(nroPatronal);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por el idEmpresa' })
  findOne(@Param('id') id: string) {
    return this.empresaService.findOne(id);
  }

  @Get('byRegional/:idRegional')
  @ApiOperation({
    summary: 'Listar empresas por id regional ',
  })
  async getEmpresasByRegional(
    @Param('idRegional', ParseIntPipe) idRegional: number,
  ) {
    return this.empresaService.findEmpresaByRegional(idRegional);
  }

  @Get('numPatronal/:numPatronal')
  @ApiOperation({
    summary: 'Listar empresas por numero patronal ',
  })
  async getEmpresasByNumPatronal(@Param('numPatronal') numPatronal: string) {
    return this.empresaService.findEmpresaByNumeroPatronal(numPatronal);
  }

  @Get('empleados-planilla/:numPatronal')
  @ApiOperation({
    summary:
      'Listar los empleados por numero patronal para realizar la planilla de sueldos ',
  })
  async findEmpleadoByEmpNpatronal(
    @Param('numPatronal') numPatronal: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.empresaService.findEmpleadoByEmpNpatronal(
      numPatronal,
      paginationQuery,
    );
  }

  @Get('regional-empresa/:empNpatronal')
  @ApiOperation({
    summary:
      'Listar los empleados por numero patronal para realizar la planilla de sueldos ',
  })
  async findRegionalByEmpNpatronal(
    @Param('empNpatronal') empNpatronal: string,
  ) {
    return this.empresaService.findRegionalByEmpNpatronal(empNpatronal);
  }

  @Get('empresa/obtener-id/:numPatronal')
  @ApiOperation({
    summary: 'Obtener idEmpresa por numero patronal ',
  })
  async obtenerIdEmpresaByEmpNpatronal(
    @Param('numPatronal') numPatronal: string,
  ) {
    return this.empresaService.obtenerIdEmpresaByEmpNpatronal(numPatronal);
  }
}
