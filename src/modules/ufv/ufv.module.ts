import { Module } from '@nestjs/common';
import { UfvService } from './services/ufv.service';
import { UfvController } from './controller/ufv.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UfvEntity } from './entity/ufv.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UfvEntity])],
  providers: [UfvService],
  controllers: [UfvController],
})
export class UfvModule {}
