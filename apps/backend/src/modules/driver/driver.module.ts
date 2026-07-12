import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schema/driver.schema';
import { DriverRepository } from './driver.repository';
import { DriverService } from './driver.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }])],
  providers: [DriverRepository, DriverService],
  exports: [DriverService, DriverRepository],
})
export class DriverModule {}
