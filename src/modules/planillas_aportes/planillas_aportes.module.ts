import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillasAportesController } from './planillas_aportes.controller';
import { PlanillasAportesService } from './planillas_aportes.service';
import { PlanillasAporte } from './entities/planillas_aporte.entity';
import { PlanillaAportesDetalles } from './entities/planillas_aportes_detalles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanillasAporte, PlanillaAportesDetalles]),
  ],
  controllers: [PlanillasAportesController],
  providers: [PlanillasAportesService],
})
export class PlanillasAportesModule {}
