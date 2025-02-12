import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ExternalApiService } from './service/external-api.service';
import { ExternalApiInterceptor } from 'src/core/interceptor/external-api.interceptor';
import { ApiClientController } from './api-cliente.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  providers: [
    ExternalApiService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ExternalApiInterceptor,
    },
  ],
  controllers: [ApiClientController],
  exports: [ExternalApiService],
  
})
export class ApiClientModule {}
