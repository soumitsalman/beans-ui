import { createUserDatabase } from '../database/database'

let _database: ReturnType<typeof createUserDatabase> | undefined
export function getUserDatabase() {
  if (!_database) {
    const connection = process.env.NUXT_USER_DB?.trim() || process.env.BEANS_APP_USER_DB?.trim() || useRuntimeConfig().user_db
    _database = createUserDatabase(connection)
  }
  return _database
}
export async function closeUserDatabase() {
  await _database?.destroy()
  _database = undefined
}
