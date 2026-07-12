import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../common/guards/auth.guards';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseService } from './expense.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RequirePermissions('EXPENSE:CREATE')
  @ApiOperation({ summary: 'Create an expense record' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid references' })
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: JwtPayload) {
    return this.expenseService.createExpense(dto, user);
  }

  @Get()
  @RequirePermissions('EXPENSE:VIEW')
  @ApiOperation({ summary: 'List expenses with search, filters, and pagination' })
  findAll(@Query() query: ExpenseQueryDto, @CurrentUser() user: JwtPayload) {
    return this.expenseService.findAll(query, user);
  }

  @Get('statistics')
  @RequirePermissions('EXPENSE:VIEW')
  @ApiOperation({ summary: 'Get expense statistics by status and category' })
  getStatistics(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.expenseService.getExpenseStatistics(dateFrom, dateTo);
  }

  @Get('trip/:tripId')
  @RequirePermissions('EXPENSE:VIEW')
  @ApiOperation({ summary: 'Get all expenses for a trip' })
  @ApiParam({ name: 'tripId', example: 'TR-2001' })
  getTripExpenses(@Param('tripId') tripId: string) {
    return this.expenseService.getTripExpenses(tripId);
  }

  @Get('vehicle/:vehicleId/cost')
  @RequirePermissions('EXPENSE:VIEW')
  @ApiOperation({ summary: 'Calculate vehicle operational cost' })
  calculateVehicleCost(@Param('vehicleId') vehicleId: string) {
    return this.expenseService.calculateVehicleCost(vehicleId);
  }

  @Get(':id')
  @RequirePermissions('EXPENSE:VIEW')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expenseService.findById(id, user);
  }

  @Patch(':id')
  @RequirePermissions('EXPENSE:UPDATE')
  @ApiOperation({ summary: 'Update an expense record' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expenseService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('EXPENSE:DELETE')
  @ApiOperation({ summary: 'Soft delete an expense record' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expenseService.remove(id, user);
  }
}
