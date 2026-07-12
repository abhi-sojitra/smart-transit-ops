import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { DriverModule } from './modules/driver/driver.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { envValidationSchema } from './config/env.validation';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    DriverModule,
    FuelModule,
    ExpenseModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
