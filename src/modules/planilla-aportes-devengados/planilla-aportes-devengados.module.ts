import { Module } from '@nestjs/common';
import { PlanillaAportesDevengadosService } from './services/planilla-aportes-devengados.service';
import { PlanillaAportesDevengadosController } from './controller/planilla-aportes-devengados.controller';

@Module({
  providers: [PlanillaAportesDevengadosService],
  controllers: [PlanillaAportesDevengadosController]
})
export class PlanillaAportesDevengadosModule {}
