import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../common/guards/auth.guards';
import {
  CancelMaintenanceDto,
  CompleteMaintenanceDto,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
} from '../dto/create-maintenance.dto';
import { QueryMaintenanceDto } from '../dto/query-maintenance.dto';
import { MaintenanceService } from '../service/maintenance.service';

const uploadDir = join(process.cwd(), 'uploads', 'maintenance');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @RequirePermissions('MAINTENANCE:CREATE')
  @ApiOperation({
    summary: 'Create maintenance record',
    description:
      'Creates a maintenance job and sets the vehicle status to MAINTENANCE (In Shop). Rejects if the vehicle already has active maintenance.',
  })
  @ApiBody({
    type: CreateMaintenanceDto,
    examples: {
      preventive: {
        summary: 'Preventive service',
        value: {
          vehicleId: '665f1a2b3c4d5e6f7a8b9c0d',
          maintenanceType: 'PREVENTIVE',
          title: 'Scheduled 10k mile service',
          description: 'Full preventive inspection',
          priority: 'MEDIUM',
          startDate: '2026-07-12',
          expectedCompletionDate: '2026-07-15',
          estimatedCost: 850.5,
          vendorName: 'FleetCare Motors',
          vendorPhone: '+1-555-0142',
          serviceCenter: 'Downtown Service Center',
          odometerReading: 84210,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Maintenance created',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          id: '665f1a2b3c4d5e6f7a8b9c1e',
          maintenanceNumber: 'MNT-2026-0001',
          status: 'SCHEDULED',
          estimatedCost: 850.5,
        },
      },
    },
  })
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user?: JwtPayload) {
    return this.maintenanceService.createMaintenance({
      ...dto,
      createdBy: user?.sub,
    });
  }

  @Get()
  @RequirePermissions('MAINTENANCE:VIEW')
  @ApiOperation({
    summary: 'List maintenance records',
    description: 'Supports pagination, search, filters (status, priority, type, vehicle, date range), and sorting.',
  })
  @ApiOkResponse({
    description: 'Paginated maintenance list',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: [],
        meta: { page: 1, limit: 10, total: 30, totalPages: 3 },
      },
    },
  })
  findAll(@Query() query: QueryMaintenanceDto) {
    return this.maintenanceService.findAll(query);
  }

  @Get('statistics')
  @RequirePermissions('MAINTENANCE:VIEW')
  @ApiOperation({
    summary: 'Maintenance statistics',
    description:
      'Returns KPI totals: active, completed, overdue, vehicles in shop, monthly/yearly cost, average repair time.',
  })
  @ApiOkResponse({
    description: 'Statistics payload',
    schema: {
      example: {
        success: true,
        data: {
          totalRecords: 30,
          active: 8,
          completed: 18,
          overdue: 2,
          vehiclesInShop: 5,
          costThisMonth: 12450.5,
          costThisYear: 98200,
          averageRepairTimeDays: 2.4,
        },
      },
    },
  })
  statistics() {
    return this.maintenanceService.getMaintenanceStatistics();
  }

  @Get('lookups/vehicles')
  @RequirePermissions('MAINTENANCE:VIEW')
  @ApiOperation({
    summary: 'Vehicles lookup for maintenance forms',
    description: 'Returns non-deleted vehicles for selection. Does not replace the Vehicle Module.',
  })
  async vehicleLookup() {
    return this.maintenanceService.listVehiclesForLookup();
  }

  @Get('vehicle/:vehicleId/history')
  @RequirePermissions('MAINTENANCE:VIEW')
  @ApiOperation({ summary: 'Vehicle maintenance history' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ObjectId' })
  vehicleHistory(@Param('vehicleId') vehicleId: string) {
    return this.maintenanceService.getVehicleMaintenanceHistory(vehicleId);
  }

  @Get('vehicle/:vehicleId/in-maintenance')
  @RequirePermissions('MAINTENANCE:VIEW')
  @ApiOperation({
    summary: 'Check if vehicle is in active maintenance',
    description: 'Reusable by Trip/Dispatch to exclude vehicles in shop.',
  })
  async isInMaintenance(@Param('vehicleId') vehicleId: string) {
    const inMaintenance = await this.maintenanceService.isVehicleInMaintenance(vehicleId);
    return { vehicleId, inMaintenance };
  }

  @Get(':id')
  @RequirePermissions('MAINTENANCE:VIEW')
  @ApiOperation({ summary: 'Get maintenance details' })
  @ApiParam({ name: 'id', description: 'Maintenance ObjectId' })
  async findOne(@Param('id') id: string) {
    const data = await this.maintenanceService.findById(id);
    return {
      ...data,
      timeline: this.maintenanceService.getTimeline(data),
    };
  }

  @Patch(':id')
  @RequirePermissions('MAINTENANCE:UPDATE')
  @ApiOperation({
    summary: 'Update maintenance',
    description: 'Completed records may only update notes.',
  })
  @ApiBody({ type: UpdateMaintenanceDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const { vehicleId: _ignored, ...rest } = dto as UpdateMaintenanceDto & { vehicleId?: string };
    return this.maintenanceService.updateMaintenance(id, {
      ...rest,
      updatedBy: user?.sub,
    });
  }

  @Delete(':id')
  @RequirePermissions('MAINTENANCE:DELETE')
  @ApiOperation({ summary: 'Soft delete maintenance record' })
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.maintenanceService.softDelete(id, user?.sub);
  }

  @Patch(':id/start')
  @RequirePermissions('MAINTENANCE:UPDATE')
  @ApiOperation({
    summary: 'Start maintenance (mark In Progress)',
    description: 'Moves a Scheduled work order to In Progress and keeps the vehicle In Shop.',
  })
  @ApiOkResponse({
    description: 'Maintenance started',
    schema: {
      example: {
        success: true,
        data: { id: '…', status: 'IN_PROGRESS' },
      },
    },
  })
  start(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.maintenanceService.startMaintenance(id, user?.sub);
  }

  @Patch(':id/complete')
  @RequirePermissions('MAINTENANCE:COMPLETE')
  @ApiOperation({
    summary: 'Close / complete maintenance',
    description: 'Sets status to COMPLETED and restores vehicle to AVAILABLE (unless Retired).',
  })
  @ApiBody({ type: CompleteMaintenanceDto })
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.maintenanceService.completeMaintenance(id, {
      ...dto,
      updatedBy: user?.sub,
    });
  }

  @Patch(':id/cancel')
  @RequirePermissions('MAINTENANCE:UPDATE')
  @ApiOperation({
    summary: 'Cancel maintenance',
    description: 'Cancels the job and restores vehicle availability when no other active work remains.',
  })
  @ApiBody({ type: CancelMaintenanceDto })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelMaintenanceDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.maintenanceService.cancelMaintenance(id, {
      ...dto,
      updatedBy: user?.sub,
    });
  }

  @Post(':id/attachments')
  @RequirePermissions('MAINTENANCE:UPDATE')
  @ApiOperation({ summary: 'Upload maintenance attachments (images and PDFs only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: uploadDir,
        filename: (
          _req: unknown,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (
        _req: unknown,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        const ext = extname(file.originalname).toLowerCase();
        const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
        if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
          cb(null, true);
          return;
        }
        cb(new Error('Only image and PDF files are allowed') as never, false);
      },
    }),
  )
  uploadAttachments(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.maintenanceService.addAttachments(id, files ?? []);
  }
}
