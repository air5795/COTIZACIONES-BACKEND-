import { Module } from '@nestjs/common';
import { ResumenMensualRegionalService } from './services/resumen-mensual-regional.service';
import { ResumenMensualRegionalController } from './controller/resumen-mensual-regional.controller';

@Module({
  providers: [ResumenMensualRegionalService],
  controllers: [ResumenMensualRegionalController],
})
export class ResumenMensualRegionalModule {}
