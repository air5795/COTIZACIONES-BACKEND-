import { Module } from '@nestjs/common';
import { RegionalController } from './controller/regional.controller';
import { RegionalService } from './services/regional.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionalEntity } from './entity/regional.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegionalEntity])],
  controllers: [RegionalController],
  providers: [RegionalService],
})
export class RegionalModule {}
