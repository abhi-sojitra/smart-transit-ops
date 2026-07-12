import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transports: [
          new winston.transports.Console({
            level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level, message, context, ms }) => {
                return `${timestamp} [${context || 'App'}] ${level}: ${message} ${ms || ''}`;
              }),
            ),
          }),
        ],
      }),
    }),
  ],
})
export class LoggerModule {}
