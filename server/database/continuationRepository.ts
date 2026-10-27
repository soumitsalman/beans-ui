import { randomUUID } from 'node:crypto'
import type { Kysely } from 'kysely'
import type { UserDatabase } from './database.ts'

export function createContinuationRepository(db: Kysely<UserDatabase>) {
  return {
    async status(context_hash: string): Promise<string | null> {
      const row = await db.selectFrom('continuation_usage').select(['state', 'expires_at']).where('context_hash', '=', context_hash).executeTakeFirst()
      return row && row.expires_at > new Date().toISOString() ? row.state : null
    },
    async reserve(context_hash: string, expires_at: string): Promise<string | null> {
      const reservation_id = randomUUID()
      const now = new Date().toISOString()
      const reserved_until = new Date(Date.now() + 120_000).toISOString()
      return db.transaction().execute(async (transaction) => {
        await transaction.deleteFrom('continuation_usage').where('context_hash', '=', context_hash).where('expires_at', '<=', now).execute()
        const inserted = await transaction.insertInto('continuation_usage')
          .values({ context_hash, state: 'reserved', reservation_id, reserved_until, expires_at, updated_at: now })
          .onConflict(conflict => conflict.column('context_hash').doNothing()).executeTakeFirst()
        if (Number(inserted.numInsertedOrUpdatedRows) === 1) return reservation_id
        const updated = await transaction.updateTable('continuation_usage').set({ state: 'reserved', reservation_id, reserved_until, updated_at: now })
          .where('context_hash', '=', context_hash).where('state', '!=', 'consumed')
          .where(expression => expression.or([expression('state', '=', 'released'), expression('reserved_until', '<=', now)]))
          .executeTakeFirst()
        return Number(updated.numUpdatedRows) === 1 ? reservation_id : null
      })
    },
    async complete(context_hash: string, reservation_id: string): Promise<boolean> {
      const now = new Date().toISOString()
      const result = await db.updateTable('continuation_usage').set({ state: 'consumed', reservation_id: null, reserved_until: null, updated_at: now })
        .where('context_hash', '=', context_hash).where('state', '=', 'reserved').where('reservation_id', '=', reservation_id)
        .where('reserved_until', '>', now).executeTakeFirst()
      return Number(result.numUpdatedRows) === 1
    },
    async release(context_hash: string, reservation_id: string): Promise<void> {
      await db.updateTable('continuation_usage').set({ state: 'released', reservation_id: null, reserved_until: null, updated_at: new Date().toISOString() })
        .where('context_hash', '=', context_hash).where('state', '=', 'reserved').where('reservation_id', '=', reservation_id).execute()
    }
  }
}
