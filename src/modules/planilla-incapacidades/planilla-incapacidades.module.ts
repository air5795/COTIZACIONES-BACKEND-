import { Module } from '@nestjs/common';
import { PlanillaIncapacidadesService } from './services/planilla-incapacidades.service';
import { PlanillaIncapacidadesController } from './controller/planilla-incapacidades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillaIncapacidadEntity } from './entity/planilla-incapacidades.entity';
import { EmpresaModule } from 'src/modules/empresa/empresa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanillaIncapacidadEntity]),
    EmpresaModule,
  ],
  providers: [PlanillaIncapacidadesService],
  controllers: [PlanillaIncapacidadesController],
})
export class PlanillaIncapacidadesModule {}
