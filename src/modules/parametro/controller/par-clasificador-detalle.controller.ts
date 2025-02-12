import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ParClasificadorDetalleService } from '../services/par-clasificador-detalle.service';
import { CreateParClasificadorDetalleDto } from '../dto/par-clasificador-detalle.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Parametricas - Cotizaciones')
@Controller('par-clasificador-detalle')
export class ParClasificadorDetalleController {
  constructor(private readonly _parClasificadorDetalleService: ParClasificadorDetalleService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una parametrica',
  })
  async create(@Body() createDto: CreateParClasificadorDetalleDto) {
    return this._parClasificadorDetalleService.create(createDto);
  }

  @Put(':idClasificadorDetalle')
  @ApiOperation({
    summary: 'modificar una paramétrica',
  })
  async update(
    @Param('idClasificadorDetalle', ParseIntPipe) idClasificadorDetalle: number,
    @Body() updateDto: CreateParClasificadorDetalleDto,
  ) {
    return this._parClasificadorDetalleService.update(idClasificadorDetalle, updateDto);
  }

  @Get(':identificadorClasificador')
  @ApiOperation({
    summary: 'Listar todos los tipos de planilla',
  })
  async findAll(
    @Param('identificadorClasificador')
    identificadorClasificador: string,
  ) {
    return await this._parClasificadorDetalleService.findByIdentificador(identificadorClasificador);
  }
}
