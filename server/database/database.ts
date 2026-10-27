import { Kysely, PostgresDialect, SqliteDialect } from 'kysely'
import pg from 'pg'
import Sqlite from 'better-sqlite3'

export interface PreferenceRecord {
  owner_id: string
  values_json: string
  version: number
  schema_version: number
  created_at: string
  updated_at: string
}
export interface ContinuationRecord {
  context_hash: string
  state: string
  reservation_id: string | null
  reserved_until: string | null
  expires_at: string
  updated_at: string
}
export interface CleanupRecord {
  owner_id: string
  event_id: string
  state: string
  attempts: number
  updated_at: string
}
export interface UserDatabase {
  user_preferences: PreferenceRecord
  continuation_usage: ContinuationRecord
  account_cleanup: CleanupRecord
}
export function createUserDatabase(connection: string): Kysely<UserDatabase> {
  if (/^postgres(?:ql)?:\/\//.test(connection)) return new Kysely<UserDatabase>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: connection, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 5000 }) }) })
  if (connection.startsWith('sqlite:')) return new Kysely<UserDatabase>({ dialect: new SqliteDialect({ database: new Sqlite(connection.slice(7) || ':memory:') }) })
  throw new Error('User database configuration is unavailable.')
}
