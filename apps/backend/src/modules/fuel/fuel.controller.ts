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
import { CreateFuelDto } from './dto/create-fuel.dto';
import { FuelQueryDto } from './dto/fuel-query.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { FuelService } from './fuel.service';

@ApiTags('Fuel')
@ApiBearerAuth()
@Controller('fuel')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post()
  @RequirePermissions('FUEL:CREATE')
  @ApiOperation({ summary: 'Create a fuel log entry' })
  @ApiResponse({ status: 201, description: 'Fuel log created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid references' })
  create(@Body() dto: CreateFuelDto, @CurrentUser() user: JwtPayload) {
    return this.fuelService.createFuelLog(dto, user);
  }

  @Get()
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'List fuel logs with search, filters, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated fuel logs' })
  findAll(@Query() query: FuelQueryDto, @CurrentUser() user: JwtPayload) {
    return this.fuelService.findAll(query, user);
  }

  @Get('statistics')
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'Get fuel statistics and trends' })
  @ApiResponse({ status: 200, description: 'Fuel statistics' })
  getStatistics(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.fuelService.getFuelStatistics(dateFrom, dateTo);
  }

  @Get('vehicle/:vehicleId/history')
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'Get fuel history for a vehicle' })
  @ApiParam({ name: 'vehicleId', example: 'VH-1001' })
  getVehicleHistory(@Param('vehicleId') vehicleId: string) {
    return this.fuelService.getVehicleFuelHistory(vehicleId);
  }

  @Get('vehicle/:vehicleId/cost')
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'Calculate vehicle operational cost' })
  calculateVehicleCost(@Param('vehicleId') vehicleId: string) {
    return this.fuelService.calculateVehicleCost(vehicleId);
  }

  @Get('trip/:tripId/cost')
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'Calculate trip operational cost' })
  calculateTripCost(@Param('tripId') tripId: string) {
    return this.fuelService.calculateTripCost(tripId);
  }

  @Get('comparison/vehicles')
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'Compare fuel costs across vehicles' })
  getVehicleComparison() {
    return this.fuelService.getVehicleCostComparison();
  }

  @Get(':id')
  @RequirePermissions('FUEL:VIEW')
  @ApiOperation({ summary: 'Get fuel log by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 404, description: 'Fuel log not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.fuelService.findById(id, user);
  }

  @Patch(':id')
  @RequirePermissions('FUEL:UPDATE')
  @ApiOperation({ summary: 'Update a fuel log' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFuelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fuelService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('FUEL:DELETE')
  @ApiOperation({ summary: 'Soft delete a fuel log' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.fuelService.remove(id, user);
  }
}
