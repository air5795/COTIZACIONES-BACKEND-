import { Module } from '@nestjs/common';
import { TipoIncapacidadService } from './services/tipo-incapacidad.service';
import { TipoIncapacidadController } from './controller/tipo-incapacidad.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoIncapacidadEntity } from './entity/tipo-incapacidad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoIncapacidadEntity])],
  providers: [TipoIncapacidadService],
  controllers: [TipoIncapacidadController],
})
export class TipoIncapacidadModule {}
