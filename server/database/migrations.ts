import type { Kysely } from 'kysely'
import { Migrator } from 'kysely/migration'
import type { UserDatabase } from './database.ts'

export async function migrateUserDatabase(db: Kysely<UserDatabase>, schema?: string): Promise<void> {
  const migrator = new Migrator({ db, migrationTableSchema: schema, provider: { async getMigrations() {
    return { '001_user_management': { async up(database: Kysely<unknown>) {
      await database.schema.createTable('user_preferences')
        .addColumn('owner_id', 'varchar(200)', column => column.primaryKey())
        .addColumn('values_json', 'text', column => column.notNull())
        .addColumn('version', 'integer', column => column.notNull())
        .addColumn('schema_version', 'integer', column => column.notNull())
        .addColumn('created_at', 'varchar(30)', column => column.notNull())
        .addColumn('updated_at', 'varchar(30)', column => column.notNull()).execute()
      await database.schema.createTable('continuation_usage')
        .addColumn('context_hash', 'varchar(64)', column => column.primaryKey())
        .addColumn('state', 'varchar(20)', column => column.notNull())
        .addColumn('reservation_id', 'varchar(36)')
        .addColumn('reserved_until', 'varchar(30)')
        .addColumn('expires_at', 'varchar(30)', column => column.notNull())
        .addColumn('updated_at', 'varchar(30)', column => column.notNull()).execute()
      await database.schema.createIndex('continuation_expiry').on('continuation_usage').column('expires_at').execute()
      await database.schema.createTable('account_cleanup')
        .addColumn('owner_id', 'varchar(200)', column => column.primaryKey())
        .addColumn('event_id', 'varchar(200)', column => column.notNull())
        .addColumn('state', 'varchar(20)', column => column.notNull())
        .addColumn('attempts', 'integer', column => column.notNull())
        .addColumn('updated_at', 'varchar(30)', column => column.notNull()).execute()
    } } }
  } } })
  const result = await migrator.migrateToLatest()
  if (result.error) throw new Error('User database migration failed.', { cause: result.error })
}
