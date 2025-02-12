import { Module } from '@nestjs/common';
import { EmpleadoService } from './services/empleado.service';
import { EmpleadoController } from './controller/empleado.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpleadoEntity } from './entity/empleado.entity';
import { LoggerModule } from '../logger/logger.module';
import { ApiClientModule } from '../api-client/api-client.module';
import { EmpresaModule } from '../empresa/empresa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmpleadoEntity]),
    LoggerModule,
    ApiClientModule,
    EmpresaModule,
  ],
  providers: [EmpleadoService],
  controllers: [EmpleadoController],
  exports: [EmpleadoService],
})
export class EmpleadoModule {}
