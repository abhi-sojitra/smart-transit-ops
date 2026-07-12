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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from '@transitops/shared-types';
import { TripService } from '../service/trip.service';
import {
  CancelTripDto,
  CompleteTripDto,
  CreateTripDto,
  QueryTripDto,
  UpdateTripDto,
} from '../dto/trip.dto';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../common/guards/auth.guards';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @RequirePermissions('TRIP:CREATE')
  @ApiOperation({ summary: 'Create a trip (Draft)' })
  @ApiResponse({ status: 201, description: 'Trip created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateTripDto, @CurrentUser() user: JwtPayload) {
    return this.tripService.createTrip(dto, user);
  }

  @Get()
  @RequirePermissions('TRIP:VIEW')
  @ApiOperation({ summary: 'List trips with search, filters, sort, pagination' })
  findAll(@Query() query: QueryTripDto, @CurrentUser() user: JwtPayload) {
    return this.tripService.findAll(query, user);
  }

  @Get('statistics')
  @RequirePermissions('TRIP:VIEW')
  @ApiOperation({ summary: 'Trip statistics dashboard metrics' })
  statistics(@CurrentUser() user: JwtPayload) {
    return this.tripService.getTripStatistics(user);
  }

  @Get('available/vehicles')
  @RequirePermissions('TRIP:DISPATCH')
  @ApiOperation({ summary: 'List vehicles available for dispatch' })
  availableVehicles() {
    return this.tripService.getAvailableVehicles();
  }

  @Get('available/drivers')
  @RequirePermissions('TRIP:DISPATCH')
  @ApiOperation({ summary: 'List drivers available for dispatch' })
  availableDrivers() {
    return this.tripService.getAvailableDrivers();
  }

  @Get(':id')
  @RequirePermissions('TRIP:VIEW')
  @ApiOperation({ summary: 'Get trip by id' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tripService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('TRIP:UPDATE')
  @ApiOperation({ summary: 'Update a draft trip' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tripService.updateTrip(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('TRIP:DELETE')
  @ApiOperation({ summary: 'Soft delete a trip' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tripService.softDelete(id, user);
  }

  @Patch(':id/dispatch')
  @RequirePermissions('TRIP:DISPATCH')
  @ApiOperation({ summary: 'Dispatch trip and mark vehicle/driver On Trip' })
  dispatch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tripService.dispatchTrip(id, user);
  }

  @Patch(':id/start')
  @RequirePermissions('TRIP:DISPATCH')
  @ApiOperation({ summary: 'Start a dispatched trip (In Progress)' })
  start(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tripService.startTrip(id, user);
  }

  @Patch(':id/complete')
  @RequirePermissions('TRIP:COMPLETE')
  @ApiOperation({ summary: 'Complete trip and restore vehicle/driver availability' })
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteTripDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tripService.completeTrip(id, dto, user);
  }

  @Patch(':id/cancel')
  @RequirePermissions('TRIP:CANCEL')
  @ApiOperation({ summary: 'Cancel trip and restore vehicle/driver availability' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelTripDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tripService.cancelTrip(id, dto, user);
  }
}
