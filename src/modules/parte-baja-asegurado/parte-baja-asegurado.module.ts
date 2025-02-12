import { Module } from '@nestjs/common';
import { ParteBajaAseguradoService } from './services/parte-baja-asegurado.service';
import { ParteBajaAseguradoController } from './controller/parte-baja-asegurado.controller';

@Module({
  providers: [ParteBajaAseguradoService],
  controllers: [ParteBajaAseguradoController]
})
export class ParteBajaAseguradoModule {}
