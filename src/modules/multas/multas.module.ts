import { Module } from '@nestjs/common';
import { MultasService } from './services/multas.service';
import { MultasController } from './controller/multas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultasEntity } from './entity/multas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MultasEntity])],
  providers: [MultasService],
  controllers: [MultasController],
})
export class MultasModule {}
