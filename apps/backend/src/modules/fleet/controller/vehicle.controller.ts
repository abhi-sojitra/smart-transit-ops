import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleCode, type JwtPayload } from '@transitops/shared-types';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards/auth.guards';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { VehicleService } from '../service/vehicle.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { UpdateVehicleStatusDto } from '../dto/update-vehicle-status.dto';
import { UpdateMileageDto } from '../dto/update-mileage.dto';
import { QueryVehicleDto } from '../dto/query-vehicle.dto';
import {
  VehicleResponseDto,
  VehicleStatisticsResponseDto,
  PaginatedVehiclesResponseDto,
} from '../dto';

@ApiTags('Fleet')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN, RoleCode.FLEET_MANAGER)
  @ApiOperation({
    summary: 'Create vehicle',
    description:
      'Creates a new fleet vehicle. Vehicle ID, registration number, and VIN must be unique.',
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehicle created', type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed or business rule violated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Duplicate unique field' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user?: JwtPayload) {
    return this.vehicleService.create(dto, user);
  }

  @Get()
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.ADMIN,
    RoleCode.FLEET_MANAGER,
    RoleCode.SAFETY_OFFICER,
    RoleCode.DISPATCHER,
  )
  @ApiOperation({
    summary: 'List vehicles',
    description: 'Paginated vehicle list with search, filters, and sorting. Soft-deleted vehicles are excluded.',
  })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved', type: PaginatedVehiclesResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryVehicleDto) {
    return this.vehicleService.findAll(query);
  }

  @Get('available')
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.ADMIN,
    RoleCode.FLEET_MANAGER,
    RoleCode.SAFETY_OFFICER,
    RoleCode.DISPATCHER,
  )
  @ApiOperation({
    summary: 'List available vehicles',
    description:
      'Returns vehicles with Available status and valid compliance documents. Intended for Trip assignment.',
  })
  @ApiResponse({ status: 200, description: 'Available vehicles', type: [VehicleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAvailable() {
    return this.vehicleService.getAvailableVehicles();
  }

  @Get('statistics')
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.ADMIN,
    RoleCode.FLEET_MANAGER,
    RoleCode.SAFETY_OFFICER,
    RoleCode.DISPATCHER,
  )
  @ApiOperation({
    summary: 'Vehicle statistics',
    description:
      'Aggregate counts for dashboard cards including compliance expiring and service due soon.',
  })
  @ApiResponse({ status: 200, description: 'Statistics', type: VehicleStatisticsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics() {
    return this.vehicleService.getVehicleStatistics();
  }

  @Get(':id')
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.ADMIN,
    RoleCode.FLEET_MANAGER,
    RoleCode.SAFETY_OFFICER,
    RoleCode.DISPATCHER,
    RoleCode.OPERATOR,
    RoleCode.VIEWER,
  )
  @ApiOperation({
    summary: 'Get vehicle details',
    description: 'Returns a single vehicle by id. Soft-deleted vehicles are not returned.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Vehicle found', type: VehicleResponseDto })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.vehicleService.findById(id);
  }

  @Patch(':id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN, RoleCode.FLEET_MANAGER)
  @ApiOperation({ summary: 'Update vehicle', description: 'Partial update of vehicle profile fields.' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Vehicle updated', type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 409, description: 'Duplicate unique field' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.vehicleService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN, RoleCode.FLEET_MANAGER)
  @ApiOperation({
    summary: 'Soft-delete vehicle',
    description: 'Marks the vehicle as deleted. Deleted vehicles never appear in list endpoints.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Vehicle soft-deleted' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.vehicleService.softDelete(id, user);
  }

  @Patch(':id/status')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN, RoleCode.FLEET_MANAGER, RoleCode.DISPATCHER)
  @ApiOperation({
    summary: 'Update vehicle status',
    description:
      'Updates operational status. Retired or non-compliant vehicles cannot become Available.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateVehicleStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated', type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Business rule violated' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleStatusDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.vehicleService.updateVehicleStatus(id, dto.status, user);
  }

  @Patch(':id/mileage')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN, RoleCode.FLEET_MANAGER, RoleCode.OPERATOR)
  @ApiOperation({
    summary: 'Update vehicle mileage',
    description: 'Sets the current odometer reading. Mileage cannot decrease.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateMileageDto })
  @ApiResponse({ status: 200, description: 'Mileage updated', type: VehicleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid mileage' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  updateMileage(
    @Param('id') id: string,
    @Body() dto: UpdateMileageDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.vehicleService.updateMileage(id, dto.mileage, user);
  }
}
