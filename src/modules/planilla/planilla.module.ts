import { Module } from '@nestjs/common';
import { PlanillaService } from './services/planilla.service';
import { PlanillaController } from './controller/planilla.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillaEntity } from './entity/planilla.entity';
import { LoggerModule } from '../logger/logger.module';
import { ApiClientModule } from '../api-client/api-client.module';
import { TasaInteresAporteModule } from '../tasa-interes-aporte/tasa-interes-aporte.module';
import { EmpleadoModule } from '../empleado/empleado.module';
import { SalarioMinimoModule } from '../salario-minimo/salario-minimo.module';
import { EmpresaModule } from '../empresa/empresa.module';
import { PlanillaEmpresaModule } from '../planilla-empresa/planilla-empresa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanillaEntity]),
    LoggerModule,
    ApiClientModule,
    TasaInteresAporteModule,
    EmpleadoModule,
    TasaInteresAporteModule,
    SalarioMinimoModule,
    EmpresaModule,
    PlanillaEmpresaModule,
  ],
  providers: [PlanillaService],
  controllers: [PlanillaController],
})
export class PlanillaModule {}
