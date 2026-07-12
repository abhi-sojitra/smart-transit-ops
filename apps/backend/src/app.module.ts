import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { RbacModule } from './common/rbac.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { DriverModule } from './modules/driver/driver.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { TripModule } from './modules/trip/trip.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
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
    RbacModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SettingsModule,
    AuditModule,
    NotificationsModule,
    DriverModule,
    FleetModule,
    FuelModule,
    ExpenseModule,
    VehicleModule,
    MaintenanceModule,
    TripModule,
    DashboardModule,
    AnalyticsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
