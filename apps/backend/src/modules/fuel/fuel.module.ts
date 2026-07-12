import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Fuel, FuelSchema } from '../../schemas/fuel.schema';
import { FuelRepository } from '../../repositories/fuel.repository';
import { IntegrationModule } from '../integration/integration.module';
import { FuelController } from './fuel.controller';
import { FuelService } from './fuel.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fuel.name, schema: FuelSchema }]),
    IntegrationModule,
  ],
  controllers: [FuelController],
  providers: [FuelService, FuelRepository],
  exports: [FuelService, FuelRepository],
})
export class FuelModule {}
