import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../vehicle/schema/vehicle.schema';
import { Driver, DriverSchema } from '../driver/schema/driver.schema';
import { Trip, TripSchema } from '../trip/schema/trip.schema';
import { Maintenance, MaintenanceSchema } from '../maintenance/schema/maintenance.schema';
import { Fuel, FuelSchema } from '../../schemas/fuel.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { ReportSchedule, ReportScheduleSchema } from './schema/report-schedule.schema';
import { ReportsController } from './controller/reports.controller';
import { ReportsRepository } from './repository/reports.repository';
import { ReportsService } from './service/reports.service';
import { ReportInsightsService } from './service/insights.service';
import { ReportExportService } from './export/report-export.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Trip.name, schema: TripSchema },
      { name: Maintenance.name, schema: MaintenanceSchema },
      { name: Fuel.name, schema: FuelSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: ReportSchedule.name, schema: ReportScheduleSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsRepository,
    ReportInsightsService,
    ReportExportService,
    ReportsService,
  ],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
