import { Module } from '@nestjs/common';
import { PlanillaEmpresaService } from './services/planilla-empresa.service';
import { PlanillaEmpresaController } from './controller/planilla-empresa.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillaEmpresaEntity } from './entity/planilla-empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanillaEmpresaEntity])],
  providers: [PlanillaEmpresaService],
  controllers: [PlanillaEmpresaController],
  exports: [PlanillaEmpresaService],
})
export class PlanillaEmpresaModule {}
