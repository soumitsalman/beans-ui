import { loadEnvFile } from 'node:process'
import { createUserDatabase } from '../server/database/database.ts'
import { migrateUserDatabase } from '../server/database/migrations.ts'
import { createPreferenceRepository } from '../server/database/repository.ts'

try {
  loadEnvFile()
} catch { /* Deployment can supply environment directly. */ }
const database = createUserDatabase(process.env.BEANS_APP_USER_DB || '')
try {
  if (process.argv[2] === 'migrate') {
    await migrateUserDatabase(database)
    console.info('User database migrations complete.')
  } else if (process.argv[2] === 'reconcile') {
    const rows = await database.selectFrom('account_cleanup').select(['owner_id', 'event_id']).where('state', '=', 'pending').execute()
    for (const row of rows)
      await createPreferenceRepository(database).cleanupAccount(row.owner_id, row.event_id)
    const expired = await database.deleteFrom('continuation_usage').where('expires_at', '<=', new Date().toISOString()).executeTakeFirst()
    console.info(`Reconciled ${rows.length} cleanup records; removed ${expired.numDeletedRows} expired continuation records.`)
  } else
    throw new Error('Use migrate or reconcile.')
} catch {
  console.error('User database operation failed. Check configuration and database access.')
  process.exitCode = 1
} finally {
  await database.destroy()
}
