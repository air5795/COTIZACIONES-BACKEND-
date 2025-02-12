import { Module } from '@nestjs/common';
import { TasaInteresAporteService } from './services/tasa-interes-aporte.service';
import { TasaInteresAporteController } from './controller/tasa-interes-aporte.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasaInteresAporteEntity } from './entity/tasa-interes-aporte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TasaInteresAporteEntity])],
  providers: [TasaInteresAporteService],
  controllers: [TasaInteresAporteController],
  exports: [TasaInteresAporteService],
})
export class TasaInteresAporteModule {}
