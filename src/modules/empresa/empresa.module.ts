import { Module } from '@nestjs/common';
import { EmpresaController } from './controller/empresa.controller';
import { EmpresaService } from './services/empresa.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaEntity } from './entity/empresa.entity';
import { LoggerModule } from '../logger/logger.module';
import { ApiClientModule } from '../api-client/api-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmpresaEntity]),
    LoggerModule,
    ApiClientModule,
  ],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService],
})
export class EmpresaModule {}
