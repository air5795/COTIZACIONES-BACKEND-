import { Module } from '@nestjs/common';
import { ParClasificadorDetalleService } from './services/par-clasificador-detalle.service';
import { ParClasificadorDetalleController } from './controller/par-clasificador-detalle.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParClasificadorDetalle } from './entity/par-clasificador-detalle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParClasificadorDetalle])],
  providers: [ParClasificadorDetalleService],
  controllers: [ParClasificadorDetalleController],
})
export class ParClasificadorDetalleModule {}
