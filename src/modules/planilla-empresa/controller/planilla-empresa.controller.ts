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
import { ApiBody, ApiOperation, ApiQuery, ApiTags, ApiConsumes, } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/core/utility/pagination-query.dto';
import { ApiResponse } from 'src/core/utility/response-util';
import { PlanillaEmpresaService } from '../services/planilla-empresa.service';

@ApiTags('Planilla-empresa')
@Controller('planilla-empresa')
export class PlanillaEmpresaController {

constructor(private readonly planillaEmpresaService: PlanillaEmpresaService) {}
    
@Get('lista/:estadoPlanilla')
@ApiOperation({
summary: 'Listar las planillas por numero patronal, mes y gestión',
})
async findAllPlanilaEmpleadosByEmpNpatronal(
    @Param('estadoPlanilla') estadoPlanilla: string,
    //@Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.planillaEmpresaService.getAllPlanillaEmpresa(
      estadoPlanilla,
    );
  }
}
