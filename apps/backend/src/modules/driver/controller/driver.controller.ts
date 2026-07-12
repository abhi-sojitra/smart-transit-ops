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
import { type JwtPayload } from '@transitops/shared-types';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../common/guards/auth.guards';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DriverService } from '../service/driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { UpdateDriverStatusDto } from '../dto/update-driver-status.dto';
import { UpdateSafetyScoreDto } from '../dto/update-safety-score.dto';
import { QueryDriverDto } from '../dto/query-driver.dto';
import {
  DriverResponseDto,
  DriverStatisticsResponseDto,
  PaginatedDriversResponseDto,
} from '../dto';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @RequirePermissions('DRIVER:CREATE')
  @ApiOperation({
    summary: 'Create driver',
    description: 'Creates a new driver profile. Employee code, email, phone, and license number must be unique.',
  })
  @ApiBody({ type: CreateDriverDto })
  @ApiResponse({ status: 201, description: 'Driver created', type: DriverResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed or business rule violated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Duplicate unique field' })
  create(@Body() dto: CreateDriverDto, @CurrentUser() user?: JwtPayload) {
    return this.driverService.create(dto, user);
  }

  @Get()
  @RequirePermissions('DRIVER:VIEW')
  @ApiOperation({
    summary: 'List drivers',
    description: 'Paginated driver list with search, filters, and sorting. Soft-deleted drivers are excluded.',
  })
  @ApiResponse({ status: 200, description: 'Drivers retrieved', type: PaginatedDriversResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryDriverDto) {
    return this.driverService.findAll(query);
  }

  @Get('available')
  @RequirePermissions('DRIVER:VIEW')
  @ApiOperation({
    summary: 'List available drivers',
    description: 'Returns drivers with Available status and a non-expired license. Intended for Trip assignment.',
  })
  @ApiResponse({ status: 200, description: 'Available drivers', type: [DriverResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAvailable() {
    return this.driverService.getAvailableDrivers();
  }

  @Get('statistics')
  @RequirePermissions('DRIVER:VIEW')
  @ApiOperation({
    summary: 'Driver statistics',
    description: 'Aggregate counts for dashboard cards including license-expiring and average safety score.',
  })
  @ApiResponse({ status: 200, description: 'Statistics', type: DriverStatisticsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics() {
    return this.driverService.getDriverStatistics();
  }

  @Get(':id')
  @RequirePermissions('DRIVER:VIEW')
  @ApiOperation({
    summary: 'Get driver details',
    description: 'Returns a single driver by id. Soft-deleted drivers are not returned.',
  })
  @ApiParam({ name: 'id', description: 'Driver MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Driver found', type: DriverResponseDto })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.driverService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('DRIVER:UPDATE')
  @ApiOperation({ summary: 'Update driver', description: 'Partial update of driver profile fields.' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateDriverDto })
  @ApiResponse({ status: 200, description: 'Driver updated', type: DriverResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({ status: 409, description: 'Duplicate unique field' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.driverService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('DRIVER:DELETE')
  @ApiOperation({
    summary: 'Soft-delete driver',
    description: 'Marks the driver as deleted. Deleted drivers never appear in list endpoints.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Driver soft-deleted' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.driverService.softDelete(id, user);
  }

  @Patch(':id/status')
  @RequirePermissions('DRIVER:UPDATE')
  @ApiOperation({
    summary: 'Update driver status',
    description:
      'Updates operational status. Suspended drivers and expired licenses cannot become Available.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateDriverStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated', type: DriverResponseDto })
  @ApiResponse({ status: 400, description: 'Business rule violated' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDriverStatusDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.driverService.updateDriverStatus(id, dto.status, user);
  }

  @Patch(':id/safety-score')
  @RequirePermissions('DRIVER:UPDATE')
  @ApiOperation({
    summary: 'Update safety score',
    description: 'Sets driver safety score in the range 0–100.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateSafetyScoreDto })
  @ApiResponse({ status: 200, description: 'Safety score updated', type: DriverResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid score' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  updateSafetyScore(
    @Param('id') id: string,
    @Body() dto: UpdateSafetyScoreDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.driverService.updateSafetyScore(id, dto.safetyScore, user);
  }
}
