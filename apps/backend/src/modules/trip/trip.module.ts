import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from './schema/trip.schema';
import { TripRepository } from './repository/trip.repository';
import { TripService } from './service/trip.service';
import { TripController } from './controller/trip.controller';
import { TripValidators } from './validators/trip.validators';
import { VehicleModule } from '../vehicle/vehicle.module';
import { DriverModule } from '../driver/driver.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }]),
    VehicleModule,
    DriverModule,
    MaintenanceModule,
  ],
  controllers: [TripController],
  providers: [TripRepository, TripService, TripValidators],
  exports: [TripService, TripRepository],
})
export class TripModule {}
