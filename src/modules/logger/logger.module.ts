import { Module } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      format: winston.format.printf(
        ({ context, level, message, timestamp }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        },
      ),
      level: 'info', // nivel de log global para todos los transports
      transports: [
        // Console Transport
        new winston.transports.Console({
          level: 'debug', // nivel de log específico para este transport
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike(),
          ),
        }),

        // File Transport para errores
        new winston.transports.File({
          level: 'error', // sólo registrar niveles de 'error' y más severos
          filename: 'application-error.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),

        // File Transport para todo tipo de logs
        new winston.transports.File({
          level: 'info', // registrar desde nivel 'info' y más severos
          filename: 'application.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
