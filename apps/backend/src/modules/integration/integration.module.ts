import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../../schemas/vehicle.schema';
import { Driver, DriverSchema } from '../../schemas/driver.schema';
import { Trip, TripSchema } from '../../schemas/trip.schema';
import { Maintenance, MaintenanceSchema } from '../../schemas/maintenance.schema';
import { Fuel, FuelSchema } from '../../schemas/fuel.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { ReferenceValidationService } from './reference-validation.service';
import { CostCalculationService } from './cost-calculation.service';

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
  providers: [ReferenceValidationService, CostCalculationService],
  exports: [ReferenceValidationService, CostCalculationService, MongooseModule],
})
export class IntegrationModule {}
