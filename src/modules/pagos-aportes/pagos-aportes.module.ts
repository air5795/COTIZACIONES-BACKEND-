import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PagosAportesService } from './pagos-aportes.service';
import { PagosAportesController } from './pagos-aportes.controller';
import { PagoAporte } from './entities/pagos-aporte.entity';
import { multerConfig } from './multer.config';
import { PlanillasAportesModule } from '../planillas_aportes/planillas_aportes.module'; // Importa el módulo

@Module({
  imports: [
    TypeOrmModule.forFeature([PagoAporte]),
    MulterModule.register(multerConfig),
    PlanillasAportesModule,
  ],
  controllers: [PagosAportesController],
  providers: [PagosAportesService],
})
export class PagosAportesModule {}