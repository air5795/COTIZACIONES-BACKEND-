import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionalService } from '../services/regional.service';
import { CreateRegionalDto } from '../dto/regional.dto';

@ApiTags('Regional')
@Controller('regional')
export class RegionalController {
  constructor(private regionalService: RegionalService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Crear una regional',
  })
  async create(@Body() createDto: CreateRegionalDto) {
    return this.regionalService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas las Regionales',
  })
  listAll() {
    return this.regionalService.listAll();
  }

  @Get('/:idRegional')
  @ApiOperation({
    summary: 'Listar las empresas que tiene una Regional',
  })
  findByRegionalId(@Param('idRegional', ParseIntPipe) idRegional: number) {
    return this.regionalService.findByRegionalId(idRegional);
  }

  @Get('regionales/:nombreEmpresa')
  @ApiOperation({
    summary: 'Listar las regionales por nombre de empresa',
  })
  findByNomEmpresa(@Param('nombreEmpresa') nombreEmpresa: string) {
    return this.regionalService.findByNomEmpresa(nombreEmpresa);
  }
}
