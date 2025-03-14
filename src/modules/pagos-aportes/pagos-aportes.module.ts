// src/pagos-aportes/pagos-aportes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PagosAportesService } from './pagos-aportes.service';
import { PagosAportesController } from './pagos-aportes.controller';
import { PagoAporte } from './entities/pagos-aporte.entity';
import { multerConfig } from './multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([PagoAporte]),
    MulterModule.register(multerConfig), 
  ],
  controllers: [PagosAportesController],
  providers: [PagosAportesService],
})
export class PagosAportesModule {}