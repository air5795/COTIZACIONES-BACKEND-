import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { TipoPlanillaService } from '../services/tipo-planilla.service';
import { CreateTipoPlanillaDto } from '../dto/tipo-planilla.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Tipo Planilla')
@Controller('tipo-planilla')
export class TipoPlanillaController {
  constructor(private readonly tipoPlanillaService: TipoPlanillaService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un tipo de planilla',
  })
  async create(@Body() createDto: CreateTipoPlanillaDto) {
    return this.tipoPlanillaService.create(createDto);
  }

  @Put(':idTipoPlanilla')
  @ApiOperation({
    summary: 'modificar un tipo de planilla',
  })
  async update(
    @Param('idTipoPlanilla', ParseIntPipe) idTipoPlanilla: number,
    @Body() updateDto: CreateTipoPlanillaDto,
  ) {
    return this.tipoPlanillaService.update(idTipoPlanilla, updateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los tipos de planilla',
  })
  async findAll() {
    return await this.tipoPlanillaService.findAll();
  }
}
