import { Module } from '@nestjs/common';
import { SalarioMinimoService } from './services/salario-minimo.service';
import { SalarioMinimoController } from './controller/salario-minimo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalarioMinimoEntity } from './entity/salario-minimo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalarioMinimoEntity])],
  providers: [SalarioMinimoService],
  controllers: [SalarioMinimoController],
  exports: [SalarioMinimoService],
})
export class SalarioMinimoModule {}
