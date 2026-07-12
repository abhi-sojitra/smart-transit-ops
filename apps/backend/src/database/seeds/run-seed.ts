import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { RoleCode, UserAccountStatus } from '@transitops/shared-types';
import { RoleSchema } from '../../schemas/role.schema';
import { UserSchema } from '../../schemas/user.schema';
import { DriverSchema } from '../../modules/driver/schema/driver.schema';
import { buildDemoDrivers } from '../../modules/driver/seeds/driver.seed';
import { DEFAULT_ROLES } from './roles.seed';
import { TEST_USERS } from './test-users.seed';
import { seedTripDispatcherData } from './trip.seed';

loadEnv({ path: resolve(__dirname, '../../../.env') });

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);
  const RoleModel = mongoose.model('Role', RoleSchema);
  const UserModel = mongoose.model('User', UserSchema);
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
        },
      },
      { upsert: true, new: true },
    );
    console.log(`  ✓ ${user.email} (${user.role})`);
  }

  console.log('Seeding 20 demo drivers...');
  const demoDrivers = buildDemoDrivers(20);
  for (const driver of demoDrivers) {
    await DriverModel.findOneAndUpdate(
      { employeeCode: driver.employeeCode },
      { $set: driver },
      { upsert: true, new: true },
    );
  }

  await seedTripDispatcherData(mongoose);

  console.log('Seed completed successfully.');
  await mongoose.disconnect();
}

runSeed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
