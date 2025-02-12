import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EmpleadoService } from '../services/empleado.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { CreateEmpleadoNoVerificado } from '../dto/empleado.dto';

@ApiTags('Empleado')
@Controller('empleado')
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

  @Post()
  @ApiOperation({ summary: 'Insercion Masiva de Empleados' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos para inserción masiva',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir',
        },
        empPatronal: {
          type: 'string',
          description: 'Número patronal',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file, @Body() body: any) {
    const empPatronal = body.empPatronal;
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }
    return this.empleadoService.migrarEmplados(file, empPatronal);
  }

  @Get('lista-empleados/:numPatronal')
  @ApiOperation({
    summary: 'Listar los empleados por numero patronal',
  })
  async findEmpleadoByEmpNpatronal(
    @Param('numPatronal') numPatronal: string,
    @Query('') paginationQuery: PaginationQueryDto,
  ) {
    return this.empleadoService.findAllEmpleadosByEmpNpatronal(
      numPatronal,
      paginationQuery,
    );
  }

  //Buscador de empleados por CI o Matricula
  @Get('search-like-empleado/:empNpatronal')
  async findEmpleadosByCITitOrMatTitAndEmpNpatronal(
    @Param('empNpatronal') empNpatronal: string,
    @Query() pagination: PaginationQueryDto,
    @Query('searchTerm') searchTerm: string, // CI o Matricula
    @Query('isCITit') isCITit: boolean, // true: CI, false: Matricula
  ) {
    return this.empleadoService.findEmpleadosByCITitOrMatTitAndEmpNpatronal(
      empNpatronal,
      pagination,
      searchTerm,
      isCITit,
    );
  }

   //Buscador de empleados por CI
   @Get('busca-empleado/:carnet')
   async findEmpleadoByCarnet(
     @Param('carnet') carnet: number
   ) {
     return this.empleadoService.findEmpleadoByCarnet(
        carnet,
     );
   }

  //Buscador de empleados por CI o Matricula
  @Patch('delete-logico/:idEmpleado/:aseCi/:fechaBaja/:observaciones')
  @ApiOperation({
    summary: 'Eliminacion logica de un empleado',
  })
  async deleteLogico(
    @Param('idEmpleado') idEmpleado: number,
    @Param('aseCi') aseCi: string,
    @Param('fechaBaja') fechaBaja: Date,
    @Param('observaciones') observaciones: string,
  ) {
    return this.empleadoService.deleteLogico(
      idEmpleado,
      aseCi,
      fechaBaja,
      observaciones,
    );
  }

  @Get('find-all-empleados/:empNpatronal')
  @ApiOperation({
    summary: 'Listar todos los empleados por numero patronal',
  })
  async findAllByNpatronal(@Param('empNpatronal') empNpatronal: string) {
    return this.empleadoService.findAllByNpatronal(empNpatronal);
  }

  @Post('crear-empleado-no-afiliado')
  @ApiOperation({
    summary: 'Crear un empleado',
  })
  crearEmpleado(@Body() dto: CreateEmpleadoNoVerificado) {
    return this.empleadoService.createEmpleadoNoVerificado(dto);
  }

  @Get('empleados-by-numPatronal/:numPatronal')
  @ApiOperation({
    summary: 'Obtener empleados por numero patronal cesantia, vigente, baja',
  })
  async obtenerIdEmpresaByEmpNpatronal(
    @Param('numPatronal') numPatronal: string,
  ) {
    return this.empleadoService.obtenerEmpleadosApiExternoByEmpNpatronal(
      numPatronal,
    );
  }
}
