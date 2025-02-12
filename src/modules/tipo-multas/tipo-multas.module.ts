import { Module } from '@nestjs/common';
import { TipoMultasService } from './services/tipo-multas.service';
import { TipoMultasController } from './controller/tipo-multas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoMultasEntity } from './entity/tipo-multas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoMultasEntity])],
  providers: [TipoMultasService],
  controllers: [TipoMultasController],
})
export class TipoMultasModule {}
