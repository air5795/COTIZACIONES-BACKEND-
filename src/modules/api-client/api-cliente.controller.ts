import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExternalApiService } from './service/external-api.service';
@ApiTags('Servicios SIIGA - CBES')
@Controller('servicios-externos')
export class ApiClientController {
  constructor(private readonly externalApiService: ExternalApiService) {}
  @ApiBearerAuth()
  @Get('LoginSiigah')
  findAll() {
    return this.externalApiService.loginToExternalApi();
  }
  @ApiBearerAuth()
  @Get('GetAseguradoCi/:ci')
  GetAseguradoCi(@Param('ci') ci: string) {
    return this.externalApiService.getAseguradoByCi(ci);
  }
  @ApiBearerAuth()
  @Get('GetAseguradoMat/:mat')
  GetAseguradoMatricula(@Param('mat') mat: string) {
    return this.externalApiService.getAseguradoByMatricula(mat);
  }

  @ApiBearerAuth()
@Get('GetEmpresaByNroPatronal/:npatronal')
GetEmpresaByNroPatronal(@Param('npatronal') npatronal: string) {
  return this.externalApiService.getEmpresaByNroPatronal(npatronal);
}

@ApiBearerAuth()
@Get('GetAllEmpresas')
GetAllEmpresas() {
  return this.externalApiService.getAllEmpresas();
}


}
