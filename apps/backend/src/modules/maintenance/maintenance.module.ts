import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleModule } from '../vehicle/vehicle.module';
import { MaintenanceController } from './controller/maintenance.controller';
import { MaintenanceRepository } from './repository/maintenance.repository';
import { Maintenance, MaintenanceSchema } from './schema/maintenance.schema';
import { MaintenanceService } from './service/maintenance.service';

@Module({
  imports: [
    VehicleModule,
    MongooseModule.forFeature([{ name: Maintenance.name, schema: MaintenanceSchema }]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository],
  exports: [MaintenanceService, MaintenanceRepository],
})
export class MaintenanceModule {}
