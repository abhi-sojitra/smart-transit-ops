import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Maintenance, MaintenanceSchema } from './schema/maintenance.schema';
import { MaintenanceRepository } from './maintenance.repository';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Maintenance.name, schema: MaintenanceSchema }])],
  providers: [MaintenanceRepository, MaintenanceService],
  exports: [MaintenanceService, MaintenanceRepository],
})
export class MaintenanceModule {}
