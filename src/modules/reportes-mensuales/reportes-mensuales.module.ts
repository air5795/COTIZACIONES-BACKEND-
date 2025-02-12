import { Module } from '@nestjs/common';
import { ReportesMensualesService } from './services/reportes-mensuales.service';
import { ReportesMensualesController } from './controller/reportes-mensuales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesMensualesEntity } from './entity/reportes-mensuales.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportesMensualesEntity])],
  providers: [ReportesMensualesService],
  controllers: [ReportesMensualesController],
})
export class ReportesMensualesModule {}
