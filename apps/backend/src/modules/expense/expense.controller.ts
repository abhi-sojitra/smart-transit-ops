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
import { RoleCode } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseService } from './expense.service';

const READ_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.ADMIN,
  RoleCode.FLEET_MANAGER,
  RoleCode.FINANCIAL_ANALYST,
  RoleCode.SAFETY_OFFICER,
  RoleCode.OPERATOR,
  RoleCode.VIEWER,
] as const;

const WRITE_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.ADMIN,
  RoleCode.FLEET_MANAGER,
  RoleCode.FINANCIAL_ANALYST,
  RoleCode.OPERATOR,
] as const;

const FULL_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.ADMIN,
  RoleCode.FLEET_MANAGER,
  RoleCode.FINANCIAL_ANALYST,
] as const;

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create an expense record' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid references' })
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: { sub: string; roles: RoleCode[] }) {
    return this.expenseService.createExpense(dto, user);
  }

  @Get()
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List expenses with search, filters, and pagination' })
  findAll(
    @Query() query: ExpenseQueryDto,
    @CurrentUser() user: { sub: string; roles: RoleCode[] },
  ) {
    return this.expenseService.findAll(query, user);
  }

  @Get('statistics')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Get expense statistics by status and category' })
  getStatistics(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.expenseService.getExpenseStatistics(dateFrom, dateTo);
  }

  @Get('trip/:tripId')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Get all expenses for a trip' })
  @ApiParam({ name: 'tripId', example: 'TR-2001' })
  getTripExpenses(@Param('tripId') tripId: string) {
    return this.expenseService.getTripExpenses(tripId);
  }

  @Get('vehicle/:vehicleId/cost')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Calculate vehicle operational cost' })
  calculateVehicleCost(@Param('vehicleId') vehicleId: string) {
    return this.expenseService.calculateVehicleCost(vehicleId);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: RoleCode[] }) {
    return this.expenseService.findById(id, user);
  }

  @Patch(':id')
  @Roles(...FULL_ROLES, RoleCode.OPERATOR)
  @ApiOperation({ summary: 'Update an expense record' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: { sub: string; roles: RoleCode[] },
  ) {
    return this.expenseService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...FULL_ROLES)
  @ApiOperation({ summary: 'Soft delete an expense record' })
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: RoleCode[] }) {
    return this.expenseService.remove(id, user);
  }
}
