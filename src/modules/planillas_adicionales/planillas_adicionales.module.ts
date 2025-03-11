import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillasAdicionalesService } from './planillas_adicionales.service';
import { PlanillasAdicionalesController } from './planillas_adicionales.controller';
import { PlanillasAdicionale } from './entities/planillas_adicionale.entity';
import { PlanillaAdicionalDetalles } from './entities/planillas_adicionales_detalles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanillasAdicionale, PlanillaAdicionalDetalles]),
  ],
  controllers: [PlanillasAdicionalesController],
  providers: [PlanillasAdicionalesService],
})
export class PlanillasAdicionalesModule {}
