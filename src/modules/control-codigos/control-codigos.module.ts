import { Module } from '@nestjs/common';
import { ControlCodigosService } from './services/control-codigos.service';
import { ControlCodigosController } from './controller/control-codigos.controller';

@Module({
  providers: [ControlCodigosService],
  controllers: [ControlCodigosController]
})
export class ControlCodigosModule {}
