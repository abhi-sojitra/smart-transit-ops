import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { RoleCode } from '@transitops/shared-types';
import { RoleSchema } from '../../schemas/role.schema';
import { UserSchema } from '../../schemas/user.schema';

loadEnv({ path: resolve(__dirname, '../../../.env') });

/** Collections left untouched (except users, which is filtered). */
const PRESERVED_COLLECTIONS = new Set(['roles', 'app_settings']);

async function wipeDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not ready');
  }

  const RoleModel = mongoose.models.Role ?? mongoose.model('Role', RoleSchema);
  const UserModel = mongoose.models.User ?? mongoose.model('User', UserSchema);

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@transitops.com').toLowerCase();
  const superAdminRole = await RoleModel.findOne({ code: RoleCode.SUPER_ADMIN })
    .select('_id')
    .lean<{ _id: mongoose.Types.ObjectId }>();
  const superAdminRoleId = superAdminRole?._id;

  console.log('Wiping database (preserving roles, app settings, and admin user)...');
  console.log(`  Admin email kept: ${adminEmail}`);
  if (superAdminRoleId) {
    console.log(`  SUPER_ADMIN role id kept on users: ${String(superAdminRoleId)}`);
  }

  const collections = await db.listCollections().toArray();
  const results: Array<{ name: string; deleted: number | string }> = [];

  for (const { name } of collections) {
    if (name.startsWith('system.')) {
      continue;
    }

    if (PRESERVED_COLLECTIONS.has(name)) {
      const count = await db.collection(name).countDocuments();
      results.push({ name, deleted: `preserved (${count} docs)` });
      console.log(`  ✓ ${name} — preserved (${count} docs)`);
      continue;
    }

    if (name === 'users') {
      const filter: Record<string, unknown> = {
        $and: [
          { email: { $ne: adminEmail } },
          ...(superAdminRoleId
            ? [{ roles: { $nin: [superAdminRoleId] } }]
            : []),
        ],
      };
      const { deletedCount } = await UserModel.deleteMany(filter);
      const kept = await UserModel.countDocuments();
      results.push({ name, deleted: deletedCount ?? 0 });
      console.log(`  ✓ users — deleted ${deletedCount ?? 0}, kept ${kept}`);
      continue;
    }

    const { deletedCount } = await db.collection(name).deleteMany({});
    results.push({ name, deleted: deletedCount ?? 0 });
    console.log(`  ✓ ${name} — deleted ${deletedCount ?? 0}`);
  }

  const keptUsers = await UserModel.find({}, { email: 1, roles: 1 }).lean();
  console.log('\nDone. Remaining users:');
  for (const user of keptUsers) {
    console.log(`  - ${user.email}`);
  }

  const roleCount = await RoleModel.countDocuments();
  console.log(`Remaining roles: ${roleCount}`);
  console.log(
    `Remaining app_settings: ${await db.collection('app_settings').countDocuments()}`,
  );

  return results;
}

wipeDatabase()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Wipe failed:', err);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
