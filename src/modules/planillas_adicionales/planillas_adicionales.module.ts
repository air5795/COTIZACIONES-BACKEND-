import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; // Importación correcta de HttpModule
import { PlanillasAdicionalesService } from './planillas_adicionales.service';
import { PlanillasAdicionalesController } from './planillas_adicionales.controller';
import { PlanillasAdicionale } from './entities/planillas_adicionale.entity';
import { PlanillaAdicionalDetalles } from './entities/planillas_adicionales_detalles.entity';
import { PlanillasAporte } from '../planillas_aportes/entities/planillas_aporte.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanillasAdicionale,
      PlanillaAdicionalDetalles,
      PlanillasAporte,
    ]),
    HttpModule, // Mueve HttpModule aquí, fuera de TypeOrmModule.forFeature
  ],
  controllers: [PlanillasAdicionalesController],
  providers: [PlanillasAdicionalesService],
  exports: [PlanillasAdicionalesService],
})
export class PlanillasAdicionalesModule {}