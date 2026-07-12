import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { Fuel, FuelSchema } from '../../schemas/fuel.schema';
import { ExpenseRepository } from '../../repositories/expense.repository';
import { IntegrationModule } from '../integration/integration.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Fuel.name, schema: FuelSchema },
    ]),
    IntegrationModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService, ExpenseRepository],
  exports: [ExpenseService, ExpenseRepository],
})
export class ExpenseModule {}
