import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('bootstrap');
  //app.setGlobalPrefix('api/security/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: { enableImplicitConversion: true },
      transform: true,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('CBES - Caja Bancaria Estatal de Salud')
    .setDescription('DOCUMENTACION DEL SISTEMA DE COTIZACIONES')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      filter: true,
    },
  });
  app.enableCors();

  await app.listen(process.env.PORT || 4000);
  logger.log(
    `API-SisAdmin Ready: Development on Line! on PORT: ${process.env.PORT}`,
  );
}
bootstrap();
