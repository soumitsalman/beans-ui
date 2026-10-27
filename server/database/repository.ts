import { sql, type Kysely } from 'kysely'
import type { UserDatabase } from './database.ts'
import type { PreferenceValues, UserPreference } from '../../shared/userPreferences.ts'

export function createPreferenceRepository(db: Kysely<UserDatabase>) {
  return {
    async readPreference(owner_id: string): Promise<UserPreference | null> {
      const row = await db.selectFrom('user_preferences').selectAll().where('owner_id', '=', owner_id).executeTakeFirst()
      return row?.values_json ? { ...JSON.parse(row.values_json) as PreferenceValues, version: row.version, updated_at: row.updated_at } : null
    },
    async savePreference(owner_id: string, values: PreferenceValues, version: number): Promise<UserPreference | null> {
      const now = new Date().toISOString()
      return db.transaction().execute(async (transaction) => {
        // This owner row serializes saves against deletion without provider-specific locks.
        await transaction.insertInto('account_cleanup').values({ owner_id, event_id: '', state: 'active', attempts: 0, updated_at: now })
          .onConflict(conflict => conflict.column('owner_id').doNothing()).execute()
        const owner = await transaction.updateTable('account_cleanup').set({ updated_at: now }).where('owner_id', '=', owner_id).where('state', '=', 'active').executeTakeFirst()
        if (Number(owner.numUpdatedRows) !== 1) return null
        if (version === 0) {
          const existing = await transaction.selectFrom('user_preferences').select(['values_json', 'version']).where('owner_id', '=', owner_id).executeTakeFirst()
          if (existing?.values_json) return null
          if (!existing) {
            await transaction.insertInto('user_preferences').values({ owner_id, values_json: JSON.stringify(values), version: 1, schema_version: 1, created_at: now, updated_at: now }).execute()
            return { ...values, version: 1, updated_at: now }
          }
          await transaction.updateTable('user_preferences').set({ values_json: JSON.stringify(values), version: existing.version + 1, updated_at: now }).where('owner_id', '=', owner_id).execute()
          return { ...values, version: existing.version + 1, updated_at: now }
        }
        const result = await transaction.updateTable('user_preferences').set({ values_json: JSON.stringify(values), version: version + 1, updated_at: now })
          .where('owner_id', '=', owner_id).where('version', '=', version).where('values_json', '!=', '').executeTakeFirst()
        return Number(result.numUpdatedRows) === 1 ? { ...values, version: version + 1, updated_at: now } : null
      })
    },
    async clearPreference(owner_id: string, version: number): Promise<boolean> {
      // Keep a version tombstone so old edits cannot match a newly created preference.
      const result = await db.updateTable('user_preferences').set({ values_json: '', version: sql`version + 1`, updated_at: new Date().toISOString() }).where('owner_id', '=', owner_id).where('version', '=', version).where('values_json', '!=', '').executeTakeFirst()
      return Number(result.numUpdatedRows) === 1
    },
    async queueCleanup(owner_id: string, event_id: string): Promise<void> {
      await db.insertInto('account_cleanup').values({ owner_id, event_id, state: 'pending', attempts: 0, updated_at: new Date().toISOString() })
        .onConflict(conflict => conflict.column('owner_id').doUpdateSet({ event_id, state: 'pending', updated_at: new Date().toISOString() })).execute()
    },
    async cleanupAccount(owner_id: string, event_id: string): Promise<void> {
      await db.transaction().execute(async (transaction) => {
        const now = new Date().toISOString()
        await transaction.insertInto('account_cleanup').values({ owner_id, event_id, state: 'pending', attempts: 1, updated_at: now })
          .onConflict(conflict => conflict.column('owner_id').doUpdateSet({ state: 'pending', attempts: sql`account_cleanup.attempts + 1`, updated_at: now })).execute()
        await transaction.deleteFrom('user_preferences').where('owner_id', '=', owner_id).execute()
        await transaction.updateTable('account_cleanup').set({ state: 'complete', event_id, updated_at: now }).where('owner_id', '=', owner_id).execute()
      })
    }
  }
}
