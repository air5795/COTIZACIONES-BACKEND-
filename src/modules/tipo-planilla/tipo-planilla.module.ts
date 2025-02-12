import { Module } from '@nestjs/common';
import { TipoPlanillaService } from './services/tipo-planilla.service';
import { TipoPlanillaController } from './controller/tipo-planilla.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoPlanillaEntity } from './entity/tipo-planilla.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoPlanillaEntity])],
  providers: [TipoPlanillaService],
  controllers: [TipoPlanillaController],
})
export class TipoPlanillaModule {}
