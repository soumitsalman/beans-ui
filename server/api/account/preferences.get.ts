import { createPreferenceRepository } from '../../database/repository'
import { getUserDatabase } from '../../utils/userDatabase'
import { requireSessionUser } from '../../utils/userSession'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  const owner_id = requireSessionUser(event)
  try {
    return { preference: await createPreferenceRepository(getUserDatabase()).readPreference(owner_id) }
  } catch { throw createError({ statusCode: 503, statusMessage: 'Preferences could not be loaded. Please retry.' }) }
})
