import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { RoleCode, UserAccountStatus } from '@transitops/shared-types';
import { RoleSchema } from '../../schemas/role.schema';
import { UserSchema } from '../../schemas/user.schema';
import { DriverSchema } from '../../modules/driver/schema/driver.schema';
import { buildDemoDrivers } from '../../modules/driver/seeds/driver.seed';
import { VehicleSchema } from '../../modules/fleet/schema/vehicle.schema';
import { buildDemoVehicles } from '../../modules/fleet/seeds/vehicle.seed';
import { DEFAULT_ROLES } from './roles.seed';
import { TEST_USERS } from './test-users.seed';
import { seedTripDispatcherData } from './trip.seed';
import { seedMaintenanceAndVehicles } from './maintenance.seed';
import {
  buildAdminDemoUsers,
  buildDemoAuditLogs,
  buildPermissionCatalog,
} from './admin.seed';
import { PermissionSchema } from '../../schemas/permission.schema';
import { AuditLogSchema } from '../../schemas/audit-log.schema';
import { AppSettingsSchema } from '../../schemas/app-settings.schema';

loadEnv({ path: resolve(__dirname, '../../../.env') });

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);
  const RoleModel = mongoose.model('Role', RoleSchema);
  const UserModel = mongoose.model('User', UserSchema);
  const PermissionModel =
    mongoose.models.Permission ?? mongoose.model('Permission', PermissionSchema);
  const AuditLogModel =
    mongoose.models.AuditLog ?? mongoose.model('AuditLog', AuditLogSchema);
  const AppSettingsModel =
    mongoose.models.AppSettings ?? mongoose.model('AppSettings', AppSettingsSchema);
  const DriverModel = mongoose.models.Driver ?? mongoose.model('Driver', DriverSchema);

  console.log('Seeding roles...');
  const roleIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const role of DEFAULT_ROLES) {
    const doc = await RoleModel.findOneAndUpdate(
      { code: role.code },
      { $set: role },
      { upsert: true, new: true },
    );
    roleIds[role.code] = doc._id as mongoose.Types.ObjectId;
  }

  console.log('Seeding permission catalog...');
  const catalog = buildPermissionCatalog();
  for (const permission of catalog) {
    await PermissionModel.findOneAndUpdate(
      { code: permission.code },
      { $set: permission },
      { upsert: true, new: true },
    );
  }
  console.log(`  ✓ ${catalog.length} permissions`);

  await AppSettingsModel.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default' } },
    { upsert: true, new: true },
  );
  console.log('  ✓ app settings');

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@transitops.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'System';
  const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Admin';

  console.log(`Seeding admin user (${email})...`);
  const passwordHash = await bcrypt.hash(password, 12);
  await UserModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roles: [roleIds[RoleCode.SUPER_ADMIN]],
        status: UserAccountStatus.ACTIVE,
        isDeleted: false,
      },
    },
    { upsert: true, new: true },
  );
  console.log(`  ✓ ${email} (SUPER_ADMIN)`);

  console.log('Seeding test users for fuel & expense module...');
  for (const user of TEST_USERS) {
    const testPasswordHash = await bcrypt.hash(user.password, 12);
    await UserModel.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        $set: {
          email: user.email.toLowerCase(),
          passwordHash: testPasswordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: [roleIds[RoleCode[user.role]]],
          status: UserAccountStatus.ACTIVE,
          isDeleted: false,
        },
      },
      { upsert: true, new: true },
    );
    console.log(`  ✓ ${user.email} (${user.role})`);
  }

  console.log('Seeding admin demo users...');
  for (const user of buildAdminDemoUsers()) {
    const hash = await bcrypt.hash(user.password, 12);
    await UserModel.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        $set: {
          email: user.email.toLowerCase(),
          passwordHash: hash,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roles: [roleIds[user.role]],
          status: UserAccountStatus.ACTIVE,
          isDeleted: false,
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log('  ✓ 15 demo users');

  const auditCount = await AuditLogModel.countDocuments();
  if (auditCount < 50) {
    console.log('Seeding audit logs...');
    await AuditLogModel.insertMany(buildDemoAuditLogs(email));
    console.log('  ✓ 50 audit logs');
  }

  console.log('Seeding 20 demo drivers...');
  // Legacy shared schema used unique employeeId; module schema uses employeeCode.
  // Drop the stale unique index so upserts without employeeId do not collide on null.
  try {
    await DriverModel.collection.dropIndex('employeeId_1');
    console.log('  ✓ dropped obsolete drivers.employeeId_1 index');
  } catch (err) {
    const code = (err as { code?: number | string }).code;
    if (code !== 27 && code !== 'IndexNotFound') {
      throw err;
    }
  }

  const demoDrivers = buildDemoDrivers(20);
  for (const driver of demoDrivers) {
    await DriverModel.findOneAndUpdate(
      { employeeCode: driver.employeeCode },
      {
        $set: driver,
        $unset: { employeeId: 1 },
      },
      { upsert: true, new: true },
    );
  }

  // Fleet vehicles must exist before trips reference them.
  if (mongoose.models.Vehicle) {
    delete mongoose.models.Vehicle;
  }
  const VehicleModel = mongoose.model('Vehicle', VehicleSchema);

  console.log('Seeding 20 demo fleet vehicles...');
  const demoVehicles = buildDemoVehicles(20);
  for (const vehicle of demoVehicles) {
    await VehicleModel.findOneAndUpdate(
      { vehicleId: vehicle.vehicleId },
      { $set: { ...vehicle, maxCapacity: 15000 + Math.floor(Math.random() * 10000) } },
      { upsert: true, new: true },
    );
  }

  await seedMaintenanceAndVehicles(mongoose);
  await seedTripDispatcherData(mongoose);

  console.log('Seed completed successfully.');
  await mongoose.disconnect();
}

runSeed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
