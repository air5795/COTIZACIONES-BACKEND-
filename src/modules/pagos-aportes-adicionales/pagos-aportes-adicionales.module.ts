import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PagosAportesAdicionalesService } from './pagos-aportes-adicionales.service';
import { PagosAportesAdicionalesController } from './pagos-aportes-adicionales.controller';
import { PagosAportesAdicionale } from './entities/pagos-aportes-adicionale.entity';
import { multerConfig } from './multer.config';
import { PlanillasAdicionalesModule } from '../planillas_adicionales/planillas_adicionales.module';
import { PlanillasAportesService } from '../planillas_aportes/planillas_aportes.service';
import { PlanillasAportesModule } from '../planillas_aportes/planillas_aportes.module';


@Module({
    imports: [
      TypeOrmModule.forFeature([PagosAportesAdicionale]),
      MulterModule.register(multerConfig),
      PlanillasAdicionalesModule,
      PlanillasAportesModule
    ],
  controllers: [PagosAportesAdicionalesController],
  providers: [PagosAportesAdicionalesService],
})
export class PagosAportesAdicionalesModule {}
