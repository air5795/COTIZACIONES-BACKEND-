import { Module } from '@nestjs/common';
import { TipoCiteService } from './services/tipo-cite.service';
import { TipoCiteController } from './controller/tipo-cite.controller';

@Module({
  providers: [TipoCiteService],
  controllers: [TipoCiteController]
})
export class TipoCiteModule {}
