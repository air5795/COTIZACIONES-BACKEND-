import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillasAportesController } from './planillas_aportes.controller';
import { PlanillasAportesService } from './planillas_aportes.service';
import { PlanillasAporte } from './entities/planillas_aporte.entity';
import { PlanillaAportesDetalles } from './entities/planillas_aportes_detalles.entity';
import { PagoAporte } from '../pagos-aportes/entities/pagos-aporte.entity';
import { Http } from 'winston/lib/winston/transports';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanillasAporte, PlanillaAportesDetalles, PagoAporte]),
    HttpModule,
  ],
  controllers: [PlanillasAportesController],
  providers: [PlanillasAportesService],
  exports: [PlanillasAportesService], 
})
export class PlanillasAportesModule {}