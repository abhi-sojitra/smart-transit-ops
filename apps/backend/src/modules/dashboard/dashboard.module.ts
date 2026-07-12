import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../vehicle/schema/vehicle.schema';
import { Driver, DriverSchema } from '../driver/schema/driver.schema';
import { Trip, TripSchema } from '../trip/schema/trip.schema';
import { Maintenance, MaintenanceSchema } from '../maintenance/schema/maintenance.schema';
import { Fuel, FuelSchema } from '../../schemas/fuel.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { DashboardController } from './controller/dashboard.controller';
import { DashboardRepository } from './repository/dashboard.repository';
import { DashboardService } from './service/dashboard.service';
import { StatisticsService } from './service/statistics.service';
import { ReportService } from './service/report.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Trip.name, schema: TripSchema },
      { name: Maintenance.name, schema: MaintenanceSchema },
      { name: Fuel.name, schema: FuelSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardRepository,
    StatisticsService,
    DashboardService,
    ReportService,
  ],
  exports: [DashboardRepository, DashboardService, StatisticsService, ReportService],
})
export class DashboardModule {}
