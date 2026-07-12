import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './schema/vehicle.schema';
import { VehicleRepository } from './vehicle.repository';
import { VehicleService } from './vehicle.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }])],
  providers: [VehicleRepository, VehicleService],
  exports: [MongooseModule, VehicleService, VehicleRepository],
})
export class VehicleModule {}
