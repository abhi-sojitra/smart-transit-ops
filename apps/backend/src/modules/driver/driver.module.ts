import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schema/driver.schema';
import { DriverRepository } from './repository/driver.repository';
import { DriverService } from './service/driver.service';
import { DriverController } from './controller/driver.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }])],
  controllers: [DriverController],
  providers: [DriverService, DriverRepository],
  exports: [MongooseModule, DriverService, DriverRepository],
})
export class DriverModule {}
